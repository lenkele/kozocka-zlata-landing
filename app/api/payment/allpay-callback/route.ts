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

  const webhookSecret = process.env.ALLPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[allpay-callback] missing ALLPAY_WEBHOOK_SECRET');
    return NextResponse.json({ ok: false, reason: 'server_not_configured' }, { status: 500 });
  }

  const incomingSign = toSafeString(payload.sign).toLowerCase();
  if (!incomingSign) {
    console.error('[allpay-callback] missing sign', payload);
    return NextResponse.json({ ok: false, reason: 'missing_sign' }, { status: 400 });
  }

  const primaryExpectedSign = getAllpaySignature(payload, webhookSecret).toLowerCase();
  const candidateMap = getAllpaySignatureCandidates(payload, webhookSecret);
  const matchedCandidate = Object.entries(candidateMap).find(([, candidate]) =>
    secureSignatureMatch(incomingSign, candidate.toLowerCase())
  );

  const isValid = secureSignatureMatch(incomingSign, primaryExpectedSign) || Boolean(matchedCandidate);

  if (!isValid) {
    console.error('[allpay-callback] signature mismatch', {
      orderId: payload.order_id,
      incomingSign,
      expectedSign: primaryExpectedSign,
    });
    return NextResponse.json({ ok: false, reason: 'invalid_sign' }, { status: 401 });
  }

  if (matchedCandidate) {
    console.log('[allpay-callback] matched signature candidate', {
      orderId: payload.order_id,
      candidate: matchedCandidate[0],
    });
  }

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
