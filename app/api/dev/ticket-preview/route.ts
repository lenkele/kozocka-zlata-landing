import { NextResponse } from 'next/server';

import { buildTicketArtifacts } from '@/lib/ticket';
import type { StoredOrder } from '@/lib/ordersStore';

function asPositiveInt(input: string | null, fallback: number): number {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function asPositiveNumber(input: string | null, fallback: number): number {
  if (!input) return fallback;
  const parsed = Number.parseFloat(input);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const showSlug = url.searchParams.get('show') || 'zlata';
  const eventId = url.searchParams.get('event') || '20260222-ashkelon';
  const buyerName = url.searchParams.get('name') || 'Ticket Preview';
  const buyerEmail = url.searchParams.get('email') || 'preview@example.com';
  const qty = asPositiveInt(url.searchParams.get('qty'), 2);
  const amount = asPositiveNumber(url.searchParams.get('amount'), 10);
  const currency = url.searchParams.get('currency') || 'ILS';

  const order: StoredOrder = {
    order_id: `preview-${showSlug}-${eventId}-${Date.now()}`,
    show_slug: showSlug,
    event_id: eventId,
    qty,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    amount,
    currency,
    status: 'paid',
    paid_at: new Date().toISOString(),
    allpay_payment_id: 'preview',
    consent_terms_accepted: true,
    consent_marketing_accepted: false,
  };

  try {
    const ticket = await buildTicketArtifacts(order);
    const pdfBuffer = Buffer.from(ticket.pdfBase64, 'base64');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${ticket.pdfFilename}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ ok: false, reason: 'ticket_preview_failed', message, stack }, { status: 500 });
  }
}
