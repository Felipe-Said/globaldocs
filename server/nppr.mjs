import { supabaseAdmin } from './nowpayments.mjs';

const NPPR_BASE_URL = 'https://npprteam.shop/api/shop';

export const getNpprSettings = async () => {
  const { data, error } = await supabaseAdmin.from('nppr_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
};

export const callNppr = async (apiKey, path, init = {}) => {
  const response = await fetch(`${NPPR_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `O fornecedor respondeu com HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
};

const flattenProducts = payload => Object.entries(payload || {}).flatMap(([category, products]) =>
  Array.isArray(products) ? products.map(product => ({ ...product, category })) : []
);

const money = value => Math.round(Number(value) * 100) / 100;
const publicLabel = value => String(value || '')
  .replace(/\bNPPR(?:\s+Team)?\b/gi, '')
  .replace(/\s{2,}/g, ' ')
  .trim();

const LOCALIZED_TERMS = [
  [/\bGmail accounts\b/gi, 'Contas Gmail'], [/\bGmail account\b/gi, 'Conta Gmail'],
  [/\bGoogle Voice accounts\b/gi, 'Contas Google Voice'], [/\bGoogle Voice account\b/gi, 'Conta Google Voice'],
  [/\bGoogle Ads accounts\b/gi, 'Contas Google Ads'], [/\bGoogle Ads account\b/gi, 'Conta Google Ads'],
  [/\bGoogle accounts\b/gi, 'Contas Google'], [/\bGoogle account\b/gi, 'Conta Google'],
  [/\b(Facebook|Instagram|TikTok|Twitter|Discord|Reddit|LinkedIn|Twitch|Yandex) accounts\b/gi, 'Contas $1'],
  [/\b(Facebook|Instagram|TikTok|Twitter|Discord|Reddit|LinkedIn|Twitch|Yandex) account\b/gi, 'Conta $1'],
  [/\bemail accounts?\b/gi, 'contas de e-mail'], [/\bai accounts?\b/gi, 'contas de IA'],
  [/\bbusiness center\b/gi, 'central de negócios'], [/\bbusiness manager\b/gi, 'gerenciador de negócios'],
  [/\bad accounts?\b/gi, 'contas de anúncios'], [/\brecovery email\b/gi, 'e-mail de recuperação'],
  [/\bverified email\b/gi, 'e-mail verificado'], [/\bemail verified\b/gi, 'e-mail verificado'],
  [/\bemail included\b/gi, 'e-mail incluído'], [/\bmail included\b/gi, 'e-mail incluído'],
  [/\bnot included\b/gi, 'não incluído'], [/\bno access\b/gi, 'sem acesso'],
  [/\bno warranty\b/gi, 'sem garantia'], [/\bwithout vat\b/gi, 'sem IVA'], [/\bno vat\b/gi, 'sem IVA'],
  [/\bare not used\b/gi, 'não utilizados'], [/\bnot used\b/gi, 'não utilizado'],
  [/\bused for ads\b/gi, 'usada para anúncios'], [/\bpayment method not added\b/gi, 'forma de pagamento não adicionada'],
  [/\bmay require\b/gi, 'pode exigir'], [/\bmight require\b/gi, 'pode exigir'], [/\bcan receive\b/gi, 'pode receber'],
  [/\bno replacement available\b/gi, 'sem reposição disponível'], [/\bno replacement\b/gi, 'sem reposição'],
  [/\btest carefully\b/gi, 'teste com cuidado'], [/\bfor Google sign-in only\b/gi, 'somente para login no Google'],
  [/\bfor Google sing-in only\b/gi, 'somente para login no Google'], [/\bnot a full Google account\b/gi, 'não é uma conta Google completa'],
  [/\bnot google account\b/gi, 'não é uma conta Google completa'], [/\bworking for\b/gi, 'funciona por'],
  [/\bpersonal\/business\b/gi, 'pessoal/empresarial'], [/\bprepaid\/postpaid\b/gi, 'pré-paga/pós-paga'],
  [/\bbackup email\b/gi, 'e-mail alternativo'], [/\brecovery mail\b/gi, 'e-mail de recuperação'],
  [/\binbox emails\b/gi, 'e-mails na caixa de entrada'], [/\bapp passwords\b/gi, 'senhas de aplicativo'],
  [/\bno videos?\b/gi, 'sem vídeos'], [/\bold videos?\b/gi, 'vídeos antigos'],
  [/\bautomatic payments?\b/gi, 'pagamento automático'], [/\bautomatic pay\b/gi, 'pagamento automático'],
  [/\bmanual registration\b/gi, 'cadastro manual'], [/\blong-term access\b/gi, 'acesso de longo prazo'],
  [/\bready to use\b/gi, 'pronta para uso'], [/\bfully activated\b/gi, 'totalmente ativada'],
  [/\bprofile is filled\b/gi, 'perfil preenchido'], [/\bphone removed\b/gi, 'telefone removido'],
  [/\benabled\b/gi, 'ativada'], [/\blocked\b/gi, 'bloqueada'], [/\bnew\b/gi, 'nova'], [/\bold\b/gi, 'antiga'],
  [/\bregistration\b/gi, 'cadastro'], [/\bdomains\b/gi, 'domínios'], [/\bdomain\b/gi, 'domínio'],
  [/\border\b/gi, 'pedido'], [/\breplacement\b/gi, 'reposição'], [/\bavailable\b/gi, 'disponível'],
  [/\bmanually\b/gi, 'manualmente'], [/\bmany\b/gi, 'vários'], [/\blanguage\b/gi, 'idioma'],
  [/\bviews\b/gi, 'visualizações'], [/\bvideos\b/gi, 'vídeos'], [/\bvideo\b/gi, 'vídeo'],
  [/\bSpain\b/gi, 'Espanha'], [/\bPoland\b/gi, 'Polônia'], [/\bUkraine\b/gi, 'Ucrânia'], [/\bFrance\b/gi, 'França'],
  [/\bunverified email\b/gi, 'e-mail não verificado'], [/\bcreated\b/gi, 'criada'],
  [/\bregistered\b/gi, 'registrada'], [/\breinstated\b/gi, 'restabelecida'],
  [/\bfarmed\b/gi, 'preparada'], [/\bwarmed up\b/gi, 'aquecida'], [/\baged\b/gi, 'antiga'],
  [/\byears\b/gi, 'anos'], [/\byear\b/gi, 'ano'], [/\bmonths\b/gi, 'meses'], [/\bmonth\b/gi, 'mês'],
  [/\bdays\b/gi, 'dias'], [/\bday\b/gi, 'dia'], [/\bfriends\b/gi, 'amigos'], [/\bfriend\b/gi, 'amigo'],
  [/\bfollowers\b/gi, 'seguidores'], [/\bfollower\b/gi, 'seguidor'], [/\bposts\b/gi, 'publicações'],
  [/\baccounts\b/gi, 'contas'], [/\baccount\b/gi, 'conta'], [/\bgender\b/gi, 'gênero'],
  [/\bfemale\b/gi, 'feminino'], [/\bmale\b/gi, 'masculino'], [/\brandom\b/gi, 'aleatório'],
  [/\bmixed\b/gi, 'misto'], [/\bmix\b/gi, 'misto'], [/\bworldwide\b/gi, 'mundial'],
  [/\bcurrency\b/gi, 'moeda'], [/\bverified\b/gi, 'verificada'], [/\bincluded\b/gi, 'incluído'],
  [/\bpassword\b/gi, 'senha'], [/\bphone\b/gi, 'telefone'],
  [/\band\b/gi, 'e'], [/\bfrom\b/gi, 'de'], [/\bfor\b/gi, 'para'], [/\bother\b/gi, 'outros'],
];

const localizeCatalogText = value => LOCALIZED_TERMS.reduce(
  (text, [pattern, replacement]) => text.replace(pattern, replacement),
  publicLabel(value),
).replace(/\s{2,}/g, ' ').replace(/\s+([,.;:)])/g, '$1').trim();

const includesAny = (value, terms) => terms.some(term => value.includes(term));
const deriveSubcategory = (collectionName, title) => {
  const collection = String(collectionName || '').toLowerCase();
  const text = `${collection} ${String(title || '').toLowerCase()}`;
  if (collection.includes('google')) {
    if (includesAny(text, ['google ads', 'adwords', 'adsense', 'ad account'])) return 'Google Ads';
    if (text.includes('google voice')) return 'Google Voice';
    if (text.includes('youtube')) return 'YouTube';
    if (includesAny(text, ['gmail', 'google mail'])) return 'Gmail';
    if (includesAny(text, ['business profile', 'google business', 'google maps'])) return 'Google Business';
    return 'Outros produtos Google';
  }
  if (collection.includes('email')) {
    if (text.includes('gmail')) return 'Gmail';
    if (includesAny(text, ['outlook', 'hotmail', 'microsoft'])) return 'Outlook & Hotmail';
    if (text.includes('proton')) return 'Proton Mail';
    if (text.includes('yahoo')) return 'Yahoo Mail';
    if (text.includes('mail.com')) return 'Mail.com';
    if (text.includes('firstmail')) return 'Firstmail';
    if (text.includes('yandex')) return 'Yandex Mail';
    return 'Outros provedores';
  }
  if (collection.includes('facebook')) {
    if (includesAny(text, ['business manager', 'business center', ' bm ', 'ad account', 'facebook ads'])) return 'Anúncios & Empresas';
    if (text.includes('marketplace')) return 'Marketplace';
    if (includesAny(text, ['page', 'fanpage'])) return 'Páginas';
    return 'Contas do Facebook';
  }
  if (collection.includes('tiktok')) {
    if (includesAny(text, ['tiktok ads', 'business center', 'ad account'])) return 'TikTok Ads';
    if (text.includes('tiktok shop')) return 'TikTok Shop';
    return 'Contas do TikTok';
  }
  if (collection.includes('instagram')) return text.includes('threads') ? 'Threads' : 'Contas do Instagram';
  if (collection.includes('twitter') || collection.includes('x.com')) return 'Contas do X (Twitter)';
  if (collection.includes('discord')) return text.includes('token') ? 'Contas com Token' : 'Contas do Discord';
  if (collection.includes('reddit')) return text.includes('karma') ? 'Contas com Karma' : 'Contas do Reddit';
  if (collection.includes('other')) {
    for (const brand of ['Spotify', 'CapCut', 'Etsy', 'TextPlus', 'Telegram', 'Pinterest', 'Netflix']) {
      if (text.includes(brand.toLowerCase())) return brand;
    }
    return 'Outros serviços';
  }
  return '';
};

const deriveDeliveryFeatures = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  const features = [];
  if (includesAny(text, ['cookie', 'cookies'])) {
    features.push('Cookies de sessão correspondentes à quantidade comprada');
  } else if (includesAny(text, ['proxy', 'proxies'])) {
    features.push('Dados de conexão correspondentes à quantidade comprada');
  } else if (includesAny(text, [
    'account', 'accounts', 'conta', 'contas', 'login', 'gmail', 'google', 'facebook',
    'instagram', 'tiktok', 'twitter', 'reddit', 'discord', 'linkedin', 'telegram',
    'pinterest', 'youtube', 'twitch', 'spotify', 'netflix', 'outlook', 'hotmail', 'yahoo',
  ])) {
    features.push('Credenciais de acesso correspondentes à quantidade comprada');
  } else {
    features.push('Item digital correspondente à quantidade comprada');
  }
  const inboxUnavailable = includesAny(text, ['no access', 'sem acesso', 'not included', 'não incluído']);
  if (includesAny(text, ['email included', 'mail included', 'e-mail incluído']) && !inboxUnavailable) {
    features.push('E-mail de acesso incluído');
  } else if (includesAny(text, ['email verified', 'verified email', 'e-mail verificado']) && inboxUnavailable) {
    features.push('E-mail verificado sem acesso à caixa, conforme anunciado');
  }
  if (text.includes('2fa')) features.push('Configuração de 2FA conforme a descrição do produto');
  if (text.includes('token')) features.push('Token de acesso quando indicado na descrição');
  features.push('Entrega digital após a confirmação do pagamento');
  return [...new Set(features)];
};

