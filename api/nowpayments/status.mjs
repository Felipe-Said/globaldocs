import {
  callNowPayments,
  getNowPaymentsSettings,
  isPaidStatus,
  json,
  orderForClient,
  publicPayment,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const orderId = String(request.query.orderId || '').trim();
    const downloadToken = String(request.query.downloadToken || '').trim();
    if (!orderId || !downloadToken) return json(response, 400, { error: 'Pedido inválido.' });

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id,status,download_token')
      .eq('id', orderId)
      .eq('download_token', downloadToken)
      .single();
    if (!order) return json(response, 404, { error: 'Pedido não encontrado.' });

    const { data: stored } = await supabaseAdmin
      .from('nowpayments_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();
    if (!stored) return json(response, 404, { error: 'Cobrança não encontrada.' });

    const settings = await getNowPaymentsSettings();
    let provider = null;
    try {
      provider = await callNowPayments(settings, `/payment/${encodeURIComponent(stored.payment_id)}`, { method: 'GET' });
    } catch {
      provider = stored.raw_response;
    }

    const status = provider.payment_status || stored.payment_status;
    const updates = {
      payment_status: status,
      actually_paid: provider.actually_paid || provider.amount_received || stored.actually_paid || 0,
      raw_response: provider,
    };
    const { data: updated } = await supabaseAdmin
      .from('nowpayments_payments')
      .update(updates)
      .eq('payment_id', stored.payment_id)
      .select('*')
      .single();

    const paid = isPaidStatus(status) || order.status === 'paid';
    if (isPaidStatus(status) && order.status !== 'paid') {
      await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', order.id);
    }

    let paidOrder;
    if (paid) {
      const { data } = await supabaseAdmin.from('orders').select('*').eq('id', order.id).single();
      if (data) paidOrder = orderForClient({ ...data, status: 'paid' });
    }

    return json(response, 200, { ...publicPayment(updated || { ...stored, ...updates }), orderPaid: paid, order: paidOrder });
  } catch (error) {
    return json(response, 500, { error: error.message || 'Não foi possível consultar o pagamento.' });
  }
}
