import {
  getNowPaymentsQuote,
  getNowPaymentsSettings,
  enforceRateLimit,
  json,
  requestIdentity,
} from '../../server/nowpayments.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });

  try {
    if (!await enforceRateLimit('crypto-estimate', requestIdentity(request), 30, 60)) {
      response.setHeader('Retry-After', '30');
      return json(response, 429, { enabled: true, error: 'Muitas consultas. Aguarde um instante.' });
    }
    const settings = await getNowPaymentsSettings();
    if (!settings.enabled || !settings.api_key || !settings.ipn_secret) {
      return json(response, 200, { enabled: false });
    }

    const quote = await getNowPaymentsQuote(settings, request.query?.amount);
    return json(response, 200, { enabled: true, ...quote });
  } catch (error) {
    console.error('[crypto:estimate]', { status: error.status || 502, message: error.message || 'unknown error' });
    return json(response, error.status || 502, {
      enabled: true,
      error: 'Não foi possível consultar a cotação em USDT.',
    });
  }
}
