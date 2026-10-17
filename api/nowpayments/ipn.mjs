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

const topupStatus = status => {
  if (isPaidStatus(status)) return 'paid';
  if (['failed', 'expired', 'refunded'].includes(status)) return status;
  return 'pending';
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
      .maybeSingle();

    const status = String(body.payment_status || 'waiting');
    if (existing) {
      await supabaseAdmin.from('nowpayments_payments').update({
        payment_status: status,
        actually_paid: body.actually_paid || body.amount_received || 0,
        raw_response: body,
      }).eq('payment_id', paymentId);

      if (isPaidStatus(status)) {
        await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId).eq('payment_method', 'crypto');
      }
      return json(response, 200, { ok: true });
    }

    const topUpId = orderId.startsWith('wallet_topup:') ? orderId.slice('wallet_topup:'.length) : '';
    const { data: topupPayment } = await supabaseAdmin
      .from('wallet_topup_payments')
      .select('payment_id,topup_id')
      .eq('payment_id', paymentId)
      .eq('topup_id', topUpId || '00000000-0000-0000-0000-000000000000')
      .maybeSingle();
    if (!topupPayment) return json(response, 404, { error: 'Pagamento desconhecido.' });

    await supabaseAdmin.from('wallet_topup_payments').update({
      payment_status: status,
      actually_paid: body.actually_paid || body.amount_received || 0,
      raw_response: body,
    }).eq('payment_id', paymentId);

    if (isPaidStatus(status)) {
      const { error } = await supabaseAdmin.rpc('credit_wallet_topup', {
        p_topup_id: topupPayment.topup_id,
        p_provider_payment_id: paymentId,
      });
      if (error) throw error;
    } else {
      await supabaseAdmin.from('wallet_topups').update({ status: topupStatus(status) }).eq('id', topupPayment.topup_id);
    }

    return json(response, 200, { ok: true });
  } catch (error) {
    return json(response, 500, { error: error.message || 'Falha ao processar IPN.' });
  }
}
