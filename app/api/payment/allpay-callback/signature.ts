import crypto from 'node:crypto';

/**
 * Canonical AllPay signature algorithm.
 *
 * Implements the exact algorithm from the official documentation:
 * @see https://www.allpay.co.il/api-reference#signature
 *
 * Rules:
 * 1. Remove the `sign` parameter.
 * 2. Exclude all parameters with empty values.
 * 3. Sort remaining keys alphabetically (A-Z) — top-level, arrays, and keys inside each item.
 * 4. Take only the parameter **values** and join them with `:`.
 * 5. Append the API key at the end, preceded by `:`.
 * 6. Apply SHA-256.
 *
 * IMPORTANT: Only **string** values are included.
 * Numbers, booleans, nulls, and other types are silently skipped —
 * this matches the reference Node.js implementation provided by AllPay.
 */
export function getAllpaySignature(
  payload: Record<string, unknown>,
  secret: string
): string {
  const sortedKeys = Object.keys(payload).sort();
  const chunks: string[] = [];

  for (const key of sortedKeys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          const sortedItemKeys = Object.keys(record).sort();
          for (const itemKey of sortedItemKeys) {
            const itemVal = record[itemKey];
            if (typeof itemVal === 'string' && itemVal.trim() !== '') {
              chunks.push(itemVal);
            }
          }
        }
      }
    } else {
      if (typeof value === 'string' && value.trim() !== '' && key !== 'sign') {
        chunks.push(value);
      }
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
