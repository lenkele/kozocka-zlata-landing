import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { createAllpayPayment } from '@/lib/allpay';
import { createPendingOrder, markOrderFailed } from '@/lib/ordersStore';

type CreateCheckoutRequest = {
  showSlug?: string;
  eventId?: string;
  qty?: number;
  lang?: 'ru' | 'he' | 'en';
  buyer?: {
    name?: string;
    email?: string;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeLang(input: CreateCheckoutRequest['lang']): 'RU' | 'HE' | 'EN' | 'AUTO' {
  if (input === 'ru') return 'RU';
  if (input === 'he') return 'HE';
  if (input === 'en') return 'EN';
  return 'AUTO';
}

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

export async function POST(request: Request) {
  const terminalId = process.env.ALLPAY_TERMINAL_ID;
  const apiKey = process.env.ALLPAY_API_KEY;
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!terminalId || !apiKey || !appBaseUrl) {
    return NextResponse.json(
      { ok: false, reason: 'missing_env', required: ['ALLPAY_TERMINAL_ID', 'ALLPAY_API_KEY', 'APP_BASE_URL'] },
      { status: 500 }
    );
  }

  let body: CreateCheckoutRequest;
  try {
    body = (await request.json()) as CreateCheckoutRequest;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const buyerName = body.buyer?.name?.trim() ?? '';
  const buyerEmail = body.buyer?.email?.trim().toLowerCase() ?? '';
  const qty = parsePositiveInt(body.qty, 1);

  if (!buyerName) {
    return NextResponse.json({ ok: false, reason: 'buyer_name_required' }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(buyerEmail)) {
    return NextResponse.json({ ok: false, reason: 'buyer_email_invalid' }, { status: 400 });
  }

  const unitPrice = parsePositiveInt(process.env.DEFAULT_TICKET_PRICE_ILS, 1);
  const itemName = process.env.DEFAULT_TICKET_NAME ?? 'Ticket';
  const showSlug = body.showSlug?.trim() || 'unknown-show';
  const eventId = body.eventId?.trim() || 'unknown-event';
  const orderId = `${showSlug}-${eventId}-${crypto.randomUUID()}`;
  const amount = unitPrice * qty;

  try {
    await createPendingOrder({
      orderId,
      showSlug,
      eventId,
      qty,
      buyerName,
      buyerEmail,
      amount,
      currency: 'ILS',
    });
  } catch (error) {
    console.error('[checkout-create] failed to create pending order', { orderId, error });
    return NextResponse.json({ ok: false, reason: 'db_create_pending_failed', orderId }, { status: 500 });
  }

  const payment = await createAllpayPayment({
    login: terminalId,
    apiKey,
    orderId,
    itemName,
    price: unitPrice,
    qty,
    clientName: buyerName,
    clientEmail: buyerEmail,
    lang: normalizeLang(body.lang),
    successUrl: `${appBaseUrl}/payment/success`,
    backlinkUrl: `${appBaseUrl}/payment/return`,
    webhookUrl: `${appBaseUrl}/api/payment/allpay-callback`,
  });

  if (!payment.payment_url) {
    try {
      await markOrderFailed({
        orderId,
        paymentId: payment.payment_id,
        raw: payment as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.error('[checkout-create] failed to mark order as failed', { orderId, error });
    }

    console.error('[checkout-create] allpay error', { orderId, payment });
    return NextResponse.json(
      {
        ok: false,
        reason: 'allpay_create_payment_failed',
        orderId,
        details: payment,
      },
      { status: 502 }
    );
  }

  console.log('[checkout-create] payment created', {
    orderId,
    qty,
    buyerEmail,
    paymentId: payment.payment_id ?? null,
  });

  return NextResponse.json({
    ok: true,
    orderId,
    paymentUrl: payment.payment_url,
    status: 'pending',
  });
}
