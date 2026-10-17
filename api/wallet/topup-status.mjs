import {
  callNowPayments,
  getNowPaymentsSettings,
  isPaidStatus,
  json,
  publicPayment,
  requireCustomer,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';

const topupStatus = status => {
  if (isPaidStatus(status)) return 'paid';
  if (['failed', 'expired', 'refunded'].includes(status)) return status;
  return 'pending';
};

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const customer = await requireCustomer(request);
    if (!customer) return json(response, 401, { error: 'Sessão inválida.' });
    const topUpId = String(request.query.topUpId || '').trim();
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

    const settings = await getNowPaymentsSettings();
    let provider;
    try {
      provider = await callNowPayments(settings, `/payment/${encodeURIComponent(stored.payment_id)}`, { method: 'GET' });
    } catch {
      provider = stored.raw_response;
    }

    const status = String(provider.payment_status || stored.payment_status);
    const mappedStatus = topupStatus(status);
    const updates = {
      payment_status: status,
      actually_paid: provider.actually_paid || provider.amount_received || stored.actually_paid || 0,
      raw_response: provider,
    };
    const { data: payment } = await supabaseAdmin
      .from('wallet_topup_payments')
      .update(updates)
      .eq('payment_id', stored.payment_id)
      .select('*')
      .single();

    let balance;
    if (mappedStatus === 'paid') {
      const { data: credited, error: creditError } = await supabaseAdmin.rpc('credit_wallet_topup', {
        p_topup_id: topup.id,
        p_provider_payment_id: stored.payment_id,
      });
      if (creditError) throw creditError;
      balance = Number(credited.balance);
    } else if (mappedStatus !== topup.status) {
      await supabaseAdmin.from('wallet_topups').update({ status: mappedStatus }).eq('id', topup.id);
    }

    return json(response, 200, {
      topUpId: topup.id,
      amount: Number(topup.amount),
      topUpStatus: mappedStatus,
      balance,
      ...publicPayment(payment || { ...stored, ...updates }),
    });
  } catch (error) {
    return json(response, 500, { error: error.message || 'Não foi possível consultar a recarga.' });
  }
}

