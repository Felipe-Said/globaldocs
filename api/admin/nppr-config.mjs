import { json, readBody, requireAdmin, supabaseAdmin } from '../../server/nowpayments.mjs';
import { callNppr, getNpprSettings, syncNpprCatalog } from '../../server/nppr.mjs';

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

export default async function handler(request, response) {
  try {
    if (!await requireAdmin(request)) return json(response, 401, { error: 'Sessão administrativa inválida.' });
    const current = await getNpprSettings();
    if (request.method === 'GET') return json(response, 200, publicSettings(current));
    if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });
    const body = readBody(request);
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
      return json(response, 200, { success: true, ...result, message: `${result.total} produtos lidos: ${result.created} novos e ${result.updated} atualizados.` });
    }

    const usdBrlRate = Number(body.usdBrlRate);
    const markupPercent = Number(body.markupPercent);
    if (!apiKey) return json(response, 400, { error: 'Informe a API Key da NPPR Team.' });
    if (!Number.isFinite(usdBrlRate) || usdBrlRate <= 0) return json(response, 400, { error: 'Informe uma cotação USD/BRL válida.' });
    if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 1000) return json(response, 400, { error: 'A margem deve ficar entre 0% e 1000%.' });
    const next = {
      api_key: apiKey,
      enabled: Boolean(body.enabled),
      auto_fulfill: Boolean(body.autoFulfill),
      publish_products: Boolean(body.publishProducts),
      usd_brl_rate: usdBrlRate,
      markup_percent: markupPercent,
    };
    const { data, error } = await supabaseAdmin.from('nppr_settings').update(next).eq('id', 1).select('*').single();
    if (error) throw error;
    return json(response, 200, { success: true, ...publicSettings(data), message: 'Configuração da NPPR Team salva.' });
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'Falha ao configurar a NPPR Team.' });
  }
}
