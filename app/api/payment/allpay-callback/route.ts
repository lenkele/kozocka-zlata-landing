import { NextResponse } from 'next/server';

import { sendTicketEmail } from '@/lib/email';
import type { StoredOrder } from '@/lib/ordersStore';
import { markOrderPaidOnce } from '@/lib/ordersStore';
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

function parseAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function maskSignature(value: string): string {
  if (!value) return '';
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
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
  const signatureDebug: Array<{
    secret: string;
    primary: string;
    candidates: Record<string, string>;
  }> = [];

  for (const secretEntry of secrets) {
    const primaryExpectedSign = getAllpaySignature(payload, secretEntry.value).toLowerCase();
    const candidateMap = getAllpaySignatureCandidates(payload, secretEntry.value);
    signatureDebug.push({
      secret: secretEntry.name,
      primary: primaryExpectedSign,
      candidates: candidateMap,
    });
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
  }

  if (!isValid) {
    // Invalid signatures happen regularly from third-party retries/probes.
    // Treat as an auth reject without polluting error-level logs.
    const candidatePreview = signatureDebug.map((entry) => {
      const trimmedCandidates = Object.entries(entry.candidates)
        .slice(0, 5)
        .map(([name, sign]) => [name, maskSignature(sign.toLowerCase())]);
      return {
        secret: entry.secret,
        primary: maskSignature(entry.primary),
        sampleCandidates: Object.fromEntries(trimmedCandidates),
      };
    });

    console.warn('[allpay-callback] signature rejected', {
      orderId: payload.order_id,
      paymentId: payload.payment_id,
      status: payload.status,
      login: payload.login,
      contentType,
      payloadKeys: Object.keys(payload).sort((a, b) => a.localeCompare(b)),
      rawBodyLength: rawBody.length,
      incomingSignLength: incomingSign.length,
      incomingSign: maskSignature(incomingSign),
      triedSecrets: secrets.map((entry) => ({ name: entry.name, length: entry.value.length })),
      candidatePreview,
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

  if (!orderId) {
    console.error('[allpay-callback] missing order_id', payload);
    return NextResponse.json({ ok: false, reason: 'missing_order_id' }, { status: 400 });
  }

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

  let paidUpdate: { updated: boolean; order: StoredOrder };
  try {
    paidUpdate = await markOrderPaidOnce({
      orderId,
      paymentId,
      amount: parseAmount(payload.amount),
      currency: toSafeString(payload.currency) || 'ILS',
      raw: payload,
    });
  } catch (error) {
    console.error('[allpay-callback] failed to persist paid status', { orderId, paymentId, error });
    return NextResponse.json({ ok: false, reason: 'db_update_failed' }, { status: 500 });
  }

  if (!paidUpdate.updated) {
    console.log('[allpay-callback] order already paid, skip duplicate email', { orderId, paymentId });
    return NextResponse.json({ ok: true, accepted: true, duplicated: true });
  }

  try {
    const emailResult = await sendTicketEmail(paidUpdate.order);
    console.log('[allpay-callback] ticket email sent', {
      orderId,
      to: paidUpdate.order.buyer_email,
      emailId: emailResult.id ?? null,
    });
  } catch (error) {
    // Keep webhook idempotent and successful after payment persistence.
    console.error('[allpay-callback] failed to send ticket email', { orderId, paymentId, error });
  }

  return NextResponse.json({ ok: true, accepted: true });
}
