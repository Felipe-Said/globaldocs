// Utility for detecting brands and resolving official SVGs from theSVG (https://thesvg.org)

export interface BrandInfo {
  slug: string;
  name: string;
  url: string;
  keywords: string[];
}

// Base CDN pattern of theSVG library (https://thesvg.org / https://github.com/GLINCKER/thesvg)
const THESVG_CDN_BASE = 'https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons';

export const getBrandLogoUrl = (slug: string, variant: 'default' | 'light' | 'dark' = 'default'): string => {
  return `${THESVG_CDN_BASE}/${slug}/${variant}.svg`;
};

// Mercury official high-res vector in dark navy (#0C1D38) for light mode
const MERCURY_LIGHT_MODE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="18" fill="#0C1D38"/><path d="M50 20c-16.57 0-30 13.43-30 30s13.43 30 30 30 30-13.43 30-30-13.43-30-30-30zm0 48c-9.94 0-18-8.06-18-18s8.06-18 18-18 18 8.06 18 18-8.06 18-18 18z" fill="#4B72FA"/><circle cx="50" cy="50" r="8" fill="#FFFFFF"/></svg>'
)}`;

// Known brands mapping to theSVG icon slugs - All optimized for Light Mode
export const KNOWN_BRANDS: BrandInfo[] = [
  {
    slug: 'stripe',
    name: 'Stripe',
    url: getBrandLogoUrl('stripe'),
    keywords: ['stripe', 'stripe us', 'stripe payments', 'gateway stripe']
  },
  {
    slug: 'notion',
    name: 'Notion',
    url: getBrandLogoUrl('notion'),
    keywords: ['notion', 'notion pro', 'template notion']
  },
  {
    slug: 'figma',
    name: 'Figma',
    url: getBrandLogoUrl('figma'),
    keywords: ['figma', 'figma ui', 'autolayout figma']
  },
  {
    slug: 'wise',
    name: 'Wise',
    url: getBrandLogoUrl('wise'),
    keywords: ['wise', 'transferwise', 'wise business']
  },
  {
    slug: 'paypal',
    name: 'PayPal',
    url: getBrandLogoUrl('paypal'),
    keywords: ['paypal']
  },
  {
    slug: 'microsoft',
    name: 'Microsoft',
    url: getBrandLogoUrl('microsoft'),
    keywords: ['microsoft', 'excel', 'word', 'office', 'powerpoint', 'office 365', 'xlsx', 'docx']
  },
  {
    slug: 'google',
    name: 'Google',
    url: getBrandLogoUrl('google'),
    keywords: ['google', 'google sheets', 'google planilhas', 'google docs', 'google drive']
  },
  {
    slug: 'apple',
    name: 'Apple',
    // In theSVG, 'light.svg' contains dark fill, ensuring 100% visibility on light mode
    url: getBrandLogoUrl('apple', 'light'),
    keywords: ['apple', 'macos', 'ios', 'iphone', 'macbook']
  },
  {
    slug: 'github',
    name: 'GitHub',
    url: getBrandLogoUrl('github'),
    keywords: ['github', 'git repository']
  },
  {
    slug: 'shopify',
    name: 'Shopify',
    url: getBrandLogoUrl('shopify'),
    keywords: ['shopify', 'ecommerce shopify']
  },
  {
    slug: 'slack',
    name: 'Slack',
    url: getBrandLogoUrl('slack'),
    keywords: ['slack']
  },
  {
    slug: 'discord',
    name: 'Discord',
    url: getBrandLogoUrl('discord'),
    keywords: ['discord']
  },
  {
    slug: 'adobe',
    name: 'Adobe',
    url: getBrandLogoUrl('adobe'),
    keywords: ['adobe', 'photoshop', 'illustrator', 'premiere', 'after effects', 'psd']
  },
  {
    slug: 'canva',
    name: 'Canva',
    url: getBrandLogoUrl('canva'),
    keywords: ['canva']
  },
  {
    slug: 'dropbox',
    name: 'Dropbox',
    url: getBrandLogoUrl('dropbox'),
    keywords: ['dropbox']
  },
  {
    slug: 'whatsapp',
    name: 'WhatsApp',
    url: getBrandLogoUrl('whatsapp'),
    keywords: ['whatsapp']
  },
  {
    slug: 'openai',
    name: 'OpenAI',
    // In theSVG, 'light.svg' contains dark fill, preventing white-on-white vanishing
    url: getBrandLogoUrl('openai', 'light'),
    keywords: ['openai', 'chatgpt', 'gpt-4', 'dall-e']
  },
  {
    slug: 'amazon',
    name: 'Amazon / AWS',
    url: getBrandLogoUrl('amazon'),
    keywords: ['amazon', 'aws', 'amazon web services']
  },
  {
    slug: 'trello',
    name: 'Trello',
    url: getBrandLogoUrl('trello'),
    keywords: ['trello']
  },
  {
    slug: 'jira',
    name: 'Jira',
    url: getBrandLogoUrl('jira'),
    keywords: ['jira']
  },
  {
    slug: 'zoom',
    name: 'Zoom',
    url: getBrandLogoUrl('zoom'),
    keywords: ['zoom']
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    url: getBrandLogoUrl('linkedin'),
    keywords: ['linkedin']
  },
  {
    slug: 'mercury',
    name: 'Mercury',
    url: MERCURY_LIGHT_MODE_SVG,
    keywords: ['mercury', 'mercury bank']
  },
  {
    slug: 'brex',
    name: 'Brex',
    url: getBrandLogoUrl('brex'),
    keywords: ['brex']
  },
  {
    slug: 'revolut',
    name: 'Revolut',
    url: getBrandLogoUrl('revolut'),
    keywords: ['revolut']
  }
];

/**
 * Automatically detects which brands are mentioned in a product or text block.
 * Uses whole-word boundary matching to prevent false positives.
 */
export function detectBrands(source: {
  title?: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  features?: string[];
  accountDetails?: string | string[];
  format?: string;
  [key: string]: any;
} | string): BrandInfo[] {
  let combinedText = '';

  if (typeof source === 'string') {
    combinedText = source.toLowerCase();
  } else {
    const accountStr = Array.isArray(source.accountDetails)
      ? source.accountDetails.join(' ')
      : (source.accountDetails || '');

    combinedText = [
      source.title || '',
      source.tagline || '',
      source.description || '',
      ...(source.tags || []),
      ...(source.features || []),
      source.format || '',
      accountStr,
    ]
      .join(' ')
      .toLowerCase();
  }

  const detected: BrandInfo[] = [];

  for (const brand of KNOWN_BRANDS) {
    const matches = brand.keywords.some(keyword => {
      // Escape special characters in keyword
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match whole word or bounded expression
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      return regex.test(combinedText);
    });

    if (matches) {
      detected.push(brand);
    }
  }

  return detected;
}
