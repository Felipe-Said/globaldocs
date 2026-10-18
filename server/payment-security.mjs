import crypto from 'node:crypto';

const MAX_JSON_BODY_BYTES = 32 * 1024;
const DECIMAL_SCALE = 8;

export const sortForSignature = value => {
  if (Array.isArray(value)) return value.map(sortForSignature);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = sortForSignature(value[key]);
      return result;
    }, {});
  }
  return value;
};

export const createIpnSignature = (payload, secret) => crypto
  .createHmac('sha512', secret)
  .update(JSON.stringify(sortForSignature(payload)))
  .digest('hex');

export const signaturesMatch = (received, expected) => {
  const normalized = String(received || '').trim().toLowerCase();
  if (!/^[a-f0-9]{128}$/.test(normalized) || normalized.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(normalized, 'hex'), Buffer.from(expected, 'hex'));
};

const decimalUnits = value => {
  const text = typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(DECIMAL_SCALE)
    : String(value ?? '').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ''] = unsigned.split('.');
  const units = BigInt(whole) * 10n ** BigInt(DECIMAL_SCALE)
    + BigInt((fraction + '0'.repeat(DECIMAL_SCALE)).slice(0, DECIMAL_SCALE));
  return negative ? -units : units;
};

const sameMoney = (left, right, precision = 2) => {
  const a = decimalUnits(left);
  const b = decimalUnits(right);
  if (a === null || b === null) return false;
  const tolerance = 10n ** BigInt(DECIMAL_SCALE - precision);
  const difference = a > b ? a - b : b - a;
  return difference < tolerance;
};

export const verifyFinalPayment = ({
  provider,
  stored,
  expectedOrderId,
  expectedPriceAmount,
  expectedPriceCurrency = 'brl',
}) => {
  if (!provider || typeof provider !== 'object') return { valid: false, reason: 'provider_payload_missing' };
  if (String(provider.payment_status || '') !== 'finished') return { valid: false, reason: 'payment_not_finished' };
  if (String(provider.payment_id || '') !== String(stored.payment_id || '')) return { valid: false, reason: 'payment_id_mismatch' };
  if (String(provider.order_id || '') !== String(expectedOrderId || '')) return { valid: false, reason: 'order_id_mismatch' };
  if (String(provider.pay_currency || '').toLowerCase() !== String(stored.pay_currency || '').toLowerCase()) {
    return { valid: false, reason: 'pay_currency_mismatch' };
  }
  if (String(provider.price_currency || '').toLowerCase() !== String(expectedPriceCurrency).toLowerCase()) {
    return { valid: false, reason: 'price_currency_mismatch' };
  }
  if (!sameMoney(provider.price_amount, expectedPriceAmount, 2)) return { valid: false, reason: 'price_amount_mismatch' };

  const expectedUnits = decimalUnits(stored.pay_amount);
  const paidUnits = decimalUnits(provider.actually_paid ?? provider.amount_received ?? 0);
  if (expectedUnits === null || expectedUnits <= 0n || paidUnits === null || paidUnits < expectedUnits) {
    return { valid: false, reason: 'underpaid' };
  }
  return { valid: true, actuallyPaid: Number(provider.actually_paid ?? provider.amount_received ?? 0) };
};

export const readJsonBody = request => {
  const contentType = String(request.headers?.['content-type'] || '').toLowerCase();
  if (contentType && !contentType.includes('application/json')) {
    const error = new Error('Conteúdo inválido.');
    error.status = 415;
    throw error;
  }
  const declaredLength = Number(request.headers?.['content-length'] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    const error = new Error('Corpo da requisição muito grande.');
    error.status = 413;
    throw error;
  }
  if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) return request.body;
  if (typeof request.body === 'string' && request.body) {
    if (Buffer.byteLength(request.body, 'utf8') > MAX_JSON_BODY_BYTES) {
      const error = new Error('Corpo da requisição muito grande.');
      error.status = 413;
      throw error;
    }
    const parsed = JSON.parse(request.body);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON inválido.');
    return parsed;
  }
  return {};
};

export const trustedCallbackUrl = () => {
  const fallback = 'https://globaldocs.vercel.app';
  const configured = String(process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  try {
    const origin = configured || fallback;
    const normalized = new URL(origin.startsWith('http') ? origin : `https://${origin}`);
    if (normalized.protocol !== 'https:') throw new Error('HTTPS obrigatório');
    return new URL('/api/nowpayments/ipn', normalized.origin).href;
  } catch {
    return `${fallback}/api/nowpayments/ipn`;
  }
};
