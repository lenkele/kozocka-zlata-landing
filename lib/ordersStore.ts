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
};

type UpdateOrderInput = {
  orderId: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  raw?: Record<string, unknown>;
};

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return { supabaseUrl, serviceRoleKey };
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
      allpay_payment_id: input.paymentId ?? null,
      allpay_raw: input.raw ?? null,
    },
    'failed'
  );
}

export async function markOrderPaid(input: UpdateOrderInput): Promise<void> {
  await patchOrder(
    input.orderId,
    {
      status: 'paid',
      allpay_payment_id: input.paymentId ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? 'ILS',
      paid_at: new Date().toISOString(),
      allpay_raw: input.raw ?? null,
    },
    'paid'
  );
}
