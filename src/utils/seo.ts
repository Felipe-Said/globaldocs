import { DigitalProduct, Collection } from '../types';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'product' | 'article';
  ogImage?: string;
  jsonLd?: Record<string, any>;
}

export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // remove caracteres invalidos
    .replace(/\s+/g, '-') // espacos para hifens
    .replace(/-+/g, '-'); // colapsa hifens duplicados
};

export const getBaseSiteUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://globaldocs.com.br';
};

/**
 * Atualiza meta tags dinâmicas no documento (Title, Description, OpenGraph, Twitter, Schema.org)
 */
export const updateDocumentSEO = (seo: SEOData) => {
  if (typeof document === 'undefined') return;

  // 1. Title
  document.title = seo.title;

  // Helper para setar/atualizar meta tag
  const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  // 2. Standard Meta Tags
  setMetaTag('name', 'description', seo.description);
  if (seo.keywords) {
    setMetaTag('name', 'keywords', seo.keywords);
  }
  setMetaTag('name', 'robots', 'index, follow');

  // 3. Open Graph
  const baseUrl = getBaseSiteUrl();
  const canonical = seo.canonicalUrl || baseUrl;
  setMetaTag('property', 'og:title', seo.title);
  setMetaTag('property', 'og:description', seo.description);
  setMetaTag('property', 'og:type', seo.ogType || 'website');
  setMetaTag('property', 'og:url', canonical);
  setMetaTag('property', 'og:site_name', 'GlobalDOCS');
  setMetaTag('property', 'og:locale', 'pt_BR');
  if (seo.ogImage) {
    setMetaTag('property', 'og:image', seo.ogImage);
  }

  // 4. Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', seo.title);
  setMetaTag('name', 'twitter:description', seo.description);
  if (seo.ogImage) {
    setMetaTag('name', 'twitter:image', seo.ogImage);
  }

  // 5. Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonical;

  // 6. JSON-LD Schema.org Structured Data
  let jsonLdScript = document.getElementById('schema-json-ld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'schema-json-ld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }

  if (seo.jsonLd) {
    jsonLdScript.textContent = JSON.stringify(seo.jsonLd);
  } else {
    // Default Organization & Store JSON-LD
    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'OnlineBusiness',
      name: 'GlobalDOCS',
      url: baseUrl,
      description: 'Plataforma oficial de arquivos digitais, contratos legais, formação de LLC americana e estruturas globais prontas para operar.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
      }
    };
    jsonLdScript.textContent = JSON.stringify(defaultSchema);
  }
};

/**
 * Cria metadados de SEO e JSON-LD específico para um produto ou serviço
 */
export const buildProductSEO = (product: DigitalProduct, baseUrl = getBaseSiteUrl()): SEOData => {
  const slug = product.slug || slugify(product.title);
  const canonicalUrl = `${baseUrl}/?item=${product.id}#${slug}`;

  const title = product.seoTitle 
    ? `${product.seoTitle} | GlobalDOCS`
    : `${product.title} — ${product.productType.toUpperCase()} | GlobalDOCS`;

  const description = product.seoDescription || product.tagline || product.description.slice(0, 160);

  const keywords = product.seoKeywords || [
    product.title,
    product.productType,
    product.category,
    ...(product.tags || []),
    'GlobalDOCS',
    'download imediato',
    'pronta entrega'
  ].join(', ');

  // Schema.org Product / Service
  const isService = (product.productType || '').toLowerCase().includes('serviço') ||
    (product.productType || '').toLowerCase().includes('consultoria') ||
    (product.productType || '').toLowerCase().includes('assessoria');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isService ? 'Service' : 'Product',
    name: product.title,
    description: description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'GlobalDOCS'
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'BRL',
      price: product.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'GlobalDOCS'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 5.0,
      reviewCount: product.reviewsCount || 1,
      bestRating: 5,
      worstRating: 1
    }
  };

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    ogType: 'product',
    jsonLd
  };
};

/**
 * Gera o XML do Sitemap completo com todas as páginas, coleções e produtos/serviços
 */
export const generateSitemapXml = (
  products: DigitalProduct[], 
  collections: Collection[] = [],
  baseUrl = getBaseSiteUrl()
): string => {
  const currentDate = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Home
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Área do cliente
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/conta</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;

  // 3. Coleções
  collections.filter(c => c.active).forEach(col => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/?colecao=${col.slug || col.id}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += `  </url>\n`;
  });

  // 4. Produtos e Serviços (Ranqueamento individual)
  products.filter(p => p.active).forEach(product => {
    const slug = product.slug || slugify(product.title);
    const lastMod = product.updatedAt ? product.updatedAt.split('T')[0] : currentDate;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/?item=${product.id}#${slug}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
};

/**
 * Função utilitária para baixar o sitemap.xml gerado em tempo real
 */
export const downloadSitemapXml = (products: DigitalProduct[], collections: Collection[], baseUrl?: string) => {
  const xml = generateSitemapXml(products, collections, baseUrl);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
