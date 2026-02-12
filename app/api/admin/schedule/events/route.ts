import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { getCookieName, getAdminScheduleCredentials, verifySessionToken } from '@/lib/adminScheduleAuth';
import { isShowSlug } from '@/shows';

type CreateEventBody = {
  showSlug?: string;
  eventId?: string;
  dateIso?: string;
  time?: string;
  placeRu?: string;
  placeEn?: string;
  placeHe?: string;
  wazeUrl?: string;
  formatRu?: string;
  formatEn?: string;
  formatHe?: string;
  languageRu?: string;
  languageEn?: string;
  languageHe?: string;
  commentRu?: string;
  commentEn?: string;
  commentHe?: string;
  priceIls?: number | string;
  capacity?: number | string | null;
  ticketMode?: 'self' | 'venue' | string;
  ticketUrl?: string;
};

type ScheduleEventRow = {
  show_slug: string;
  event_id: string;
  date_iso: string;
  time: string;
  place_ru: string;
  place_en: string;
  place_he: string;
  waze_url: string | null;
  format_ru: string;
  format_en: string;
  format_he: string;
  language_ru: string;
  language_en: string;
  language_he: string;
  comment_ru?: string | null;
  comment_en?: string | null;
  comment_he?: string | null;
  price_ils: number | null;
  capacity: number | null;
  ticket_mode: 'self' | 'venue';
  ticket_url: string | null;
  is_active?: boolean;
};

const FORMAT_FROM_RU: Record<string, { en: string; he: string }> = {
  'открытый показ': { en: 'Public performance', he: 'מופע פתוח' },
  'закрытый показ': { en: 'Private performance', he: 'מופע סגור' },
};

