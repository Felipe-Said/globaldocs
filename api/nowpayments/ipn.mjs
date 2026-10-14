import crypto from 'node:crypto';
import {
  getNowPaymentsSettings,
  isPaidStatus,
  json,
  readBody,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';

const sortObject = value => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = sortObject(value[key]);
      return result;
    }, {});
  }
  return value;
};

const signaturesMatch = (received, expected) => {
  if (!received || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
};

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const body = readBody(request);
    const settings = await getNowPaymentsSettings();
    const receivedSignature = String(request.headers['x-nowpayments-sig'] || '');
    const expectedSignature = crypto
      .createHmac('sha512', settings.ipn_secret)
      .update(JSON.stringify(sortObject(body)))
      .digest('hex');

    if (!signaturesMatch(receivedSignature, expectedSignature)) {
      return json(response, 401, { error: 'Assinatura IPN inválida.' });
    }

    const paymentId = String(body.payment_id || '');
    const orderId = String(body.order_id || '');
    if (!paymentId || !orderId) return json(response, 400, { error: 'Notificação incompleta.' });

    const { data: existing } = await supabaseAdmin
      .from('nowpayments_payments')
      .select('payment_id,order_id')
      .eq('payment_id', paymentId)
      .eq('order_id', orderId)
      .single();
    if (!existing) return json(response, 404, { error: 'Pagamento desconhecido.' });

    const status = String(body.payment_status || 'waiting');
    await supabaseAdmin.from('nowpayments_payments').update({
      payment_status: status,
      actually_paid: body.actually_paid || body.amount_received || 0,
      raw_response: body,
    }).eq('payment_id', paymentId);

    if (isPaidStatus(status)) {
      await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId).eq('payment_method', 'crypto');
    }

    return json(response, 200, { ok: true });
  } catch (error) {
    return json(response, 500, { error: error.message || 'Falha ao processar IPN.' });
  }
}
