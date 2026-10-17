import { json, readBody, requireCustomer, supabaseAdmin } from '../../server/nowpayments.mjs';
import { fulfillNpprOrder } from '../../server/nppr.mjs';

export default async function handler(request, response) {
  try {
    if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });
    const customer = await requireCustomer(request);
    if (!customer) return json(response, 401, { error: 'Sessão do cliente inválida.' });
    const orderId = String(readBody(request).orderId || '');
    const { data: order } = await supabaseAdmin.from('orders').select('id').eq('id', orderId).eq('customer_user_id', customer.id).eq('status', 'paid').maybeSingle();
    if (!order) return json(response, 404, { error: 'Pedido pago não encontrado.' });
    return json(response, 200, await fulfillNpprOrder(order.id));
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'Não foi possível concluir a entrega automática.' });
  }
}
