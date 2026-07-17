import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWhatsAppCommand } from '../src/services/whatsapp-command.service.js';

test('parses read-only WhatsApp inventory commands', () => {
  assert.deepEqual(parseWhatsAppCommand('stock brown rice'), { action: 'STOCK', query: 'brown rice' });
  assert.deepEqual(parseWhatsAppCommand('LOW STOCK'), { action: 'LOW' });
  assert.deepEqual(parseWhatsAppCommand('out of stock'), { action: 'OUT' });
});

test('parses mutation commands without guessing product names', () => {
  assert.deepEqual(parseWhatsAppCommand('add brown rice 20.5'), { action: 'ADD', query: 'brown rice', quantity: 20.5 });
  assert.deepEqual(parseWhatsAppCommand('sale milk 3'), { action: 'SALE', query: 'milk', quantity: 3 });
  assert.deepEqual(parseWhatsAppCommand('set sugar 0'), { action: 'SET', query: 'sugar', quantity: 0 });
});

test('requires an explicit confirmation and recognizes linking codes', () => {
  assert.deepEqual(parseWhatsAppCommand('yes'), { action: 'CONFIRM' });
  assert.deepEqual(parseWhatsAppCommand('LINK sp-123456'), { action: 'LINK', code: 'SP-123456' });
  assert.deepEqual(parseWhatsAppCommand('buy rice soon'), { action: 'UNKNOWN' });
});