const readAllSupplierProducts = async () => {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin.from('products')
      .select('id,data,featured,supplier_product_id').eq('supplier', 'nppr')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
};

const slugify = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const syncNpprCatalog = async settings => {
  const [categories, productPayload, existingCollectionsResult] = await Promise.all([
    callNppr(settings.api_key, '/categories'),
    callNppr(settings.api_key, '/products'),
    supabaseAdmin.from('collections').select('supplier_collection_id,data').order('created_at'),
  ]);
  if (existingCollectionsResult.error) throw existingCollectionsResult.error;
  const existingCollections = existingCollectionsResult.data || [];
  const existingCollectionData = new Map(existingCollections.map(collection => [
    String(collection.supplier_collection_id || ''), collection.data || {},
  ]));
  const nextCollectionOrder = existingCollections.reduce((highest, collection) =>
    Math.max(highest, Number(collection.data?.homeOrder ?? -1)), -1) + 1;
  const products = flattenProducts(productPayload);
  const activeCategoryIds = new Set(products
    .filter(product => Number(product.qty || 0) >= Math.max(1, Number(product.minimalOrder || 1)))
    .flatMap(product => [String(product.category)]));
  const collectionRows = (Array.isArray(categories) ? categories : []).map((category, index) => {
    const supplierCollectionId = String(category.slug || category.id);
    const name = localizeCatalogText(category.titleEn || category.titleRu || supplierCollectionId) || 'Produtos Digitais';
    const existingData = existingCollectionData.get(supplierCollectionId) || {};
    return {
      supplier: 'nppr',
      supplier_collection_id: supplierCollectionId,
      active: Boolean(settings.publish_products && (
        activeCategoryIds.has(String(category.slug)) || activeCategoryIds.has(String(category.id))
      )),
      data: {
        ...existingData,
        name,
        slug: `catalogo-${slugify(publicLabel(category.slug) || name || category.id)}`,
        description: `Produtos da coleção ${name}, com estoque e preços sincronizados automaticamente.`,
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        supplier: 'nppr',
        supplierCollectionId,
        homeOrder: Number(existingData.homeOrder ?? nextCollectionOrder + index),
      },
    };
  });
  let syncedCollections = [];
  if (collectionRows.length) {
    const { data, error } = await supabaseAdmin.from('collections').upsert(collectionRows, {
      onConflict: 'supplier,supplier_collection_id',
    }).select('id,supplier_collection_id,data');
    if (error) throw error;
    syncedCollections = data || [];
  }
  const collectionIdBySupplierId = new Map(syncedCollections.map(collection => [
    String(collection.supplier_collection_id), collection.id,
  ]));
  for (const category of Array.isArray(categories) ? categories : []) {
    const collectionId = collectionIdBySupplierId.get(String(category.slug || category.id));
    if (!collectionId) continue;
    collectionIdBySupplierId.set(String(category.id), collectionId);
    collectionIdBySupplierId.set(String(category.slug), collectionId);
  }
  const existing = await readAllSupplierProducts();
  const existingBySupplierId = new Map(existing.map(row => [String(row.supplier_product_id), row]));
  const categoryNames = new Map((Array.isArray(categories) ? categories : []).map(category => [
    String(category.slug || category.id), category.titleEn || category.titleRu || category.slug,
  ]));
  let created = 0;
  let updated = 0;
  const rows = [];

  for (const source of products) {
    const supplierProductId = String(source.id || '');
    if (!supplierProductId || !Number.isFinite(Number(source.priceUsd))) continue;
    const current = existingBySupplierId.get(supplierProductId);
    const minimumOrder = Math.max(1, Number(source.minimalOrder || 1));
    const quantity = Math.max(0, Number(source.qty || 0));
    const salePrice = money(Number(source.priceUsd) * Number(settings.usd_brl_rate) * (1 + Number(settings.markup_percent) / 100));
    const originalCategoryTitle = publicLabel(categoryNames.get(String(source.category)) || source.category || 'Catálogo Digital') || 'Catálogo Digital';
    const originalProductTitle = publicLabel(source.titleEn || source.titleRu || `Produto ${supplierProductId}`) || `Produto ${supplierProductId}`;
    const categoryTitle = localizeCatalogText(originalCategoryTitle) || 'Catálogo Digital';
    const productTitle = localizeCatalogText(originalProductTitle) || `Produto ${supplierProductId}`;
    const generated = {
      ...(current?.data || {}),
      title: productTitle,
      tagline: `Entrega digital • ${categoryTitle}`,
      description: productTitle || 'Produto digital fornecido sob demanda.',
      category: 'Contas Digitais',
      productType: 'contas',
      deliveryType: 'digital',
      deliverySpeed: 'immediate',
      collectionId: collectionIdBySupplierId.get(String(source.category)),
      subcategory: deriveSubcategory(originalCategoryTitle, originalProductTitle),
      price: salePrice,
      format: 'PACOTE',
      fileSize: 'Entrega digital',
      version: '',
      unlimitedStock: false,
      stockQuantity: quantity,
      minimumOrder,
      tags: [categoryTitle],
      features: deriveDeliveryFeatures(originalProductTitle, source.descriptionEn || source.descriptionRu || ''),
      downloadFileName: '',
      rating: Number(current?.data?.rating || 5),
      reviewsCount: Number(current?.data?.reviewsCount || 0),
      downloadsCount: Number(current?.data?.downloadsCount || 0),
      supplier: 'nppr',
      supplierProductId,
      supplierCategory: source.category,
      supplierPriceUsd: Number(source.priceUsd),
      supplierUpdatedAt: source.updatedAt || null,
    };
    const active = Boolean(settings.publish_products && quantity >= minimumOrder);
    rows.push({
      supplier: 'nppr',
      supplier_product_id: supplierProductId,
      data: generated,
      active,
      featured: Boolean(current?.featured),
    });
    if (current) updated += 1;
    else created += 1;
  }
  for (let index = 0; index < rows.length; index += 100) {
    const { error } = await supabaseAdmin.from('products').upsert(rows.slice(index, index + 100), {
      onConflict: 'supplier,supplier_product_id',
    });
    if (error) throw error;
  }
  await supabaseAdmin.from('nppr_settings').update({ last_sync_at: new Date().toISOString() }).eq('id', 1);
  return { created, updated, total: products.length, categories: syncedCollections.length };
};

