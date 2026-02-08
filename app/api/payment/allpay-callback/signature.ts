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
  const sortedKeys = Object.keys(payload).sort((a, b) => a.localeCompare(b));
  const values: string[] = [];

  for (const key of sortedKeys) {
    if (skipKeys.includes(key)) {
      continue;
    }

    const value = payload[key];
    if (!isScalar(value)) {
      continue;
    }

    const normalized = normalizeScalar(value);
    if (!normalized) {
      continue;
    }

    values.push(normalized);
  }

  const base = `${values.join('')}${secret}`;
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
