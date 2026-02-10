type OrderStatus = 'pending' | 'paid' | 'failed';

type CreatePendingOrderInput = {
  orderId: string;
  showSlug: string;
  eventId: string;
  qty: number;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  termsAccepted: boolean;
  marketingAccepted: boolean;
};

type UpdateOrderInput = {
  orderId: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  raw?: Record<string, unknown>;
};

export type StoredOrder = {
  order_id: string;
  show_slug: string;
  event_id: string | null;
  qty: number;
  buyer_name: string | null;
  buyer_email: string;
  amount: number | null;
  currency: string | null;
  status: string;
  paid_at: string | null;
  allpay_payment_id: string | null;
  consent_terms_accepted: boolean;
  consent_marketing_accepted: boolean;
};

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return { supabaseUrl, serviceRoleKey };
}

function normalizePaymentId(paymentId: string | undefined): string | null {
  if (!paymentId) return null;
  const trimmed = paymentId.trim();
  if (!trimmed) return null;
  if (trimmed.toUpperCase() === 'EMPTY') return null;
  return trimmed;
}

async function supabaseRequest(path: string, init: RequestInit): Promise<Response> {
  const { supabaseUrl, serviceRoleKey } = getConfig();

  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function getOrderByOrderId(orderId: string): Promise<StoredOrder | null> {
  const response = await supabaseRequest(
    `/orders?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,show_slug,event_id,qty,buyer_name,buyer_email,amount,currency,status,paid_at,allpay_payment_id,consent_terms_accepted,consent_marketing_accepted&limit=1`,
    { method: 'GET' }
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`[ordersStore] get order failed: ${response.status} ${text}`);
  }
  const rows = text ? (JSON.parse(text) as StoredOrder[]) : [];
  return rows[0] ?? null;
}

async function patchOrder(
  orderId: string,
  patch: Record<string, unknown>,
  expectedStatus: OrderStatus
): Promise<void> {
  const response = await supabaseRequest(`/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`[ordersStore] ${expectedStatus} update failed: ${response.status} ${text}`);
  }

  const rows = text ? (JSON.parse(text) as Array<{ order_id: string }>) : [];
  if (rows.length === 0) {
    throw new Error(`[ordersStore] order not found for ${expectedStatus}: ${orderId}`);
  }
}

export async function createPendingOrder(input: CreatePendingOrderInput): Promise<void> {
  const response = await supabaseRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      order_id: input.orderId,
      show_slug: input.showSlug,
      event_id: input.eventId,
      qty: input.qty,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      amount: input.amount,
      currency: input.currency,
      status: 'pending',
      consent_terms_accepted: input.termsAccepted,
      consent_marketing_accepted: input.marketingAccepted,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[ordersStore] create pending failed: ${response.status} ${text}`);
  }
}

export async function markOrderFailed(input: UpdateOrderInput): Promise<void> {
  await patchOrder(
    input.orderId,
    {
      status: 'failed',
      allpay_payment_id: normalizePaymentId(input.paymentId),
      allpay_raw: input.raw ?? null,
    },
    'failed'
  );
}

export async function markOrderPaid(input: UpdateOrderInput): Promise<void> {
  await patchOrder(input.orderId, {
    status: 'paid',
    allpay_payment_id: normalizePaymentId(input.paymentId),
    amount: input.amount ?? null,
    currency: input.currency ?? 'ILS',
    paid_at: new Date().toISOString(),
    allpay_raw: input.raw ?? null,
  }, 'paid');
}

export async function markOrderPaidOnce(input: UpdateOrderInput): Promise<{ updated: boolean; order: StoredOrder }> {
  const response = await supabaseRequest(
    `/orders?order_id=eq.${encodeURIComponent(input.orderId)}&status=neq.paid`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: 'paid',
        allpay_payment_id: normalizePaymentId(input.paymentId),
        amount: input.amount ?? null,
        currency: input.currency ?? 'ILS',
        paid_at: new Date().toISOString(),
        allpay_raw: input.raw ?? null,
      }),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`[ordersStore] paid update failed: ${response.status} ${text}`);
  }

  const rows = text ? (JSON.parse(text) as StoredOrder[]) : [];
  if (rows.length > 0) {
    return { updated: true, order: rows[0] };
  }

  const existing = await getOrderByOrderId(input.orderId);
  if (!existing) {
    throw new Error(`[ordersStore] order not found for paid: ${input.orderId}`);
  }

  return { updated: false, order: existing };
}
