import { getNowPaymentsSettings, json } from '../server/nowpayments.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const crypto = await getNowPaymentsSettings();
    return json(response, 200, {
      // Pix and card do not have a server-side processor yet. Keeping them
      // disabled prevents a simulated checkout from being presented as real.
      pix: { enabled: false },
      card: { enabled: false },
      crypto: {
        enabled: Boolean(crypto.enabled && crypto.api_key && crypto.ipn_secret),
        payCurrency: crypto.pay_currency,
        sandbox: crypto.sandbox,
      },
    });
  } catch {
    return json(response, 200, {
      pix: { enabled: false },
      card: { enabled: false },
      crypto: { enabled: false, payCurrency: 'usdttrc20', sandbox: false },
    });
  }
}
