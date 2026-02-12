import crypto from 'node:crypto';

type Scalar = string | number | boolean;

function isScalar(value: unknown): value is Scalar {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function normalizeScalar(value: Scalar): string {
  return typeof value === 'string' ? value : String(value);
}

function collectChunksFromArray(
  value: unknown[],
  includeEmpty = false,
  keyOrder: 'sorted' | 'insertion' = 'sorted'
): string[] {
  const chunks: string[] = [];

  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue;
    }

    const itemRecord = item as Record<string, unknown>;
    const itemKeys =
      keyOrder === 'sorted' ? Object.keys(itemRecord).sort((a, b) => a.localeCompare(b)) : Object.keys(itemRecord);

    for (const itemKey of itemKeys) {
      const itemValue = itemRecord[itemKey];
      if (!isScalar(itemValue)) continue;

      const normalized = normalizeScalar(itemValue);
      if (!includeEmpty && normalized === '') continue;

      chunks.push(normalized);
    }
  }

  return chunks;
}

export function buildAllpaySignature(
  payload: Record<string, unknown>,
  secret: string,
  options?: {
    includeEmpty?: boolean;
    keyOrder?: 'sorted' | 'insertion';
    delimiter?: ':' | '';
  }
): string {
  const includeEmpty = options?.includeEmpty ?? false;
  const keyOrder = options?.keyOrder ?? 'sorted';
  const delimiter = options?.delimiter ?? ':';
  const keys =
    keyOrder === 'sorted' ? Object.keys(payload).sort((a, b) => a.localeCompare(b)) : Object.keys(payload);
  const values: string[] = [];

  for (const key of keys) {
    if (key === 'sign') continue;

    const value = payload[key];
    if (Array.isArray(value)) {
      values.push(...collectChunksFromArray(value, includeEmpty, keyOrder));
      continue;
    }

    if (!isScalar(value)) continue;

    const normalized = normalizeScalar(value);
    if (!includeEmpty && !normalized) continue;

    values.push(normalized);
  }

  const valuesPart = values.join(delimiter);
  const base = delimiter ? `${valuesPart}${delimiter}${secret}` : `${valuesPart}${secret}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

type CreatePaymentInput = {
  login: string;
  apiKey: string;
  orderId: string;
  itemName: string;
  price: number;
  qty: number;
  clientName: string;
  clientEmail: string;
  lang: 'RU' | 'HE' | 'EN' | 'AUTO';
  successUrl: string;
  backlinkUrl: string;
  webhookUrl: string;
};

type AllpayCreatePaymentResponse = {
  payment_url?: string;
  payment_id?: string;
  error_code?: string | number;
  error_msg?: string;
};

export async function createAllpayPayment(input: CreatePaymentInput): Promise<AllpayCreatePaymentResponse> {
  const payload: Record<string, unknown> = {
    items: [
      {
        name: input.itemName,
        price: String(input.price),
        qty: String(input.qty),
        discount_val: '0',
        discount_type: 'fixed',
        vat: '0',
      },
    ],
    order_id: input.orderId,
    client_name: input.clientName,
    client_email: input.clientEmail,
    client_tehudat: '',
    currency: 'ILS',
    currency_display: '',
    lang: input.lang,
    preauthorize: '0',
    allpay_token: '',
    inst: '',
    success_url: input.successUrl,
    // Keep payload aligned with the official API tester request.
    // backlink_url can be handled by success_url flow in MVP.
    webhook_url: input.webhookUrl,
    login: input.login,
  };

  const signatureVariants = [
    { includeEmpty: false, keyOrder: 'sorted' as const, delimiter: ':' as const, name: 'sorted_colon' },
    { includeEmpty: true, keyOrder: 'sorted' as const, delimiter: ':' as const, name: 'sorted_colon_with_empty' },
    { includeEmpty: false, keyOrder: 'insertion' as const, delimiter: ':' as const, name: 'insertion_colon' },
    { includeEmpty: true, keyOrder: 'insertion' as const, delimiter: ':' as const, name: 'insertion_colon_with_empty' },
    { includeEmpty: false, keyOrder: 'sorted' as const, delimiter: '' as const, name: 'sorted_plain' },
    { includeEmpty: true, keyOrder: 'sorted' as const, delimiter: '' as const, name: 'sorted_plain_with_empty' },
  ];

  let lastResponse: AllpayCreatePaymentResponse = {
    error_code: 'NO_SIGNATURE_MATCH',
    error_msg: 'Unable to create payment with known signature variants',
  };

  for (const variant of signatureVariants) {
    const payloadWithSign = {
      ...payload,
      sign: buildAllpaySignature(payload, input.apiKey, variant),
    };

    const response = await fetch('https://allpay.to/app/?show=getpayment&mode=api10', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadWithSign),
      cache: 'no-store',
    });

    const text = await response.text();
    let json: AllpayCreatePaymentResponse = {};

    try {
      json = JSON.parse(text) as AllpayCreatePaymentResponse;
    } catch {
      json = {
        error_code: response.status,
        error_msg: `Non-JSON response from Allpay: ${text.slice(0, 500)}`,
      };
    }

    if (!response.ok && !json.error_code) {
      json.error_code = response.status;
      json.error_msg = json.error_msg ?? `Allpay request failed with status ${response.status}`;
    }

    lastResponse = json;

    if (json.payment_url) {
      console.log('[allpay-create] signature variant matched', {
        variant: variant.name,
        orderId: input.orderId,
      });
      return json;
    }

    if (String(json.error_code) !== '3') {
      return json;
    }
  }

  return lastResponse;
}
