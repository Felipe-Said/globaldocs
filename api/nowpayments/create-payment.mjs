import {
  callNowPayments,
  getNowPaymentsQuote,
  getNowPaymentsSettings,
  json,
  publicPayment,
  readBody,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';

const callbackUrl = request => {
  const configured = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) return `${configured.startsWith('http') ? configured : `https://${configured}`}/api/nowpayments/ipn`;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  return `https://${host}/api/nowpayments/ipn`;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const body = readBody(request);
    const orderId = String(body.orderId || '').trim();
    const downloadToken = String(body.downloadToken || '').trim();
    if (!orderId || !downloadToken) return json(response, 400, { error: 'Pedido inválido.' });

    const settings = await getNowPaymentsSettings();
    if (!settings.enabled || !settings.api_key || !settings.ipn_secret) {
      return json(response, 503, { error: 'Pagamento em cripto ainda não foi ativado pelo administrador.' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id,total,status,payment_method,download_token,items')
      .eq('id', orderId)
      .eq('download_token', downloadToken)
      .eq('payment_method', 'crypto')
      .single();
    if (orderError || !order) return json(response, 404, { error: 'Pedido não encontrado.' });
    if (order.status === 'paid') return json(response, 409, { error: 'Este pedido já foi pago.' });

    const quote = await getNowPaymentsQuote(settings, order.total);
    if (!quote.meetsMinimum) {
      return json(response, 422, {
        error: `O valor mínimo atual da NOWPayments é ${quote.minAmount.toLocaleString('pt-BR', { maximumFractionDigits: 6 })} ${settings.pay_currency.toUpperCase()}.`,
        minimumAmount: quote.minAmount,
        estimatedAmount: quote.estimatedAmount,
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('nowpayments_payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    if (existing && !['failed', 'expired', 'refunded'].includes(existing.payment_status)) {
      return json(response, 200, publicPayment(existing));
    }
    if (existing) {
      await supabaseAdmin.from('nowpayments_payments').delete().eq('payment_id', existing.payment_id);
    }

    const description = (order.items || []).map(item => item.productTitle).filter(Boolean).join(', ').slice(0, 240);
    const payment = await callNowPayments(settings, '/payment', {
      method: 'POST',
      body: JSON.stringify({
        price_amount: Number(order.total),
        price_currency: 'brl',
        pay_currency: settings.pay_currency,
        ipn_callback_url: callbackUrl(request),
        order_id: order.id,
        order_description: description || `Pedido ${order.id}`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    });

    const row = {
      payment_id: String(payment.payment_id),
      order_id: order.id,
      payment_status: payment.payment_status,
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      actually_paid: payment.actually_paid || payment.amount_received || 0,
      purchase_id: payment.purchase_id ? String(payment.purchase_id) : null,
      raw_response: payment,
      expires_at: payment.expiration_estimate_date || null,
    };
    const { data: saved, error: saveError } = await supabaseAdmin.from('nowpayments_payments').insert(row).select('*').single();
    if (saveError) throw saveError;

    return json(response, 201, publicPayment(saved));
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'Não foi possível criar a cobrança em cripto.' });
  }
}
