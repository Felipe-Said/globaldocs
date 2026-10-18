import {
  callNowPayments,
  enforceRateLimit,
  getNowPaymentsSettings,
  json,
  orderForClient,
  publicPayment,
  requireCustomer,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';
import { verifyFinalPayment } from '../../server/payment-security.mjs';
import { fulfillNpprOrder } from '../../server/nppr.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const customer = await requireCustomer(request);
    if (!customer) return json(response, 401, { error: 'Sessão inválida.' });
    if (!await enforceRateLimit('crypto-status', customer.id, 30, 60)) {
      response.setHeader('Retry-After', '30');
      return json(response, 429, { error: 'Aguarde um instante antes de consultar novamente.' });
    }
    const orderId = String(request.query.orderId || '').trim();
    if (!orderId) return json(response, 400, { error: 'Pedido inválido.' });

    const { data: order } = await supabaseAdmin.from('orders')
      .select('id,total,status,payment_method,customer_user_id,created_at')
      .eq('id', orderId).eq('customer_user_id', customer.id).eq('payment_method', 'crypto').single();
    if (!order) return json(response, 404, { error: 'Pedido não encontrado.' });
    if (order.status === 'cancelled') return json(response, 410, { error: 'Este pedido foi cancelado.', orderCancelled: true });
    if (order.status === 'pending' && Date.now() - new Date(order.created_at).getTime() >= 24 * 60 * 60 * 1000) {
      await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id).eq('status', 'pending');
      return json(response, 410, { error: 'Este pedido expirou após 24 horas sem pagamento.', orderCancelled: true });
    }

    const { data: stored } = await supabaseAdmin.from('nowpayments_payments')
      .select('*').eq('order_id', orderId).single();
    if (!stored) return json(response, 404, { error: 'Cobrança não encontrada.' });

    const settings = await getNowPaymentsSettings();
    let provider;
    try {
      provider = await callNowPayments(settings, `/payment/${encodeURIComponent(stored.payment_id)}`, { method: 'GET' });
    } catch (error) {
      console.error('[crypto:status:provider-unavailable]', { paymentId: stored.payment_id, status: error.status || 502 });
      return json(response, 200, { ...publicPayment(stored), orderPaid: order.status === 'paid', verificationPending: true });
    }

    const status = String(provider.payment_status || stored.payment_status);
    const sameIdentity = String(provider.payment_id || '') === String(stored.payment_id)
      && String(provider.order_id || '') === order.id
      && String(provider.pay_currency || '').toLowerCase() === String(stored.pay_currency || '').toLowerCase();
    if (!sameIdentity) {
      console.error('[crypto:status:identity-mismatch]', { paymentId: stored.payment_id, orderId: order.id });
      return json(response, 200, { ...publicPayment(stored), orderPaid: order.status === 'paid', verificationPending: true });
    }

    let paid = order.status === 'paid';
    let verificationPending = false;
    if (status === 'finished' && !paid) {
      const verification = verifyFinalPayment({ provider, stored, expectedOrderId: order.id, expectedPriceAmount: order.total });
      if (verification.valid) {
        const { data: paidOrder } = await supabaseAdmin.from('orders').update({ status: 'paid' })
          .eq('id', order.id).eq('payment_method', 'crypto').eq('status', 'pending').select('id').maybeSingle();
        if (paidOrder) {
          paid = true;
        } else {
          const { data: currentOrder } = await supabaseAdmin.from('orders').select('status').eq('id', order.id).single();
          paid = currentOrder?.status === 'paid';
        }
      } else {
        verificationPending = true;
        console.error('[crypto:status:reconciliation-failed]', { paymentId: stored.payment_id, reason: verification.reason });
      }
    }

    const updates = {
      payment_status: status,
      actually_paid: provider.actually_paid ?? provider.amount_received ?? stored.actually_paid ?? 0,
      raw_response: provider,
    };
    const { data: updated } = await supabaseAdmin.from('nowpayments_payments').update(updates)
      .eq('payment_id', stored.payment_id).select('*').single();

    if (paid) await fulfillNpprOrder(order.id);
    let paidOrder;
    if (paid) {
      const { data } = await supabaseAdmin.from('orders').select('*').eq('id', order.id).single();
      if (data) paidOrder = orderForClient({ ...data, status: 'paid' });
    }

    return json(response, 200, {
      ...publicPayment(updated || { ...stored, ...updates }), orderPaid: paid, order: paidOrder, verificationPending,
    });
  } catch (error) {
    console.error('[crypto:status]', { status: error.status || 500, message: error.message || 'unknown error' });
    return json(response, error.status || 500, { error: 'Não foi possível consultar o pagamento.' });
  }
}
