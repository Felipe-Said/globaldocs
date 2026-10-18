import {
  callNowPayments,
  enforceRateLimit,
  getNowPaymentsQuote,
  getNowPaymentsSettings,
  json,
  publicPayment,
  readBody,
  requireCustomer,
  supabaseAdmin,
} from '../../server/nowpayments.mjs';
import { trustedCallbackUrl } from '../../server/payment-security.mjs';

const topupPaymentForClient = (topup, payment) => ({
  topUpId: topup.id,
  amount: Number(topup.amount),
  topUpStatus: topup.status,
  ...publicPayment(payment),
});

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });

  try {
    const customer = await requireCustomer(request);
    if (!customer) return json(response, 401, { error: 'Entre na sua conta para adicionar saldo.' });
    if (!await enforceRateLimit('wallet-topup-create', customer.id, 5, 600)) {
      return json(response, 429, { error: 'Muitas solicitações de recarga. Aguarde alguns minutos.' });
    }

    const body = readBody(request);
    const amount = Math.round(Number(body.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
      return json(response, 400, { error: 'Informe um valor de recarga entre R$ 1,00 e R$ 100.000,00.' });
    }

    await supabaseAdmin
      .from('wallet_topups')
      .update({ status: 'expired' })
      .eq('user_id', customer.id)
      .eq('status', 'pending')
      .lte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const settings = await getNowPaymentsSettings();
    if (!settings.enabled || !settings.api_key || !settings.ipn_secret) {
      return json(response, 503, { error: 'A recarga via USDT está temporariamente indisponível.' });
    }
    const quote = await getNowPaymentsQuote(settings, amount);
    if (!quote.meetsMinimum) {
      return json(response, 422, {
        error: `O valor informado não atinge o mínimo atual de ${quote.minAmount.toLocaleString('pt-BR', { maximumFractionDigits: 6 })} ${settings.pay_currency.toUpperCase()}.`,
        minimumAmount: quote.minAmount,
        estimatedAmount: quote.estimatedAmount,
      });
    }

    const { data: topup, error: topupError } = await supabaseAdmin
      .from('wallet_topups')
      .insert({ user_id: customer.id, amount, payment_method: 'crypto', status: 'pending' })
      .select('*')
      .single();
    if (topupError || !topup) throw topupError || new Error('Não foi possível iniciar a recarga.');

    try {
      const payment = await callNowPayments(settings, '/payment', {
        method: 'POST',
        body: JSON.stringify({
          price_amount: amount,
          price_currency: 'brl',
          pay_currency: settings.pay_currency,
          ipn_callback_url: trustedCallbackUrl(),
          order_id: `wallet_topup:${topup.id}`,
          order_description: 'Recarga de saldo da carteira',
          is_fixed_rate: true,
          is_fee_paid_by_user: false,
        }),
      });

      const paymentRow = {
        payment_id: String(payment.payment_id),
        topup_id: topup.id,
        payment_status: payment.payment_status,
        pay_address: payment.pay_address,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        actually_paid: payment.actually_paid || payment.amount_received || 0,
        purchase_id: payment.purchase_id ? String(payment.purchase_id) : null,
        raw_response: payment,
        expires_at: payment.expiration_estimate_date || null,
      };
      const { data: saved, error: paymentError } = await supabaseAdmin
        .from('wallet_topup_payments')
        .insert(paymentRow)
        .select('*')
        .single();
      if (paymentError || !saved) throw paymentError || new Error('Não foi possível registrar a cobrança.');

      await supabaseAdmin.from('wallet_topups').update({ provider_payment_id: saved.payment_id }).eq('id', topup.id);
      return json(response, 201, topupPaymentForClient(topup, saved));
    } catch (error) {
      await supabaseAdmin.from('wallet_topups').update({ status: 'failed' }).eq('id', topup.id);
      throw error;
    }
  } catch (error) {
    console.error('[wallet:create-topup]', { status: error.status || 500, message: error.message || 'unknown error' });
    return json(response, error.status || 500, { error: 'Não foi possível gerar a cobrança da recarga. Verifique o valor e tente novamente.' });
  }
}

