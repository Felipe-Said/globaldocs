import crypto from 'node:crypto';
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

const clean = (value, max = 160) => String(value || '').trim().slice(0, max);

const botIdentity = (userAgent, webdriver) => {
  const value = userAgent.toLowerCase();
  const bots = [
    ['Googlebot', /googlebot|google-inspectiontool/], ['Bingbot', /bingbot/],
    ['Meta', /facebookexternalhit|meta-externalagent|facebot/], ['TikTok', /tiktokspider/],
    ['Amazonbot', /amazonbot/], ['Applebot', /applebot/], ['YandexBot', /yandexbot/],
    ['AhrefsBot', /ahrefsbot/], ['SemrushBot', /semrushbot/], ['Automação', /bot|crawler|spider|headless|phantom|selenium|playwright|puppeteer|curl|wget/],
  ];
  const match = bots.find(([, pattern]) => pattern.test(value));
  if (match) return String(match[0]);
  return webdriver ? 'Automação' : '';
};

const trafficSource = (referrerDomain, utmSource) => {
  if (utmSource) return clean(utmSource, 80);
  const domain = referrerDomain.toLowerCase();
  if (!domain) return 'Direto';
  if (/google\./.test(domain)) return 'Google';
  if (/bing\./.test(domain)) return 'Bing';
  if (/duckduckgo\./.test(domain)) return 'DuckDuckGo';
  if (/instagram\.|facebook\.|fb\./.test(domain)) return 'Meta';
  if (/tiktok\./.test(domain)) return 'TikTok';
  if (/youtube\.|youtu\.be/.test(domain)) return 'YouTube';
  if (/x\.com|twitter\.|t\.co/.test(domain)) return 'X / Twitter';
  if (/whatsapp\.|wa\.me/.test(domain)) return 'WhatsApp';
  if (/telegram\.|t\.me/.test(domain)) return 'Telegram';
  return clean(domain.replace(/^www\./, ''), 80);
};

const trackStoreVisit = async request => {
  const sessionId = clean(request.query.sessionId, 80);
  if (!sessionId || sessionId.length < 16) return;
  const userAgent = clean(request.headers['user-agent'], 500);
  const botName = botIdentity(userAgent, request.query.webdriver === '1');
  const forwardedIp = clean(request.headers['x-forwarded-for']?.split(',')[0], 100);
  const hashSecret = process.env.TRAFFIC_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'globaldocs-traffic';
  const visitorHash = crypto.createHmac('sha256', hashSecret).update(`${forwardedIp}|${userAgent}`).digest('hex');
  let referrerDomain = '';
  try { referrerDomain = new URL(clean(request.query.referrer, 500)).hostname; } catch { /* acesso direto */ }
  const utmSource = clean(request.query.utmSource, 80);
  const deviceType = botName ? 'bot' : /ipad|tablet/i.test(userAgent) ? 'tablet' : /mobile|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';
  const cityHeader = clean(request.headers['x-vercel-ip-city'], 120);
  let city = cityHeader;
  try { city = decodeURIComponent(cityHeader); } catch { /* mantém o cabeçalho original */ }

  const { error } = await supabaseAdmin.from('store_visits').upsert({
    session_id: sessionId,
    visitor_hash: visitorHash,
    visitor_type: botName ? 'bot' : 'human',
    bot_name: botName || null,
    source: trafficSource(referrerDomain, utmSource),
    medium: clean(request.query.utmMedium, 80) || null,
    campaign: clean(request.query.utmCampaign, 120) || null,
    referrer_domain: referrerDomain ? clean(referrerDomain, 160) : null,
    landing_path: clean(request.query.landingPath, 300) || '/',
    country: clean(request.headers['x-vercel-ip-country'], 8) || null,
    region: clean(request.headers['x-vercel-ip-country-region'], 32) || null,
    city: city || null,
    device_type: deviceType,
  }, { onConflict: 'session_id', ignoreDuplicates: true });
  if (error) console.error('[traffic:track]', error.message);
};

export default async function handler(request, response) {
  try {
    const body = readBody(request);
    if (request.method === 'GET' && request.query.action === 'catalog') {
      if (request.query.track === '1') await trackStoreVisit(request);
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
    if (request.method === 'GET' && request.query.action === 'traffic-metrics') {
      if (!await requireAdmin(request)) return json(response, 401, { error: 'Sessão administrativa inválida.' });
      const { data, error } = await supabaseAdmin.rpc('get_store_traffic_metrics', { p_days: 30 });
      if (error) throw error;
      return json(response, 200, data || {});
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
