import type { StoredOrder } from './ordersStore';

export const ORDER_SHEET_HEADER = [
  'Дата оплаты',
  'Имя',
  'Email',
  'Билетов',
  'Сумма',
  'Валюта',
  'Спектакль',
  'Показ (event_id)',
  'Order ID',
];

type AppsScriptResponse = {
  ok?: boolean;
  id?: string;
  url?: string;
  error?: string;
};

type AppsScriptPayload =
  | { action: 'create'; title: string; header: string[] }
  | { action: 'append'; sheetId: string; row: Array<string | number> };

function getConfig(): { url: string; secret: string } | null {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

export function isSheetsIntegrationEnabled(): boolean {
  return getConfig() !== null;
}

async function callAppsScript(payload: AppsScriptPayload): Promise<AppsScriptResponse> {
  const config = getConfig();
  if (!config) {
    throw new Error('GOOGLE_SHEETS_WEBHOOK_URL / GOOGLE_SHEETS_WEBHOOK_SECRET are required');
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.secret, ...payload }),
    cache: 'no-store',
    redirect: 'follow',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`[googleSheet] apps script HTTP ${response.status}: ${text}`);
  }

  let result: AppsScriptResponse;
  try {
    result = JSON.parse(text) as AppsScriptResponse;
  } catch {
    throw new Error(`[googleSheet] apps script returned non-JSON: ${text}`);
  }

  if (result.ok === false) {
    throw new Error(`[googleSheet] apps script error: ${result.error ?? 'unknown'}`);
  }

  return result;
}

export async function createEventSheet(input: { title: string; header?: string[] }): Promise<{ id: string; url: string }> {
  const result = await callAppsScript({
    action: 'create',
    title: input.title,
    header: input.header ?? ORDER_SHEET_HEADER,
  });

  if (!result.id) {
    throw new Error('[googleSheet] create returned no spreadsheet id');
  }

  return { id: result.id, url: result.url ?? '' };
}

export async function appendOrderRow(sheetId: string, order: StoredOrder): Promise<void> {
  await callAppsScript({
    action: 'append',
    sheetId,
    row: buildOrderSheetRow(order),
  });
}

export function buildOrderSheetRow(order: StoredOrder): Array<string | number> {
  return [
    order.paid_at ?? new Date().toISOString(),
    order.buyer_name ?? '',
    order.buyer_email,
    order.qty,
    order.amount ?? '',
    order.currency ?? 'ILS',
    order.show_slug,
    order.event_id ?? '',
    order.order_id,
  ];
}
