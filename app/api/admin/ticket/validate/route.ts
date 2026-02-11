import { NextResponse } from 'next/server';

import { getAuthorizedAdminLogin } from '@/lib/adminScheduleAuth';
import type { StoredOrder } from '@/lib/ordersStore';
import { resolveOrderDetails } from '@/lib/showEventDetails';
import { generateTicketCode } from '@/lib/ticket';

type OrderRow = StoredOrder & {
  ticket_redeemed_at?: string | null;
  ticket_redeemed_by?: string | null;
};

type TicketRequestBody = {
  orderId?: string;
  ticketCode?: string;
};

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

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const response = await supabaseRequest(
    `/orders?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,show_slug,event_id,qty,buyer_name,buyer_email,amount,currency,status,paid_at,allpay_payment_id,consent_terms_accepted,consent_marketing_accepted,ticket_redeemed_at,ticket_redeemed_by&limit=1`,
    { method: 'GET' }
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`order fetch failed: ${response.status} ${text}`);
  }
  const rows = text ? (JSON.parse(text) as OrderRow[]) : [];
  return rows[0] ?? null;
}

function validateTicketCode(orderId: string, ticketCode: string): boolean {
  if (!orderId || !ticketCode) return false;
  return generateTicketCode(orderId) === ticketCode.toUpperCase();
}

async function buildTicketView(order: OrderRow) {
  const details = await resolveOrderDetails(order);
  return {
    orderId: order.order_id,
    showSlug: order.show_slug,
    eventId: order.event_id,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    qty: order.qty,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    paidAt: order.paid_at,
    redeemedAt: order.ticket_redeemed_at ?? null,
    redeemedBy: order.ticket_redeemed_by ?? null,
    showTitle: details.showTitle,
    eventDateTime: details.eventDateTime,
    eventPlace: details.eventPlace,
    directionsUrl: details.eventDirectionsUrl,
  };
}

export async function GET(request: Request) {
  const adminLogin = getAuthorizedAdminLogin(request);
  if (!adminLogin) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = normalizeString(url.searchParams.get('order_id'));
  const ticketCode = normalizeString(url.searchParams.get('ticket'));

  if (!orderId || !ticketCode) {
    return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 });
  }

  if (!validateTicketCode(orderId, ticketCode)) {
    return NextResponse.json({ ok: false, reason: 'invalid_ticket_code' }, { status: 400 });
  }

  try {
    const order = await loadOrder(orderId);
    if (!order) {
      return NextResponse.json({ ok: false, reason: 'order_not_found' }, { status: 404 });
    }

    const ticket = await buildTicketView(order);
    return NextResponse.json({ ok: true, adminLogin, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ticket_load_failed';
    return NextResponse.json({ ok: false, reason: 'ticket_load_failed', message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminLogin = getAuthorizedAdminLogin(request);
  if (!adminLogin) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let body: TicketRequestBody;
  try {
    body = (await request.json()) as TicketRequestBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const orderId = normalizeString(body.orderId);
  const ticketCode = normalizeString(body.ticketCode);

  if (!orderId || !ticketCode) {
    return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 });
  }

  if (!validateTicketCode(orderId, ticketCode)) {
    return NextResponse.json({ ok: false, reason: 'invalid_ticket_code' }, { status: 400 });
  }

  try {
    const existing = await loadOrder(orderId);
    if (!existing) {
      return NextResponse.json({ ok: false, reason: 'order_not_found' }, { status: 404 });
    }

    if (existing.status !== 'paid') {
      return NextResponse.json({ ok: false, reason: 'order_not_paid' }, { status: 400 });
    }

    if (existing.ticket_redeemed_at) {
      const ticket = await buildTicketView(existing);
      return NextResponse.json({ ok: true, alreadyRedeemed: true, ticket });
    }

    const nowIso = new Date().toISOString();
    const patchResponse = await supabaseRequest(
      `/orders?order_id=eq.${encodeURIComponent(orderId)}&ticket_redeemed_at=is.null`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          ticket_redeemed_at: nowIso,
          ticket_redeemed_by: adminLogin,
        }),
      }
    );

    const patchText = await patchResponse.text();
    if (!patchResponse.ok) {
      if (patchText.includes('ticket_redeemed_at') && patchText.toLowerCase().includes('column')) {
        return NextResponse.json({ ok: false, reason: 'redemption_columns_missing', message: patchText }, { status: 500 });
      }
      return NextResponse.json({ ok: false, reason: 'redeem_failed', message: patchText }, { status: 500 });
    }

    const updatedRows = patchText ? (JSON.parse(patchText) as OrderRow[]) : [];
    const updated = updatedRows[0] ?? (await loadOrder(orderId));
    if (!updated) {
      return NextResponse.json({ ok: false, reason: 'order_not_found_after_redeem' }, { status: 500 });
    }

    const ticket = await buildTicketView(updated);
    return NextResponse.json({ ok: true, redeemed: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'redeem_failed';
    return NextResponse.json({ ok: false, reason: 'redeem_failed', message }, { status: 500 });
  }
}
