import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isPastPerformance, selectAfishaRows } from '../lib/afisha';

const now = new Date('2026-11-21T10:00:00Z'); // Noon in Israel.
const past = Array.from({ length: 12 }, (_, index) => ({ id: `past-${index + 1}`, dateIso: `2026-11-${String(index + 1).padStart(2, '0')}`, time: '18:00' }));
const future = Array.from({ length: 12 }, (_, index) => ({ id: `future-${index + 1}`, dateIso: `2026-12-${String(index + 1).padStart(2, '0')}`, time: '18:00' }));

test('when there are no future performances, show the eight most recent past ones', () => {
  const result = selectAfishaRows(past, now);
  assert.deepEqual(result.map((row) => row.id), ['past-12', 'past-11', 'past-10', 'past-9', 'past-8', 'past-7', 'past-6', 'past-5']);
});

test('three upcoming performances are followed by five most recent past ones', () => {
  const result = selectAfishaRows([...past, ...future.slice(0, 3)].reverse(), now);
  assert.deepEqual(result.map((row) => row.id), ['future-1', 'future-2', 'future-3', 'past-12', 'past-11', 'past-10', 'past-9', 'past-8']);
});

test('eight or more upcoming performances are all shown without past padding', () => {
  for (const count of [8, 9, 12]) {
    assert.deepEqual(selectAfishaRows([...past, ...future.slice(0, count)].reverse(), now), future.slice(0, count));
  }
});

test('fewer than eight records show all available records without inventing duplicates', () => {
  assert.equal(selectAfishaRows([], now).length, 0);
  assert.equal(selectAfishaRows([...past.slice(0, 2), ...future.slice(0, 2)], now).length, 4);
});

test('same-day performances are classified by their time in Israel', () => {
  assert.equal(isPastPerformance({ dateIso: '2026-11-21', time: '11:59' }, now), true);
  assert.equal(isPastPerformance({ dateIso: '2026-11-21', time: '18:00' }, now), false);
  assert.equal(isPastPerformance({ dateIso: '2026-11-21', time: '' }, now), false);
  const summerMidnight = new Date('2026-07-01T21:30:00Z'); // July 2, 00:30, daylight saving time.
  assert.equal(isPastPerformance({ dateIso: '2026-07-01', time: '23:45' }, summerMidnight), true);
  assert.equal(isPastPerformance({ dateIso: '2026-07-02', time: '0:45' }, summerMidnight), false);
});

test('invalid dates are excluded and the source list is not modified', () => {
  const rows = [...future.slice(0, 2), ...past.slice(0, 2), { id: 'invalid', dateIso: '', time: '18:00' }];
  const original = structuredClone(rows);
  const result = selectAfishaRows(rows, now);
  assert.deepEqual(rows, original);
  assert.equal(result.length, 4);
});

test('published history immediately supplies the correct eight most recent performances', () => {
  const published = JSON.parse(readFileSync(new URL('./fixtures/published-schedule.json', import.meta.url), 'utf8')) as { id: string; dateIso: string; time: string }[];
  assert.equal(published.length, 27);
  assert.deepEqual(selectAfishaRows(published, now).map((row) => row.id), [
    'marita:20261029-1800', 'marita:20261028-1800', 'marita:20261027-1800',
    'marita:20261024-1800', 'marita:20261023-1500', 'marita:20261021-1800',
    'gefilte-lid:20260627-1830', 'gefilte-lid:20260623-1800',
  ]);
});
