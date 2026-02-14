import crypto from 'node:crypto';

type Scalar = string | number | boolean;

function isScalar(value: unknown): value is Scalar {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function scalarToString(value: Scalar): string {
  return typeof value === 'string' ? value : String(value);
}

function isEmpty(value: Scalar): boolean {
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Canonical AllPay signature algorithm.
 *
 * @see https://www.allpay.co.il/api-reference#signature
 *
 * Steps:
 * 1. Remove the `sign` parameter.
 * 2. Exclude parameters with empty string values.
 * 3. Sort keys alphabetically (A-Z) at every level.
 * 4. Take parameter values, join with `:`.
 * 5. Append API key preceded by `:`.
 * 6. SHA-256.
 *
 * Note: both string and numeric scalar values are included in the
 * signature.  AllPay's documented Node.js example only checks for
 * strings, but their actual webhook payloads contain JSON numbers
 * (amount, status, inst, item price/qty) which ARE part of the
 * signed data.  Arrays (e.g. `items`) are processed recursively —
 * each object's keys are sorted and scalar values collected.
 */
export function getAllpaySignature(
  payload: Record<string, unknown>,
  secret: string
): string {
  const sortedKeys = Object.keys(payload).sort();
  const chunks: string[] = [];

  for (const key of sortedKeys) {
    if (key === 'sign') continue;

    const value = payload[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          const sortedItemKeys = Object.keys(record).sort();
          for (const itemKey of sortedItemKeys) {
            const itemVal = record[itemKey];
            if (!isScalar(itemVal) || isEmpty(itemVal)) continue;
            chunks.push(scalarToString(itemVal));
          }
        }
      }
    } else if (isScalar(value)) {
      if (isEmpty(value)) continue;
      chunks.push(scalarToString(value));
    }
  }

  const signatureString = chunks.join(':') + ':' + secret;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

/**
 * Timing-safe signature comparison to prevent timing attacks.
 */
export function secureSignatureMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}
