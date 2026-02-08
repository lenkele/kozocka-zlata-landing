import { NextResponse } from 'next/server';

import { getAllpaySignature, getAllpaySignatureCandidates, secureSignatureMatch } from './signature';

type CallbackPayload = Record<string, unknown> & {
  sign?: unknown;
  order_id?: unknown;
  status?: unknown;
  payment_id?: unknown;
  amount?: unknown;
};

function parseBody(rawBody: string, contentType: string): CallbackPayload | null {
  if (!rawBody) return null;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody) as CallbackPayload;
    } catch {
      return null;
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody);
    return Object.fromEntries(params.entries());
  }

  try {
    return JSON.parse(rawBody) as CallbackPayload;
  } catch {
    return null;
  }
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeStatus(status: unknown): string {
  if (typeof status === 'number') return String(status);
  if (typeof status === 'string') return status.trim();
  return '';
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const rawBody = await request.text();
  const payload = parseBody(rawBody, contentType);

  if (!payload) {
    console.error('[allpay-callback] invalid payload', { contentType, rawBody });
    return NextResponse.json({ ok: false, reason: 'invalid_payload' }, { status: 400 });
  }

  const secrets = [
    { name: 'ALLPAY_WEBHOOK_SECRET', value: process.env.ALLPAY_WEBHOOK_SECRET },
    { name: 'ALLPAY_API_KEY', value: process.env.ALLPAY_API_KEY },
  ].filter((entry): entry is { name: string; value: string } => Boolean(entry.value));

  if (secrets.length === 0) {
    console.error('[allpay-callback] missing secrets (ALLPAY_WEBHOOK_SECRET / ALLPAY_API_KEY)');
    return NextResponse.json({ ok: false, reason: 'server_not_configured' }, { status: 500 });
  }

  const incomingSign = toSafeString(payload.sign).toLowerCase();
  if (!incomingSign) {
    console.error('[allpay-callback] missing sign', payload);
    return NextResponse.json({ ok: false, reason: 'missing_sign' }, { status: 400 });
  }

  let isValid = false;
  let matchedSecretName = '';
  let matchedCandidateName = '';
  let fallbackExpectedSign = '';

  for (const secretEntry of secrets) {
    const primaryExpectedSign = getAllpaySignature(payload, secretEntry.value).toLowerCase();
    const candidateMap = getAllpaySignatureCandidates(payload, secretEntry.value);
    const matchedCandidate = Object.entries(candidateMap).find(([, candidate]) =>
      secureSignatureMatch(incomingSign, candidate.toLowerCase())
    );

    if (secureSignatureMatch(incomingSign, primaryExpectedSign)) {
      isValid = true;
      matchedSecretName = secretEntry.name;
      matchedCandidateName = 'primary_values_colon_sorted';
      break;
    }

    if (matchedCandidate) {
      isValid = true;
      matchedSecretName = secretEntry.name;
      matchedCandidateName = matchedCandidate[0];
      break;
    }

    if (!fallbackExpectedSign) {
      fallbackExpectedSign = primaryExpectedSign;
    }
  }

  if (!isValid) {
    console.error('[allpay-callback] signature mismatch', {
      orderId: payload.order_id,
      incomingSign,
      expectedSign: fallbackExpectedSign,
    });
    return NextResponse.json({ ok: false, reason: 'invalid_sign' }, { status: 401 });
  }

  console.log('[allpay-callback] matched signature candidate', {
    orderId: payload.order_id,
    secret: matchedSecretName,
    candidate: matchedCandidateName,
  });

  const orderId = toSafeString(payload.order_id);
  const paymentId = toSafeString(payload.payment_id);
  const status = normalizeStatus(payload.status);

  if (status !== '1') {
    // Webhook is expected only for successful payments.
    // Return 200 to avoid unnecessary retries for non-success payloads.
    console.warn('[allpay-callback] non-success status', {
      orderId,
      paymentId,
      status,
      amount: payload.amount,
    });
    return NextResponse.json({ ok: true, accepted: false });
  }

  console.log('[allpay-callback] payment confirmed', {
    orderId,
    paymentId,
    amount: payload.amount,
    status,
    clientEmail: payload.client_email,
  });

  // TODO: persist payment confirmation and trigger ticket/email workflow.
  return NextResponse.json({ ok: true, accepted: true });
}
