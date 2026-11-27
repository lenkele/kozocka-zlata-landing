import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { createAllpayPayment } from '@/lib/allpay';
import { fulfillConfirmedOrder } from '@/lib/fulfillOrder';
import type { StoredOrder } from '@/lib/ordersStore';
import { createPendingOrder, getPaidQtyForEvent, markOrderFailed, markOrderPaidOnce } from '@/lib/ordersStore';
import { ALLPAY_MIN_AMOUNT_ILS } from '@/lib/paymentLimits';
import { isValidPhone, normalizePhone } from '@/lib/phone';
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
    phone?: string;
  };
  consents?: {
    termsAccepted?: boolean;
    marketingAccepted?: boolean;
  };
  // Honeypot (скрытое поле формы).
  website?: string;
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

const FREE_REGISTRATION_MAX_QTY = 10;

// Бесплатный показ (цена 0): без AllPay. Заказ сразу подтверждается с суммой 0,
// дальше та же цепочка, что после оплаты: таблица, письмо с билетом, учёт мест.
async function registerFreeOrder(input: {
  showSlug: string;
  eventId: string;
  qty: number;
  lang: 'ru' | 'he' | 'en';
  returnPath: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  termsAccepted: boolean;
  marketingAccepted: boolean;
}) {
  const { showSlug, eventId, qty, lang, returnPath, buyerName, buyerEmail, buyerPhone } = input;
  const orderId = `${showSlug}-${eventId}-${crypto.randomUUID()}`;

  let order: StoredOrder;
  try {
    await createPendingOrder({
      orderId,
      showSlug,
      eventId,
      qty,
      buyerName,
      buyerEmail,
      buyerPhone,
      amount: 0,
      currency: 'ILS',
      termsAccepted: input.termsAccepted,
      marketingAccepted: input.marketingAccepted,
    });
    const confirmed = await markOrderPaidOnce({
      orderId,
      amount: 0,
      currency: 'ILS',
      raw: { source: 'free_registration' },
    });
    order = confirmed.order;
  } catch (error) {
    console.error('[checkout-create] failed to save free registration', { orderId, error });
    return NextResponse.json({ ok: false, reason: 'db_create_pending_failed', orderId }, { status: 500 });
  }

  try {
    await fulfillConfirmedOrder(order, { appendToSheet: true, logPrefix: '[checkout-create:free]' });
  } catch (error) {
    // Регистрация сохранена и место учтено, но письмо не ушло.
    console.error('[checkout-create] free registration saved, ticket email failed', { orderId, error });
    return NextResponse.json({ ok: false, reason: 'email_send_failed', registered: true, orderId }, { status: 500 });
  }

  console.log('[checkout-create] free registration confirmed', { orderId, qty, buyerEmail });

  const redirectUrl = `/payment/success?lang=${encodeURIComponent(lang)}&show=${encodeURIComponent(showSlug)}&return=${encodeURIComponent(returnPath)}&order=${encodeURIComponent(orderId)}&free=1`;
  return NextResponse.json({ ok: true, orderId, registered: true, redirectUrl, status: 'paid' });
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
  const buyerPhone = normalizePhone(body.buyer?.phone);
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

  if (!isValidPhone(buyerPhone)) {
    return NextResponse.json({ ok: false, reason: 'buyer_phone_invalid' }, { status: 400 });
  }

  if (!termsAccepted) {
    return NextResponse.json({ ok: false, reason: 'terms_not_accepted' }, { status: 400 });
  }

  const showSlug = body.showSlug?.trim() || 'unknown-show';
  const eventId = body.eventId?.trim() || 'unknown-event';
  const returnPath = resolveSafeReturnUrl(body.returnPath, `/${showSlug}`, {
    showSlug: isShowSlug(showSlug) ? showSlug : undefined,
  });
  const defaultUnitPrice = Math.max(
    ALLPAY_MIN_AMOUNT_ILS,
    parsePositiveInt(process.env.DEFAULT_TICKET_PRICE_ILS, ALLPAY_MIN_AMOUNT_ILS),
  );
  let unitPrice = defaultUnitPrice;
  let eventCapacity: number | null = null;
  let eventTicketMode: 'self' | 'venue' = 'self';
  let eventIsClosed = false;
  let scheduleEvent: { id?: string; date_iso?: string | Date; entries?: Record<string, { time?: string; place?: string; date_text?: string; format?: string; format_original?: string }>; price_ils?: number | string; capacity?: number | string; ticket_mode?: string } | undefined;

  try {
    const schedule = await loadScheduleForShow(showSlug);
    scheduleEvent = schedule.find((item) => item.id === eventId);
    unitPrice = resolveUnitPrice(scheduleEvent?.price_ils, defaultUnitPrice);
    eventCapacity = resolveCapacity(scheduleEvent?.capacity);
    eventTicketMode = scheduleEvent?.ticket_mode === 'venue' ? 'venue' : 'self';
    const ruEntry = scheduleEvent?.entries?.ru;
    eventIsClosed = isClosedFormat(ruEntry?.format_original ?? ruEntry?.format);
  } catch (error) {
    console.error('[checkout-create] failed to resolve event data from schedule', { showSlug, eventId, error });
  }

  const itemName = resolveCheckoutItemName(showSlug, lang, scheduleEvent) || process.env.DEFAULT_TICKET_NAME || 'Ticket';

  if (eventIsClosed) {
    return NextResponse.json({ ok: false, reason: 'closed_show' }, { status: 400 });
  }

  if (eventTicketMode === 'venue') {
    return NextResponse.json({ ok: false, reason: 'venue_ticketing' }, { status: 400 });
  }

  const isFreeRegistration = unitPrice === 0;
  if (isFreeRegistration) {
    // Скрытое поле-ловушка: люди его не видят, боты заполняют.
    if (typeof body.website === 'string' && body.website.trim()) {
      console.warn('[checkout-create] honeypot triggered on free registration', { showSlug, eventId });
      return NextResponse.json({ ok: false, reason: 'rejected' }, { status: 400 });
    }
    if (qty > FREE_REGISTRATION_MAX_QTY) {
      return NextResponse.json(
        { ok: false, reason: 'qty_exceeds_remaining', remaining: FREE_REGISTRATION_MAX_QTY },
        { status: 400 },
      );
    }
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

  if (isFreeRegistration) {
    return registerFreeOrder({
      showSlug,
      eventId,
      qty,
      lang,
      returnPath,
      buyerName,
      buyerEmail,
      buyerPhone,
      termsAccepted,
      marketingAccepted,
    });
  }

  const amount = unitPrice * qty;
  if (amount < ALLPAY_MIN_AMOUNT_ILS) {
    console.error('[checkout-create] amount below Allpay minimum', {
      showSlug,
      eventId,
      qty,
      unitPrice,
      amount,
      minimumAmount: ALLPAY_MIN_AMOUNT_ILS,
    });
    return NextResponse.json(
      {
        ok: false,
        reason: 'amount_below_minimum',
        amount,
        minimumAmount: ALLPAY_MIN_AMOUNT_ILS,
      },
      { status: 400 },
    );
  }

  const orderId = `${showSlug}-${eventId}-${crypto.randomUUID()}`;

  try {
    await createPendingOrder({
      orderId,
      showSlug,
      eventId,
      qty,
      buyerName,
      buyerEmail,
      buyerPhone,
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
    successUrl: `${appBaseUrl}/payment/success?lang=${encodeURIComponent(lang)}&show=${encodeURIComponent(showSlug)}&return=${encodeURIComponent(returnPath)}&order=${encodeURIComponent(orderId)}`,
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