const LANGUAGE_FROM_RU: Record<string, { en: string; he: string }> = {
  русский: { en: 'Russian', he: 'רוסית' },
  иврит: { en: 'Hebrew', he: 'עברית' },
  английский: { en: 'English', he: 'אנגלית' },
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

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((item) => item.trim());
  for (const part of parts) {
    const [key, ...value] = part.split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

function isAuthorized(request: Request): boolean {
  const credentials = getAdminScheduleCredentials();
  if (!credentials) return false;
  const token = readCookie(request, getCookieName());
  if (!token) return false;
  const payload = verifySessionToken(token);
  if (!payload) return false;
  return payload.login === credentials.login;
}

function isValidDateIso(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function parsePriceIls(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Number.parseFloat(value.toFixed(2));
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Number.parseFloat(parsed.toFixed(2));
    }
  }
  return null;
}

function parseCapacity(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function parseTicketMode(value: unknown): 'self' | 'venue' {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'venue' ? 'venue' : 'self';
}

function resolvePlaces(placeRuRaw: string, placeEnRaw: string, placeHeRaw: string) {
  const placeRu = placeRuRaw.trim();
  const placeEn = placeEnRaw.trim();
  const placeHe = placeHeRaw.trim();
  const fallback = placeRu || placeEn || placeHe;

  return {
    placeRu: placeRu || fallback,
    placeEn: placeEn || fallback,
    placeHe: placeHe || fallback,
    hasAtLeastOne: Boolean(fallback),
  };
}

function normalizeTicketUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

function mapFormatFromRu(formatRu: string, lang: 'en' | 'he'): string {
  const mapped = FORMAT_FROM_RU[formatRu.trim().toLowerCase()];
  return mapped?.[lang] ?? formatRu;
}

function mapLanguageFromRu(languageRu: string, lang: 'en' | 'he'): string {
  const mapped = LANGUAGE_FROM_RU[languageRu.trim().toLowerCase()];
  return mapped?.[lang] ?? languageRu;
}

function isPrivateFormat(formatRu: string): boolean {
  return formatRu.trim().toLowerCase() === 'закрытый показ';
}

function isLegacyPriceNotNullError(errorText: string): boolean {
  const text = errorText.toLowerCase();
  return text.includes('price_ils') && text.includes('null value') && text.includes('not-null constraint');
}

function isMissingCommentColumnError(errorText: string): boolean {
  const text = errorText.toLowerCase();
  return text.includes('comment_ru') || text.includes('comment_en') || text.includes('comment_he');
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const SELECT_FIELDS_WITH_COMMENTS =
  'show_slug,event_id,date_iso,time,place_ru,place_en,place_he,waze_url,format_ru,format_en,format_he,language_ru,language_en,language_he,comment_ru,comment_en,comment_he,price_ils,capacity,ticket_mode,ticket_url';

const SELECT_FIELDS_BASE =
  'show_slug,event_id,date_iso,time,place_ru,place_en,place_he,waze_url,format_ru,format_en,format_he,language_ru,language_en,language_he,price_ils,capacity,ticket_mode,ticket_url';

function buildBaseEventId(dateIso: string, time: string): string {
  const date = dateIso.replaceAll('-', '');
  const hhmm = time.replace(':', '');
  return `${date}-${hhmm}`;
}

async function ensureUniqueEventId(showSlug: string, baseEventId: string): Promise<string> {
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? baseEventId : `${baseEventId}-${attempt}`;
    const response = await supabaseRequest(
      `/schedule_events?show_slug=eq.${encodeURIComponent(showSlug)}&event_id=eq.${encodeURIComponent(candidate)}&select=event_id&limit=1`,
      { method: 'GET' },
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`[admin-schedule] check event id failed: ${response.status} ${text}`);
    }
    const rows = text ? (JSON.parse(text) as Array<{ event_id: string }>) : [];
    if (rows.length === 0) return candidate;
  }
  throw new Error('failed to generate unique event_id');
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const showParam = (url.searchParams.get('show')?.trim() ?? 'all').toLowerCase();
  const loadAll = showParam === 'all' || showParam === '';
  if (!loadAll && !isShowSlug(showParam)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }

  const queryWithComments = loadAll
    ? `/schedule_events?is_active=eq.true&select=${SELECT_FIELDS_WITH_COMMENTS}&order=date_iso.desc,time.desc`
    : `/schedule_events?show_slug=eq.${encodeURIComponent(showParam)}&is_active=eq.true&select=${SELECT_FIELDS_WITH_COMMENTS}&order=date_iso.desc,time.desc`;
  const queryWithoutComments = loadAll
    ? `/schedule_events?is_active=eq.true&select=${SELECT_FIELDS_BASE}&order=date_iso.desc,time.desc`
    : `/schedule_events?show_slug=eq.${encodeURIComponent(showParam)}&is_active=eq.true&select=${SELECT_FIELDS_BASE}&order=date_iso.desc,time.desc`;

  let response = await supabaseRequest(queryWithComments, { method: 'GET' });
  let text = await response.text();
  if (!response.ok && isMissingCommentColumnError(text)) {
    response = await supabaseRequest(queryWithoutComments, { method: 'GET' });
    text = await response.text();
  }
  if (!response.ok) {
    return NextResponse.json({ ok: false, reason: 'db_select_failed', message: text }, { status: 500 });
  }

  const events = text ? (JSON.parse(text) as ScheduleEventRow[]) : [];
  return NextResponse.json({ ok: true, events });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let body: CreateEventBody;
  try {
    body = (await request.json()) as CreateEventBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const showSlug = body.showSlug?.trim() ?? '';
  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }

  const dateIso = body.dateIso?.trim() ?? '';
  const time = body.time?.trim() ?? '';
  const places = resolvePlaces(body.placeRu ?? '', body.placeEn ?? '', body.placeHe ?? '');
  const placeRu = places.placeRu;
  const placeEn = places.placeEn;
  const placeHe = places.placeHe;
  const formatRu = body.formatRu?.trim() ?? '';
  const languageRu = body.languageRu?.trim() ?? '';
  const priceIls = parsePriceIls(body.priceIls);
  const capacity = parseCapacity(body.capacity);
  const requestedTicketMode = parseTicketMode(body.ticketMode);
  const ticketUrl = normalizeTicketUrl(body.ticketUrl);
  const wazeUrl = normalizeTicketUrl(body.wazeUrl);
  const privateFormat = isPrivateFormat(formatRu);
  const ticketMode: 'self' | 'venue' = privateFormat ? 'self' : requestedTicketMode;

  if (!dateIso || !isValidDateIso(dateIso)) {
    return NextResponse.json({ ok: false, reason: 'invalid_date_iso' }, { status: 400 });
  }
  if (!time || !isValidTime(time)) {
    return NextResponse.json({ ok: false, reason: 'invalid_time' }, { status: 400 });
  }
  if (!places.hasAtLeastOne) {
    return NextResponse.json({ ok: false, reason: 'place_required' }, { status: 400 });
  }
  if (!formatRu) {
    return NextResponse.json({ ok: false, reason: 'format_required' }, { status: 400 });
  }
  if (!languageRu) {
    return NextResponse.json({ ok: false, reason: 'language_required' }, { status: 400 });
  }
  if (!privateFormat && priceIls === null) {
    return NextResponse.json({ ok: false, reason: 'invalid_price' }, { status: 400 });
  }
  if (!privateFormat && ticketMode === 'venue' && !ticketUrl) {
    return NextResponse.json({ ok: false, reason: 'ticket_url_required' }, { status: 400 });
  }

  const effectivePrice = privateFormat ? null : priceIls;
  const effectiveCapacity = privateFormat ? null : capacity;
  const effectiveTicketUrl = privateFormat ? null : ticketMode === 'venue' ? ticketUrl : null;

  const formatEn = body.formatEn?.trim() || mapFormatFromRu(formatRu, 'en');
  const formatHe = body.formatHe?.trim() || mapFormatFromRu(formatRu, 'he');
  const languageEn = body.languageEn?.trim() || mapLanguageFromRu(languageRu, 'en');
  const languageHe = body.languageHe?.trim() || mapLanguageFromRu(languageRu, 'he');
  const commentRu = normalizeOptionalText(body.commentRu);
  const commentEn = normalizeOptionalText(body.commentEn);
  const commentHe = normalizeOptionalText(body.commentHe);
  const baseEventId = buildBaseEventId(dateIso, time);
  const eventId = await ensureUniqueEventId(showSlug, baseEventId);

  const insertPayload = {
    show_slug: showSlug,
    event_id: eventId,
    date_iso: dateIso,
    time,
    place_ru: placeRu,
    place_en: placeEn,
    place_he: placeHe,
    waze_url: wazeUrl,
    format_ru: formatRu,
    format_en: formatEn,
    format_he: formatHe,
    language_ru: languageRu,
    language_en: languageEn,
    language_he: languageHe,
    comment_ru: commentRu,
    comment_en: commentEn,
    comment_he: commentHe,
    price_ils: effectivePrice,
    capacity: effectiveCapacity,
    ticket_mode: ticketMode,
    ticket_url: effectiveTicketUrl,
    is_active: true,
  };

  let response = await supabaseRequest('/schedule_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(insertPayload),
  });

  let responseText = await response.text();
  if (!response.ok && (ticketMode === 'venue' || privateFormat) && isLegacyPriceNotNullError(responseText)) {
    // Compatibility fallback for DBs where old NOT NULL constraint is still active.
    response = await supabaseRequest('/schedule_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        ...insertPayload,
        price_ils: 1,
      }),
    });
    responseText = await response.text();
  }
  if (!response.ok && isMissingCommentColumnError(responseText)) {
    response = await supabaseRequest('/schedule_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        ...insertPayload,
        comment_ru: undefined,
        comment_en: undefined,
        comment_he: undefined,
      }),
    });
    responseText = await response.text();
  }

  if (!response.ok) {
    return NextResponse.json({ ok: false, reason: 'db_insert_failed', message: responseText }, { status: 500 });
  }

  revalidateTag(`schedule-${showSlug}`, 'max');

  const rows = responseText ? (JSON.parse(responseText) as ScheduleEventRow[]) : [];
  return NextResponse.json({ ok: true, event: rows[0] ?? null });
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let body: CreateEventBody;
  try {
    body = (await request.json()) as CreateEventBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const showSlug = body.showSlug?.trim() ?? '';
  const eventId = body.eventId?.trim() ?? '';
  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ ok: false, reason: 'event_id_required' }, { status: 400 });
  }

  const dateIso = body.dateIso?.trim() ?? '';
  const time = body.time?.trim() ?? '';
  const places = resolvePlaces(body.placeRu ?? '', body.placeEn ?? '', body.placeHe ?? '');
  const placeRu = places.placeRu;
  const placeEn = places.placeEn;
  const placeHe = places.placeHe;
  const formatRu = body.formatRu?.trim() ?? '';
  const languageRu = body.languageRu?.trim() ?? '';
  const priceIls = parsePriceIls(body.priceIls);
  const capacity = parseCapacity(body.capacity);
  const requestedTicketMode = parseTicketMode(body.ticketMode);
  const ticketUrl = normalizeTicketUrl(body.ticketUrl);
  const wazeUrl = normalizeTicketUrl(body.wazeUrl);
  const privateFormat = isPrivateFormat(formatRu);
  const ticketMode: 'self' | 'venue' = privateFormat ? 'self' : requestedTicketMode;

  if (!dateIso || !isValidDateIso(dateIso)) {
    return NextResponse.json({ ok: false, reason: 'invalid_date_iso' }, { status: 400 });
  }
  if (!time || !isValidTime(time)) {
    return NextResponse.json({ ok: false, reason: 'invalid_time' }, { status: 400 });
  }
  if (!places.hasAtLeastOne) {
    return NextResponse.json({ ok: false, reason: 'place_required' }, { status: 400 });
  }
  if (!formatRu) {
    return NextResponse.json({ ok: false, reason: 'format_required' }, { status: 400 });
  }
  if (!languageRu) {
    return NextResponse.json({ ok: false, reason: 'language_required' }, { status: 400 });
  }
  if (!privateFormat && priceIls === null) {
    return NextResponse.json({ ok: false, reason: 'invalid_price' }, { status: 400 });
  }
  if (!privateFormat && ticketMode === 'venue' && !ticketUrl) {
    return NextResponse.json({ ok: false, reason: 'ticket_url_required' }, { status: 400 });
  }

  const effectivePrice = privateFormat ? null : priceIls;
  const effectiveCapacity = privateFormat ? null : capacity;
  const effectiveTicketUrl = privateFormat ? null : ticketMode === 'venue' ? ticketUrl : null;

  const formatEn = body.formatEn?.trim() || mapFormatFromRu(formatRu, 'en');
  const formatHe = body.formatHe?.trim() || mapFormatFromRu(formatRu, 'he');
  const languageEn = body.languageEn?.trim() || mapLanguageFromRu(languageRu, 'en');
  const languageHe = body.languageHe?.trim() || mapLanguageFromRu(languageRu, 'he');
  const commentRu = normalizeOptionalText(body.commentRu);
  const commentEn = normalizeOptionalText(body.commentEn);
  const commentHe = normalizeOptionalText(body.commentHe);

  const updatePayload = {
    date_iso: dateIso,
    time,
    place_ru: placeRu,
    place_en: placeEn,
    place_he: placeHe,
    waze_url: wazeUrl,
    format_ru: formatRu,
    format_en: formatEn,
    format_he: formatHe,
    language_ru: languageRu,
    language_en: languageEn,
    language_he: languageHe,
    comment_ru: commentRu,
    comment_en: commentEn,
    comment_he: commentHe,
    price_ils: effectivePrice,
    capacity: effectiveCapacity,
    ticket_mode: ticketMode,
    ticket_url: effectiveTicketUrl,
  };

  const query = `/schedule_events?show_slug=eq.${encodeURIComponent(showSlug)}&event_id=eq.${encodeURIComponent(eventId)}`;
  let response = await supabaseRequest(query, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(updatePayload),
  });

  let responseText = await response.text();
  if (!response.ok && (ticketMode === 'venue' || privateFormat) && isLegacyPriceNotNullError(responseText)) {
    response = await supabaseRequest(query, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        ...updatePayload,
        price_ils: 1,
      }),
    });
    responseText = await response.text();
  }
  if (!response.ok && isMissingCommentColumnError(responseText)) {
    response = await supabaseRequest(query, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        ...updatePayload,
        comment_ru: undefined,
        comment_en: undefined,
        comment_he: undefined,
      }),
    });
    responseText = await response.text();
  }

  if (!response.ok) {
    return NextResponse.json({ ok: false, reason: 'db_update_failed', message: responseText }, { status: 500 });
  }

  const rows = responseText ? (JSON.parse(responseText) as ScheduleEventRow[]) : [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, reason: 'event_not_found' }, { status: 404 });
  }

  revalidateTag(`schedule-${showSlug}`, 'max');
  return NextResponse.json({ ok: true, event: rows[0] });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const showSlug = url.searchParams.get('showSlug')?.trim() ?? '';
  const eventId = url.searchParams.get('eventId')?.trim() ?? '';

  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ ok: false, reason: 'event_id_required' }, { status: 400 });
  }

  const response = await supabaseRequest(
    `/schedule_events?show_slug=eq.${encodeURIComponent(showSlug)}&event_id=eq.${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    },
  );

  const responseText = await response.text();
  if (!response.ok) {
    return NextResponse.json({ ok: false, reason: 'db_delete_failed', message: responseText }, { status: 500 });
  }

  const rows = responseText ? (JSON.parse(responseText) as ScheduleEventRow[]) : [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, reason: 'event_not_found' }, { status: 404 });
  }

  revalidateTag(`schedule-${showSlug}`, 'max');
  return NextResponse.json({ ok: true });
}
