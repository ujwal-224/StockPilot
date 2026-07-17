import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionInput } from '../src/controllers/transaction.controller.js';

test('rejects negative and zero sale quantities before stock mutation', () => {
  assert.throws(() => parseTransactionInput({ type: 'SALE', quantity: -2 }), /greater than zero/);
  assert.throws(() => parseTransactionInput({ type: 'SALE', quantity: 0 }), /greater than zero/);
});

test('rejects unsupported transaction types and non-numeric quantities', () => {
  assert.throws(() => parseTransactionInput({ type: 'RETURN', quantity: 1 }), /must be SALE/);
  assert.throws(() => parseTransactionInput({ type: 'PURCHASE', quantity: 'invalid' }), /greater than zero/);
});

test('allows an adjustment to zero and trims its note', () => {
  assert.deepEqual(parseTransactionInput({ type: 'adjustment', quantity: 0, note: '  counted  ' }), {
    type: 'ADJUSTMENT',
    quantity: 0,
    note: 'counted',
  });
});
