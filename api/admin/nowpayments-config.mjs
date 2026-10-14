import {
  callNowPayments,
  getNowPaymentsSettings,
  json,
  readBody,
  requireAdmin,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';

export default async function handler(request, response) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return json(response, 401, { error: 'Sessão administrativa inválida.' });

    const current = await getNowPaymentsSettings();

    if (request.method === 'GET') {
      return json(response, 200, {
        enabled: current.enabled,
        sandbox: current.sandbox,
        payCurrency: current.pay_currency,
        hasApiKey: Boolean(current.api_key),
        apiKeyHint: current.api_key ? `••••${current.api_key.slice(-4)}` : '',
        hasIpnSecret: Boolean(current.ipn_secret),
      });
    }

    if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });
    const body = readBody(request);

    if (body.action === 'test') {
      const testSettings = { ...current, api_key: String(body.apiKey || current.api_key).trim(), sandbox: Boolean(body.sandbox ?? current.sandbox) };
      if (!testSettings.api_key) return json(response, 400, { error: 'Informe a API Key da NOWPayments.' });
      const result = await callNowPayments(testSettings, '/currencies');
      const currencies = Array.isArray(result.currencies) ? result.currencies.length : 0;
      return json(response, 200, { success: true, message: `Conexão válida. ${currencies || 'Várias'} moedas disponíveis.` });
    }

    const allowedCurrencies = new Set(['usdttrc20', 'usdtbsc', 'usdterc20', 'usdtmatic']);
    const payCurrency = String(body.payCurrency || current.pay_currency).toLowerCase();
    if (!allowedCurrencies.has(payCurrency)) return json(response, 400, { error: 'Rede USDT inválida.' });

    const nextApiKey = String(body.apiKey || '').trim() || current.api_key;
    const nextIpnSecret = String(body.ipnSecret || '').trim() || current.ipn_secret;
    const enabled = Boolean(body.enabled);
    if (enabled && (!nextApiKey || !nextIpnSecret)) {
      return json(response, 400, { error: 'API Key e IPN Secret são obrigatórios para ativar a NOWPayments.' });
    }

    const { error } = await supabaseAdmin.from('nowpayments_settings').update({
      api_key: nextApiKey,
      ipn_secret: nextIpnSecret,
      enabled,
      sandbox: Boolean(body.sandbox),
      pay_currency: payCurrency,
    }).eq('id', 1);
    if (error) throw error;

    return json(response, 200, {
      success: true,
      enabled,
      sandbox: Boolean(body.sandbox),
      payCurrency,
      hasApiKey: Boolean(nextApiKey),
      apiKeyHint: nextApiKey ? `••••${nextApiKey.slice(-4)}` : '',
      hasIpnSecret: Boolean(nextIpnSecret),
    });
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'Falha ao configurar a NOWPayments.' });
  }
}
