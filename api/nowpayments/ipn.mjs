import {
  callNowPayments,
  getNowPaymentsSettings,
  json,
  readBody,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';
import { createIpnSignature, signaturesMatch, verifyFinalPayment } from '../../server/payment-security.mjs';
import { fulfillNpprOrder } from '../../server/nppr.mjs';

const topupStatus = status => {
  if (['failed', 'expired', 'refunded'].includes(status)) return status;
  return 'pending';
};

const getAuthoritativePayment = async (settings, paymentId) =>
  callNowPayments(settings, `/payment/${encodeURIComponent(paymentId)}`, { method: 'GET' });

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const body = readBody(request);
    const settings = await getNowPaymentsSettings();
    const receivedSignature = String(request.headers['x-nowpayments-sig'] || '');
    const expectedSignature = createIpnSignature(body, settings.ipn_secret);
    if (!signaturesMatch(receivedSignature, expectedSignature)) {
      console.warn('[crypto:ipn:invalid-signature]');
      return json(response, 401, { error: 'Assinatura IPN inválida.' });
    }

    const paymentId = String(body.payment_id || '');
    const orderId = String(body.order_id || '');
    const status = String(body.payment_status || 'waiting');
    if (!paymentId || !orderId) return json(response, 400, { error: 'Notificação incompleta.' });

    const { data: existing } = await supabaseAdmin.from('nowpayments_payments')
      .select('*').eq('payment_id', paymentId).eq('order_id', orderId).maybeSingle();
    if (existing) {
      if (String(body.pay_currency || '').toLowerCase() !== String(existing.pay_currency || '').toLowerCase()) {
        console.error('[crypto:ipn:currency-mismatch]', { paymentId, orderId });
        return json(response, 409, { error: 'Pagamento divergente.' });
      }

      let authoritative = body;
      if (status === 'finished') {
        authoritative = await getAuthoritativePayment(settings, paymentId);
        const { data: order } = await supabaseAdmin.from('orders')
          .select('id,total,status,payment_method').eq('id', orderId).single();
        if (!order || order.payment_method !== 'crypto') return json(response, 409, { error: 'Pedido divergente.' });
        const verification = verifyFinalPayment({
          provider: authoritative,
          stored: existing,
          expectedOrderId: order.id,
          expectedPriceAmount: order.total,
        });
        if (!verification.valid) {
          console.error('[crypto:ipn:reconciliation-failed]', { paymentId, orderId, reason: verification.reason });
          return json(response, 409, { error: 'Pagamento pendente de verificação.' });
        }
      }

      await supabaseAdmin.from('nowpayments_payments').update({
        payment_status: String(authoritative.payment_status || status),
        actually_paid: authoritative.actually_paid ?? authoritative.amount_received ?? 0,
        raw_response: authoritative,
      }).eq('payment_id', paymentId);

      if (status === 'finished') {
        await supabaseAdmin.from('orders').update({ status: 'paid' })
          .eq('id', orderId).eq('payment_method', 'crypto').eq('status', 'pending').select('id').maybeSingle();
        await fulfillNpprOrder(orderId);
      }
      return json(response, 200, { ok: true });
    }

    const topUpId = orderId.startsWith('wallet_topup:') ? orderId.slice('wallet_topup:'.length) : '';
    const { data: topupPayment } = await supabaseAdmin.from('wallet_topup_payments')
      .select('*').eq('payment_id', paymentId)
      .eq('topup_id', topUpId || '00000000-0000-0000-0000-000000000000').maybeSingle();
    if (!topupPayment) return json(response, 404, { error: 'Pagamento desconhecido.' });
    if (String(body.pay_currency || '').toLowerCase() !== String(topupPayment.pay_currency || '').toLowerCase()) {
      return json(response, 409, { error: 'Pagamento divergente.' });
    }

    let authoritative = body;
    if (status === 'finished') {
      authoritative = await getAuthoritativePayment(settings, paymentId);
      const { data: topup } = await supabaseAdmin.from('wallet_topups')
        .select('id,amount,status').eq('id', topupPayment.topup_id).single();
      if (!topup || topup.status !== 'pending') {
        console.warn('[wallet:ipn:closed-topup]', { paymentId, topUpId: topupPayment.topup_id, status: topup?.status || 'missing' });
        return json(response, 200, { ok: true, ignored: true });
      }
      const verification = verifyFinalPayment({
        provider: authoritative,
        stored: topupPayment,
        expectedOrderId: `wallet_topup:${topup.id}`,
        expectedPriceAmount: topup.amount,
      });
      if (!verification.valid) {
        console.error('[wallet:ipn:reconciliation-failed]', { paymentId, reason: verification.reason });
        return json(response, 409, { error: 'Pagamento pendente de verificação.' });
      }
    }

    await supabaseAdmin.from('wallet_topup_payments').update({
      payment_status: String(authoritative.payment_status || status),
      actually_paid: authoritative.actually_paid ?? authoritative.amount_received ?? 0,
      raw_response: authoritative,
    }).eq('payment_id', paymentId);

    if (status === 'finished') {
      const { error } = await supabaseAdmin.rpc('credit_wallet_topup', {
        p_topup_id: topupPayment.topup_id,
        p_provider_payment_id: paymentId,
      });
      if (error) throw error;
    } else if (status !== 'cancelled_by_customer') {
      await supabaseAdmin.from('wallet_topups').update({ status: topupStatus(status) })
        .eq('id', topupPayment.topup_id).eq('status', 'pending');
    }

    return json(response, 200, { ok: true });
  } catch (error) {
    console.error('[crypto:ipn]', { status: error.status || 500, message: error.message || 'unknown error' });
    return json(response, error.status === 413 || error.status === 415 ? error.status : 503, { error: 'Falha temporária ao processar notificação.' });
  }
}
