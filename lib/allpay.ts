import crypto from 'node:crypto';

type Scalar = string | number | boolean;

function isScalar(value: unknown): value is Scalar {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function normalizeScalar(value: Scalar): string {
  return typeof value === 'string' ? value.trim() : String(value);
}

export function buildAllpaySignature(payload: Record<string, unknown>, secret: string): string {
  const keys = Object.keys(payload).sort((a, b) => a.localeCompare(b));
  const values: string[] = [];

  for (const key of keys) {
    if (key === 'sign') continue;

    const value = payload[key];
    if (!isScalar(value)) continue;

    const normalized = normalizeScalar(value);
    if (!normalized) continue;

    values.push(normalized);
  }

  const base = `${values.join(':')}:${secret}`;
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
    backlink_url: input.backlinkUrl,
    webhook_url: input.webhookUrl,
    login: input.login,
  };

  payload.sign = buildAllpaySignature(payload, input.apiKey);

  const response = await fetch('https://allpay.to/app/?show=getpayment&mode=api10', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
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

  return json;
}