const formatDeliveredItems = items => (Array.isArray(items) ? items : [])
  .map((item, index) => typeof item === 'string' ? item : JSON.stringify(item))
  .map((item, index) => `${index + 1}. ${item}`)
  .join('\n');

export const fulfillNpprOrder = async orderId => {
  const settings = await getNpprSettings();
  if (!settings.enabled || !settings.auto_fulfill || !settings.api_key) return { skipped: true };
  const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
  if (orderError) throw orderError;
  if (order.status !== 'paid') return { skipped: true };
  const productIds = (order.items || []).map(item => item.productId).filter(Boolean);
  if (!productIds.length) return { skipped: true };
  const { data: products, error: productsError } = await supabaseAdmin.from('products').select('id,data').in('id', productIds);
  if (productsError) throw productsError;
  const productById = new Map((products || []).map(product => [product.id, product]));
  let completed = 0;

  for (const orderItem of order.items || []) {
    const product = productById.get(orderItem.productId);
    if (product?.data?.supplier !== 'nppr') continue;
    const fulfillment = {
      order_id: order.id,
      product_id: product.id,
      supplier_product_id: Number(product.data.supplierProductId),
      quantity: Number(orderItem.quantity || 1),
      status: 'processing',
    };
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('nppr_fulfillments').insert(fulfillment).select('*').single();
    if (claimError) {
      if (claimError.code === '23505') continue;
      throw claimError;
    }
    try {
      const supplierOrder = await callNppr(settings.api_key, '/order', {
        method: 'POST',
        body: JSON.stringify({ productId: fulfillment.supplier_product_id, qty: fulfillment.quantity }),
      });
      await supabaseAdmin.from('nppr_fulfillments').update({
        status: 'completed', supplier_order_id: String(supplierOrder.orderId || ''), delivered_items: supplierOrder.items || [], error_message: null,
      }).eq('id', claim.id);
      const { data: freshOrder } = await supabaseAdmin.from('orders').select('items').eq('id', order.id).single();
      const nextItems = (freshOrder?.items || []).map(item => item.productId === product.id ? {
        ...item,
        accessLogins: formatDeliveredItems(supplierOrder.items),
        accessInstructions: 'Credenciais entregues automaticamente após a confirmação do pagamento.',
      } : item);
      await supabaseAdmin.from('orders').update({ items: nextItems }).eq('id', order.id);
      completed += 1;
    } catch (error) {
      await supabaseAdmin.from('nppr_fulfillments').update({ status: 'failed', error_message: error.message }).eq('id', claim.id);
    }
  }
  return { skipped: false, completed };
};
