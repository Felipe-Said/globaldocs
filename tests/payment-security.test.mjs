import test from 'node:test';
import assert from 'node:assert/strict';
import { createIpnSignature, signaturesMatch, sortForSignature, verifyFinalPayment } from '../server/payment-security.mjs';

const stored = { payment_id: '9001', pay_amount: '20.10000000', pay_currency: 'usdttrc20' };
const provider = {
  payment_id: 9001,
  order_id: 'order-1',
  payment_status: 'finished',
  price_amount: 100,
  price_currency: 'brl',
  pay_amount: 20.1,
  actually_paid: 20.1,
  pay_currency: 'usdttrc20',
};

test('normaliza recursivamente o payload e valida a assinatura IPN em tempo constante', () => {
  const payload = { z: 1, a: { y: 2, x: 3 } };
  assert.deepEqual(sortForSignature(payload), { a: { x: 3, y: 2 }, z: 1 });
  const signature = createIpnSignature(payload, 'secret');
  assert.equal(signaturesMatch(signature.toUpperCase(), signature), true);
  assert.equal(signaturesMatch('0'.repeat(128), signature), false);
});

test('aceita somente pagamento final totalmente reconciliado', () => {
  assert.equal(verifyFinalPayment({ provider, stored, expectedOrderId: 'order-1', expectedPriceAmount: 100 }).valid, true);
});

for (const [name, change, reason] of [
  ['pedido divergente', { order_id: 'order-2' }, 'order_id_mismatch'],
  ['moeda divergente', { pay_currency: 'btc' }, 'pay_currency_mismatch'],
  ['valor fiat divergente', { price_amount: 10 }, 'price_amount_mismatch'],
  ['pagamento parcial', { actually_paid: 19 }, 'underpaid'],
  ['status ainda não final', { payment_status: 'confirmed' }, 'payment_not_finished'],
]) {
  test(`rejeita ${name}`, () => {
    const result = verifyFinalPayment({ provider: { ...provider, ...change }, stored, expectedOrderId: 'order-1', expectedPriceAmount: 100 });
    assert.equal(result.valid, false);
    assert.equal(result.reason, reason);
  });
}
