import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no servidor.');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
};

export const readBody = request => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string' && request.body) return JSON.parse(request.body);
  return {};
};

export const requireAdmin = async request => {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: membership } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return membership ? userData.user : null;
};

export const requireCustomer = async request => {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
};

export const getNowPaymentsSettings = async () => {
  const { data, error } = await supabaseAdmin
    .from('nowpayments_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
};

export const nowPaymentsBaseUrl = sandbox =>
  sandbox ? 'https://api-sandbox.nowpayments.io/v1' : 'https://api.nowpayments.io/v1';

export const callNowPayments = async (settings, path, init = {}) => {
  const response = await fetch(`${nowPaymentsBaseUrl(settings.sandbox)}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.api_key,
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || payload.error || `NOWPayments respondeu com HTTP ${response.status}.`;
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const getNowPaymentsQuote = async (settings, amount, payCurrency = settings.pay_currency) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    const error = new Error('O valor para cotação deve ser maior que zero.');
    error.status = 400;
    throw error;
  }

  const common = new URLSearchParams({
    currency_from: 'brl',
    currency_to: payCurrency,
    is_fixed_rate: 'true',
    is_fee_paid_by_user: 'false',
  });
  const estimateQuery = new URLSearchParams(common);
  estimateQuery.set('amount', normalizedAmount.toFixed(2));
  const minimumQuery = new URLSearchParams({
    currency_from: payCurrency,
    fiat_equivalent: 'brl',
    is_fixed_rate: 'true',
    is_fee_paid_by_user: 'false',
  });

  const [estimate, minimum] = await Promise.all([
    callNowPayments(settings, `/estimate?${estimateQuery.toString()}`),
    callNowPayments(settings, `/min-amount?${minimumQuery.toString()}`),
  ]);

  const estimatedAmount = Number(estimate.estimated_amount);
  const minAmount = Number(minimum.min_amount || 0);
  if (!Number.isFinite(estimatedAmount) || estimatedAmount <= 0) {
    const error = new Error('A NOWPayments não retornou uma cotação válida para esta moeda.');
    error.status = 502;
    throw error;
  }

  return {
    amount: normalizedAmount,
    estimatedAmount,
    payCurrency,
    minAmount: Number.isFinite(minAmount) ? minAmount : 0,
    meetsMinimum: !Number.isFinite(minAmount) || minAmount <= 0 || estimatedAmount >= minAmount,
  };
};

export const publicPayment = payment => ({
  paymentId: String(payment.payment_id),
  status: payment.payment_status,
  payAddress: payment.pay_address,
  payAmount: payment.pay_amount === null ? null : Number(payment.pay_amount),
  payCurrency: payment.pay_currency,
  actuallyPaid: Number(payment.actually_paid || 0),
  expiresAt: payment.expires_at,
});

export const isPaidStatus = status => status === 'finished';

export const orderForClient = order => ({
  id: order.id,
  customerName: order.customer_name,
  customerEmail: order.customer_email,
  customerDocument: order.customer_document,
  shippingAddress: order.shipping_address || undefined,
  items: order.items || [],
  total: Number(order.total),
  discount: Number(order.discount),
  appliedCoupon: order.applied_coupon || undefined,
  paymentMethod: order.payment_method,
  status: order.status,
  downloadToken: order.download_token,
  trackingCode: order.tracking_code || undefined,
  createdAt: order.created_at,
});
