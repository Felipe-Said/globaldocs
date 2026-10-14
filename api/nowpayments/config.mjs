import { getNowPaymentsSettings, json } from '../../server/nowpayments.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });
  try {
    const settings = await getNowPaymentsSettings();
    return json(response, 200, {
      enabled: Boolean(settings.enabled && settings.api_key && settings.ipn_secret),
      payCurrency: settings.pay_currency,
      sandbox: settings.sandbox,
    });
  } catch {
    return json(response, 200, { enabled: false, payCurrency: 'usdttrc20', sandbox: false });
  }
}
