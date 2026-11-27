import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidPhone, normalizePhone } from '../lib/phone';

test('common Israeli and international formats are accepted', () => {
  for (const phone of ['050-123-4567', '0501234567', '+972 50 123 4567', '(050) 1234567', '+7 (916) 123-45-67', '02.123.4567']) {
    assert.equal(isValidPhone(normalizePhone(phone)), true, phone);
  }
});

test('too short, too long, letters and misplaced plus are rejected', () => {
  for (const phone of ['', '12345', '1234567890123456', 'abc1234567', '050+1234567', '+']) {
    assert.equal(isValidPhone(normalizePhone(phone)), false, phone);
  }
});

test('normalization trims and collapses whitespace, ignores non-strings', () => {
  assert.equal(normalizePhone('  050   123 4567 '), '050 123 4567');
  assert.equal(normalizePhone(undefined), '');
  assert.equal(normalizePhone(501234567), '');
});
