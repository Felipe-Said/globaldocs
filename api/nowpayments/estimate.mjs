import {
  getNowPaymentsQuote,
  getNowPaymentsSettings,
  json,
} from '../../server/nowpayments.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const settings = await getNowPaymentsSettings();
    if (!settings.enabled || !settings.api_key || !settings.ipn_secret) {
      return json(response, 200, { enabled: false });
    }

    const quote = await getNowPaymentsQuote(settings, request.query?.amount);
    return json(response, 200, { enabled: true, ...quote });
  } catch (error) {
    return json(response, error.status || 502, {
      enabled: true,
      error: error.message || 'Não foi possível consultar a cotação em USDT.',
    });
  }
}
