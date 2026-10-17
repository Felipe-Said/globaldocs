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
  const [categories, productPayload] = await Promise.all([
    callNppr(settings.api_key, '/categories'),
    callNppr(settings.api_key, '/products'),
  ]);
  const products = flattenProducts(productPayload);
  const activeCategoryIds = new Set(products
    .filter(product => Number(product.qty || 0) >= Math.max(1, Number(product.minimalOrder || 1)))
    .flatMap(product => [String(product.category)]));
  const collectionRows = (Array.isArray(categories) ? categories : []).map(category => {
    const supplierCollectionId = String(category.slug || category.id);
    const name = category.titleEn || category.titleRu || supplierCollectionId;
    return {
      supplier: 'nppr',
      supplier_collection_id: supplierCollectionId,
      active: Boolean(settings.publish_products && (
        activeCategoryIds.has(String(category.slug)) || activeCategoryIds.has(String(category.id))
      )),
      data: {
        name,
        slug: `nppr-${slugify(category.slug || name || category.id)}`,
        description: `Produtos da coleção ${name}, com estoque e preços sincronizados automaticamente.`,
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        supplier: 'nppr',
        supplierCollectionId,
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
    const categoryTitle = categoryNames.get(String(source.category)) || String(source.category || 'Catálogo NPPR');
    const generated = {
      ...(current?.data || {}),
      title: source.titleEn || source.titleRu || `Produto ${supplierProductId}`,
      tagline: `Entrega digital • ${categoryTitle}`,
      description: source.titleEn || source.titleRu || 'Produto digital fornecido sob demanda.',
      category: 'Contas Digitais',
      productType: 'contas',
      deliveryType: 'digital',
      deliverySpeed: 'immediate',
      collectionId: collectionIdBySupplierId.get(String(source.category)),
      price: salePrice,
      format: 'PACOTE',
      fileSize: 'Entrega digital',
      version: '',
      unlimitedStock: false,
      stockQuantity: quantity,
      minimumOrder,
      tags: ['NPPR', categoryTitle],
      features: [`Pedido mínimo: ${minimumOrder}`, `Estoque sincronizado: ${quantity}`],
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
