import crypto from 'node:crypto';

type Scalar = string | number | boolean;

function isScalar(value: unknown): value is Scalar {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function normalizeScalar(value: Scalar): string {
  return typeof value === 'string' ? value.trim() : String(value);
}

export function getAllpaySignature(
  payload: Record<string, unknown>,
  secret: string,
  skipKeys: string[] = ['sign']
): string {
  const values = collectValues(payload, Object.keys(payload).sort((a, b) => a.localeCompare(b)), skipKeys);
  const base = `${values.join(':')}:${secret}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

export function secureSignatureMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function collectValues(
  payload: Record<string, unknown>,
  keys: string[],
  skipKeys: string[] = ['sign']
): string[] {
  const values: string[] = [];

  for (const key of keys) {
    if (skipKeys.includes(key)) continue;

    const value = payload[key];
    if (!isScalar(value)) continue;

    const normalized = normalizeScalar(value);
    if (!normalized) continue;

    values.push(normalized);
  }

  return values;
}

function collectPairs(
  payload: Record<string, unknown>,
  keys: string[],
  skipKeys: string[] = ['sign']
): string[] {
  const pairs: string[] = [];

  for (const key of keys) {
    if (skipKeys.includes(key)) continue;

    const value = payload[key];
    if (!isScalar(value)) continue;

    const normalized = normalizeScalar(value);
    if (!normalized) continue;

    pairs.push(`${key}=${normalized}`);
  }

  return pairs;
}

function hash(base: string): string {
  return crypto.createHash('sha256').update(base).digest('hex');
}

export function getAllpaySignatureCandidates(
  payload: Record<string, unknown>,
  secret: string,
  skipKeys: string[] = ['sign']
): Record<string, string> {
  const sortedKeys = Object.keys(payload).sort((a, b) => a.localeCompare(b));
  const insertionKeys = Object.keys(payload);
  const sortedValues = collectValues(payload, sortedKeys, skipKeys);
  const insertionValues = collectValues(payload, insertionKeys, skipKeys);
  const sortedPairs = collectPairs(payload, sortedKeys, skipKeys);
  const insertionPairs = collectPairs(payload, insertionKeys, skipKeys);

  return {
    values_colon_sorted: hash(`${sortedValues.join(':')}:${secret}`),
    values_plain_sorted: hash(`${sortedValues.join('')}${secret}`),
    values_colon_insertion: hash(`${insertionValues.join(':')}:${secret}`),
    values_plain_insertion: hash(`${insertionValues.join('')}${secret}`),
    pairs_amp_sorted: hash(`${sortedPairs.join('&')}&secret_key=${secret}`),
    pairs_amp_insertion: hash(`${insertionPairs.join('&')}&secret_key=${secret}`),
  };
}
