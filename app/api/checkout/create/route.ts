import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { createAllpayPayment } from '@/lib/allpay';
import { createPendingOrder, getPaidQtyForEvent, markOrderFailed } from '@/lib/ordersStore';
import { resolveSafeReturnUrl } from '@/lib/returnUrl';
import { isShowSlug } from '@/shows';
import { loadScheduleForShow, resolveCapacity, resolveUnitPrice } from '@/lib/schedule';
import { resolveCheckoutItemName } from '@/lib/showEventDetails';

type CreateCheckoutRequest = {
  showSlug?: string;
  eventId?: string;
  qty?: number;
  lang?: 'ru' | 'he' | 'en';
  returnPath?: string;
  buyer?: {
    name?: string;
    email?: string;
  };
  consents?: {
    termsAccepted?: boolean;
    marketingAccepted?: boolean;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveAllpayLang(): 'AUTO' {
  // Use Allpay automatic language selection for mixed-language audience.
  return 'AUTO';
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = resolveCapacity(value);
  return parsed ?? fallback;
}

function isClosedFormat(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized.includes('закрыт') || normalized.includes('private') || normalized.includes('סגור');
}

export async function POST(request: Request) {
  const terminalId = process.env.ALLPAY_TERMINAL_ID;
  const apiKey = process.env.ALLPAY_API_KEY;
  const appBaseUrl = process.env.APP_BASE_URL?.replace(/\/+$/, '');

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
  const lang: 'ru' | 'he' | 'en' = body.lang === 'he' || body.lang === 'en' ? body.lang : 'ru';
  const termsAccepted = body.consents?.termsAccepted === true;
  const marketingAccepted = body.consents?.marketingAccepted === true;

  if (!buyerName) {
    return NextResponse.json({ ok: false, reason: 'buyer_name_required' }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(buyerEmail)) {
    return NextResponse.json({ ok: false, reason: 'buyer_email_invalid' }, { status: 400 });
  }

  if (!termsAccepted) {
    return NextResponse.json({ ok: false, reason: 'terms_not_accepted' }, { status: 400 });
  }

  const showSlug = body.showSlug?.trim() || 'unknown-show';
  const eventId = body.eventId?.trim() || 'unknown-event';
  const returnPath = resolveSafeReturnUrl(body.returnPath, `/${showSlug}`, {
    showSlug: isShowSlug(showSlug) ? showSlug : undefined,
  });
  const itemName = resolveCheckoutItemName(showSlug, lang) || process.env.DEFAULT_TICKET_NAME || 'Ticket';
  const defaultUnitPrice = parsePositiveInt(process.env.DEFAULT_TICKET_PRICE_ILS, 1);
  let unitPrice = defaultUnitPrice;
  let eventCapacity: number | null = null;
  let eventTicketMode: 'self' | 'venue' = 'self';
  let eventIsClosed = false;

  try {
    const schedule = await loadScheduleForShow(showSlug);
    const scheduleEvent = schedule.find((item) => item.id === eventId);
    unitPrice = resolveUnitPrice(scheduleEvent?.price_ils, defaultUnitPrice);
    eventCapacity = resolveCapacity(scheduleEvent?.capacity);
    eventTicketMode = scheduleEvent?.ticket_mode === 'venue' ? 'venue' : 'self';
    const ruEntry = scheduleEvent?.entries?.ru;
    eventIsClosed = isClosedFormat(ruEntry?.format_original ?? ruEntry?.format);
  } catch (error) {
    console.error('[checkout-create] failed to resolve event data from schedule', { showSlug, eventId, error });
  }

  if (eventIsClosed) {
    return NextResponse.json({ ok: false, reason: 'closed_show' }, { status: 400 });
  }

  if (eventTicketMode === 'venue') {
    return NextResponse.json({ ok: false, reason: 'venue_ticketing' }, { status: 400 });
  }

  if (eventCapacity !== null) {
    try {
      const soldQty = await getPaidQtyForEvent(showSlug, eventId);
      const remaining = Math.max(0, eventCapacity - soldQty);
      if (remaining <= 0) {
        return NextResponse.json({ ok: false, reason: 'sold_out', remaining: 0 }, { status: 409 });
      }
      if (qty > remaining) {
        return NextResponse.json({ ok: false, reason: 'qty_exceeds_remaining', remaining }, { status: 400 });
      }
    } catch (error) {
      console.error('[checkout-create] failed to validate event capacity', { showSlug, eventId, error });
      return NextResponse.json({ ok: false, reason: 'capacity_check_failed' }, { status: 500 });
    }
  }

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
      termsAccepted,
      marketingAccepted,
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
    lang: resolveAllpayLang(),
    successUrl: `${appBaseUrl}/payment/success?lang=${encodeURIComponent(lang)}&show=${encodeURIComponent(showSlug)}&return=${encodeURIComponent(returnPath)}`,
    backlinkUrl: `${appBaseUrl}/payment/return?lang=${encodeURIComponent(lang)}&show=${encodeURIComponent(showSlug)}&return=${encodeURIComponent(returnPath)}`,
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
