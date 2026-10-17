import { json, readBody, requireAdmin, requireCustomer, supabaseAdmin } from '../server/nowpayments.mjs';
import { callNppr, fulfillNpprOrder, getNpprSettings, syncNpprCatalog } from '../server/nppr.mjs';

const publicSettings = settings => ({
  enabled: settings.enabled,
  autoFulfill: settings.auto_fulfill,
  publishProducts: settings.publish_products,
  usdBrlRate: Number(settings.usd_brl_rate),
  markupPercent: Number(settings.markup_percent),
  hasApiKey: Boolean(settings.api_key),
  apiKeyHint: settings.api_key ? `••••${settings.api_key.slice(-4)}` : '',
  lastTestedAt: settings.last_tested_at,
  lastSyncAt: settings.last_sync_at,
});

const readAllActiveProducts = async () => {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin.from('products').select('*')
      .eq('active', true).order('created_at', { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
};

export default async function handler(request, response) {
  try {
    const body = readBody(request);
    if (request.method === 'GET' && request.query.action === 'catalog') {
      const [productRows, collections, banners, settings] = await Promise.all([
        readAllActiveProducts(),
        supabaseAdmin.from('collections').select('*').eq('active', true).order('created_at'),
        supabaseAdmin.from('banners').select('*').eq('active', true).order('sort_order'),
        supabaseAdmin.from('store_settings').select('data').eq('id', 1).maybeSingle(),
      ]);
      const catalogError = collections.error || banners.error || settings.error;
      if (catalogError) throw catalogError;
      return json(response, 200, {
        products: productRows,
        collections: collections.data || [],
        banners: banners.data || [],
        settings: settings.data?.data || {},
      });
    }
    if (request.method === 'POST' && body.action === 'fulfill') {
      const admin = await requireAdmin(request);
      if (admin) {
        const orderId = String(body.orderId || '');
        const { data: order } = await supabaseAdmin.from('orders').select('id').eq('id', orderId).eq('status', 'paid').maybeSingle();
        if (!order) return json(response, 404, { error: 'Pedido pago não encontrado.' });
        const result = await fulfillNpprOrder(order.id, { force: true });
        return json(response, 200, {
          success: result.failed === 0 && !result.skipped,
          ...result,
          message: result.insufficientBalance
            ? 'Saldo da integração insuficiente. Adicione saldo e tente novamente.'
            : result.failed > 0
              ? 'Alguns itens não puderam ser processados. Consulte o aviso do pedido.'
              : result.skipped
                ? 'A integração está desativada ou sem credencial. Revise a configuração e tente novamente.'
                : result.completed > 0 ? 'Pedido processado e entrega liberada.' : 'Nenhum item aguardava processamento.',
        });
      }
      const customer = await requireCustomer(request);
      if (!customer) return json(response, 401, { error: 'Sessão do cliente inválida.' });
      const orderId = String(body.orderId || '');
      const { data: order } = await supabaseAdmin.from('orders').select('id').eq('id', orderId).eq('customer_user_id', customer.id).eq('status', 'paid').maybeSingle();
      if (!order) return json(response, 404, { error: 'Pedido pago não encontrado.' });
      const result = await fulfillNpprOrder(order.id);
      return json(response, 200, { processing: result.failed > 0 || result.skipped, completed: result.completed });
    }

    if (!await requireAdmin(request)) return json(response, 401, { error: 'Sessão administrativa inválida.' });
    const current = await getNpprSettings();
    if (request.method === 'GET') {
      const [{ data: fulfillments, error: fulfillmentError }, balanceResult] = await Promise.all([
        supabaseAdmin.from('nppr_fulfillments').select('order_id,product_id,status,failure_code,error_message,updated_at').order('updated_at', { ascending: false }).limit(2000),
        current.enabled && current.api_key
          ? callNppr(current.api_key, '/balance').then(data => ({ data })).catch(error => ({ error }))
          : Promise.resolve({ data: null }),
      ]);
      if (fulfillmentError) throw fulfillmentError;
      return json(response, 200, {
        ...publicSettings(current),
        balance: balanceResult.data ? {
          currency: balanceResult.data.currency || 'USD',
          primary: Number(balanceResult.data.primaryBalance || 0),
          cashback: Number(balanceResult.data.cashbackBalance || 0),
          total: Number(balanceResult.data.totalBalance || 0),
          fetchedAt: new Date().toISOString(),
        } : null,
        balanceError: balanceResult.error ? 'Não foi possível consultar o saldo agora.' : null,
        fulfillments: fulfillments || [],
      });
    }
    if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });
    const apiKey = String(body.apiKey || '').trim() || current.api_key;

    if (body.action === 'test') {
      if (!apiKey) return json(response, 400, { error: 'Informe a API Key da NPPR Team.' });
      const [balance, categories] = await Promise.all([callNppr(apiKey, '/balance'), callNppr(apiKey, '/categories')]);
      await supabaseAdmin.from('nppr_settings').update({ last_tested_at: new Date().toISOString() }).eq('id', 1);
      return json(response, 200, {
        success: true,
        message: `Conexão válida. Saldo disponível: ${Number(balance.totalBalance || 0).toFixed(2)} ${balance.currency || 'USD'} • ${Array.isArray(categories) ? categories.length : 0} categorias.`,
      });
    }

    if (body.action === 'sync') {
      if (!current.api_key) return json(response, 400, { error: 'Salve a API Key antes de sincronizar.' });
      const result = await syncNpprCatalog(current);
      return json(response, 200, { success: true, ...result, message: `${result.total} produtos em ${result.categories} coleções: ${result.created} novos e ${result.updated} atualizados.` });
    }

    const usdBrlRate = Number(body.usdBrlRate);
    const markupPercent = Number(body.markupPercent);
    if (!apiKey) return json(response, 400, { error: 'Informe a API Key da NPPR Team.' });
    if (!Number.isFinite(usdBrlRate) || usdBrlRate <= 0) return json(response, 400, { error: 'Informe uma cotação USD/BRL válida.' });
    if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 1000) return json(response, 400, { error: 'A margem deve ficar entre 0% e 1000%.' });
    const { data, error } = await supabaseAdmin.from('nppr_settings').update({
      api_key: apiKey,
      enabled: Boolean(body.enabled),
      auto_fulfill: Boolean(body.autoFulfill),
      publish_products: Boolean(body.publishProducts),
      usd_brl_rate: usdBrlRate,
      markup_percent: markupPercent,
    }).eq('id', 1).select('*').single();
    if (error) throw error;
    return json(response, 200, { success: true, ...publicSettings(data), message: 'Configuração da NPPR Team salva.' });
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'Falha na integração com a NPPR Team.' });
  }
}
