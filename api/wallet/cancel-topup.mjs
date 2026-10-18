import {
  callNowPayments,
  getNowPaymentsSettings,
  isPaidStatus,
  json,
  publicPayment,
  readBody,
  requireCustomer,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const customer = await requireCustomer(request);
    if (!customer) return json(response, 401, { error: 'Sessão inválida.' });

    const topUpId = String(readBody(request).topUpId || '').trim();
    if (!topUpId) return json(response, 400, { error: 'Recarga inválida.' });

    const { data: topup } = await supabaseAdmin
      .from('wallet_topups')
      .select('*')
      .eq('id', topUpId)
      .eq('user_id', customer.id)
      .single();
    if (!topup) return json(response, 404, { error: 'Recarga não encontrada.' });

    const { data: stored } = await supabaseAdmin
      .from('wallet_topup_payments')
      .select('*')
      .eq('topup_id', topUpId)
      .single();
    if (!stored) return json(response, 404, { error: 'Cobrança não encontrada.' });

    if (topup.status === 'paid') {
      return json(response, 409, { error: 'Esta recarga já foi paga e creditada.' });
    }
    if (topup.status === 'cancelled') {
      return json(response, 200, {
        topUpId: topup.id,
        amount: Number(topup.amount),
        topUpStatus: 'cancelled',
        ...publicPayment(stored),
      });
    }
    if (topup.status !== 'pending') {
      return json(response, 409, { error: 'Esta solicitação já foi encerrada.' });
    }

    let provider = null;
    try {
      const settings = await getNowPaymentsSettings();
      provider = await callNowPayments(settings, `/payment/${encodeURIComponent(stored.payment_id)}`, { method: 'GET' });
    } catch {
      // O cancelamento local continua válido caso o provedor esteja temporariamente indisponível.
    }

    const providerStatus = String(provider?.payment_status || stored.payment_status || 'waiting');
    if (isPaidStatus(providerStatus)) {
      await supabaseAdmin.from('wallet_topup_payments').update({
        payment_status: providerStatus,
        actually_paid: provider?.actually_paid || provider?.amount_received || stored.actually_paid || 0,
        raw_response: provider || stored.raw_response,
      }).eq('payment_id', stored.payment_id);
      const { data: credited, error: creditError } = await supabaseAdmin.rpc('credit_wallet_topup', {
        p_topup_id: topup.id,
        p_provider_payment_id: stored.payment_id,
      });
      if (creditError) throw creditError;
      return json(response, 409, {
        error: 'O pagamento já foi confirmado e o saldo foi creditado.',
        balance: Number(credited.balance),
      });
    }

    const { data: cancelled, error: cancelError } = await supabaseAdmin
      .from('wallet_topups')
      .update({ status: 'cancelled' })
      .eq('id', topup.id)
      .eq('status', 'pending')
      .select('*')
      .single();
    if (cancelError || !cancelled) throw cancelError || new Error('Não foi possível cancelar a solicitação.');

    await supabaseAdmin.from('wallet_topup_payments').update({
      payment_status: 'cancelled_by_customer',
    }).eq('payment_id', stored.payment_id);

    return json(response, 200, {
      topUpId: cancelled.id,
      amount: Number(cancelled.amount),
      topUpStatus: 'cancelled',
      ...publicPayment({ ...stored, payment_status: 'cancelled_by_customer' }),
    });
  } catch (error) {
    return json(response, 500, { error: error.message || 'Não foi possível cancelar a recarga.' });
  }
}
