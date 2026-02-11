import crypto from 'node:crypto';

import { NextResponse } from 'next/server';

import { getAuthorizedAdminLogin } from '@/lib/adminScheduleAuth';
import { sendTicketEmail } from '@/lib/email';
import type { StoredOrder } from '@/lib/ordersStore';
import { loadScheduleForShow } from '@/lib/schedule';
import { buildTicketArtifacts } from '@/lib/ticket';
import { isShowSlug } from '@/shows';

type TestTicketBody = {
  showSlug?: string;
  eventId?: string;
  buyerName?: string;
  buyerEmail?: string;
  qty?: number;
  action?: 'issue' | 'download' | string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return { supabaseUrl, serviceRoleKey };
}

async function supabaseRequest(path: string, init: RequestInit): Promise<Response> {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
}

function toPositiveQty(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return 1;
}

export async function POST(request: Request) {
  const adminLogin = getAuthorizedAdminLogin(request);
  if (!adminLogin) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let body: TestTicketBody;
  try {
    body = (await request.json()) as TestTicketBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const showSlug = (body.showSlug ?? '').trim();
  const eventId = (body.eventId ?? '').trim();
  const buyerName = (body.buyerName ?? '').trim();
  const buyerEmail = (body.buyerEmail ?? '').trim().toLowerCase();
  const qty = toPositiveQty(body.qty);
  const action = (body.action ?? 'download').toString().trim().toLowerCase();

  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ ok: false, reason: 'event_required' }, { status: 400 });
  }
  if (!buyerName) {
    return NextResponse.json({ ok: false, reason: 'buyer_name_required' }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(buyerEmail)) {
    return NextResponse.json({ ok: false, reason: 'buyer_email_invalid' }, { status: 400 });
  }

  try {
    const schedule = await loadScheduleForShow(showSlug);
    const scheduleEvent = schedule.find((event) => event.id === eventId);
    if (!scheduleEvent) {
      return NextResponse.json({ ok: false, reason: 'event_not_found' }, { status: 404 });
    }
  } catch (error) {
    console.error('[test-ticket] failed to resolve schedule event', { showSlug, eventId, error });
    return NextResponse.json({ ok: false, reason: 'schedule_resolve_failed' }, { status: 500 });
  }

  const orderId = `manual-${showSlug}-${eventId}-${crypto.randomUUID()}`;

  const insertResponse = await supabaseRequest('/orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      order_id: orderId,
      show_slug: showSlug,
      event_id: eventId,
      qty,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      amount: 0,
      currency: 'ILS',
      status: 'paid',
      paid_at: new Date().toISOString(),
      allpay_payment_id: 'complimentary-admin',
      consent_terms_accepted: true,
      consent_marketing_accepted: false,
      allpay_raw: {
        source: 'admin_complimentary_ticket',
        created_by: adminLogin,
        action,
      },
    }),
  });

  const insertText = await insertResponse.text();
  if (!insertResponse.ok) {
    return NextResponse.json({ ok: false, reason: 'db_insert_failed', message: insertText }, { status: 500 });
  }

  const rows = insertText ? (JSON.parse(insertText) as StoredOrder[]) : [];
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ ok: false, reason: 'order_not_returned' }, { status: 500 });
  }

  if (action === 'issue') {
    try {
      const emailResult = await sendTicketEmail(order);
      return NextResponse.json({
        ok: true,
        mode: 'issue',
        orderId: order.order_id,
        email: order.buyer_email,
        emailId: emailResult.id ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'email_send_failed';
      return NextResponse.json({ ok: false, reason: 'email_send_failed', message, orderId: order.order_id }, { status: 500 });
    }
  }

  try {
    const ticket = await buildTicketArtifacts(order);
    const pdfBuffer = Buffer.from(ticket.pdfBase64, 'base64');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${ticket.pdfFilename}"`,
        'cache-control': 'no-store',
        'x-order-id': order.order_id,
        'x-ticket-code': ticket.ticketCode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ticket_build_failed';
    return NextResponse.json({ ok: false, reason: 'ticket_build_failed', message, orderId: order.order_id }, { status: 500 });
  }
}
