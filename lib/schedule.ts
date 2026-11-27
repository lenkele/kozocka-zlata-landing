import path from 'node:path';
import { readFile } from 'node:fs/promises';

import yaml from 'js-yaml';
import { unstable_cache } from 'next/cache';

import { isShowSlug } from '@/shows';
import type { ShowSlug } from '@/shows/types';

export type ScheduleEntry = {
  time: string;
  place: string;
  format: string;
  format_original?: string;
  language: string;
  date_text?: string;
  city?: string;
};

export type ScheduleEvent = {
  id?: string;
  date_iso?: string | Date;
  price_ils?: number | string;
  capacity?: number | string;
  ticket_mode?: 'self' | 'venue';
  ticket_url?: string;
  waze_url?: string;
  entries?: Partial<Record<'ru' | 'he' | 'en', ScheduleEntry>>;
};

type ScheduleYaml = {
  schedule?: ScheduleEvent[];
};

type ScheduleEventRow = {
  event_id: string;
  date_iso: string;
  time: string;
  place_ru: string;
  place_en: string;
  place_he: string;
  format_ru: string;
  format_en: string;
  format_he: string;
  language_ru: string;
  language_en: string;
  language_he: string;
  comment_ru?: string | null;
  comment_en?: string | null;
  comment_he?: string | null;
  city_ru?: string | null;
  city_en?: string | null;
  city_he?: string | null;
  price_ils: number | string | null;
  capacity: number | string | null;
  ticket_mode: 'self' | 'venue' | string | null;
  ticket_url: string | null;
  waze_url: string | null;
};

export function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function resolveCapacity(value: unknown): number | null {
  return parsePositiveInt(value);
}

// 0 — бесплатный показ / добровольный донат (оплата через сайт недоступна).
function parsePriceIls(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Number.isInteger(value) ? value : Number.parseFloat(value.toFixed(2));
  }

  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.');

    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Number.isInteger(parsed) ? parsed : Number.parseFloat(parsed.toFixed(2));
    }
  }

  return null;
}

export function resolveUnitPrice(value: unknown, fallbackPrice: number): number {
  const parsed = parsePriceIls(value);
  return parsed ?? fallbackPrice;
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return { supabaseUrl, serviceRoleKey };
}

async function supabaseRequest(requestPath: string, init: RequestInit): Promise<Response> {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
  return fetch(`${supabaseUrl}/rest/v1${requestPath}`, {
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

function cleanCity(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapSupabaseRowToEvent(row: ScheduleEventRow): ScheduleEvent {
  // Город на нужном языке; если его нет — любой заполненный (лучше, чем ничего).
  const anyCity = cleanCity(row.city_en) ?? cleanCity(row.city_ru) ?? cleanCity(row.city_he);
  return {
    id: row.event_id,
    date_iso: row.date_iso,
    price_ils: row.price_ils ?? undefined,
    capacity: row.capacity ?? undefined,
    ticket_mode: row.ticket_mode === 'venue' ? 'venue' : 'self',
    ticket_url: row.ticket_url ?? undefined,
    waze_url: row.waze_url ?? undefined,
    entries: {
      ru: {
        time: row.time,
        place: row.place_ru,
        format: row.comment_ru?.trim() || row.format_ru,
        format_original: row.format_ru,
        language: row.language_ru,
        city: cleanCity(row.city_ru) ?? anyCity,
      },
      he: {
        time: row.time,
        place: row.place_he,
        format: row.comment_he?.trim() || row.format_he,
        format_original: row.format_he,
        language: row.language_he,
        city: cleanCity(row.city_he) ?? anyCity,
      },
      en: {
        time: row.time,
        place: row.place_en,
        format: row.comment_en?.trim() || row.format_en,
        format_original: row.format_en,
        language: row.language_en,
        city: cleanCity(row.city_en) ?? anyCity,
      },
    },
  };
}

const BASE_SELECT_FIELDS =
  'event_id,date_iso,time,place_ru,place_en,place_he,waze_url,format_ru,format_en,format_he,language_ru,language_en,language_he,price_ils,capacity,ticket_mode,ticket_url';

// Необязательные колонки (добавлялись миграциями). Если какой-то ещё нет в базе,
// запрос повторяется без неё — расписание и продажи не должны ломаться.
export const OPTIONAL_SCHEDULE_COLUMNS = {
  comments: ['comment_ru', 'comment_en', 'comment_he'],
  city: ['city_ru', 'city_en', 'city_he'],
} as const;

export type OptionalScheduleColumnGroup = keyof typeof OPTIONAL_SCHEDULE_COLUMNS;

/** Какую группу необязательных колонок упоминает ошибка Supabase (колонки нет в базе). */
export function findMissingColumnGroup(
  errorText: string,
  groups: readonly OptionalScheduleColumnGroup[],
): OptionalScheduleColumnGroup | null {
  const text = errorText.toLowerCase();
  return groups.find((group) => OPTIONAL_SCHEDULE_COLUMNS[group].some((column) => text.includes(column))) ?? null;
}

async function loadSupabaseSchedule(showSlug: ShowSlug): Promise<ScheduleEvent[]> {
  let groups: OptionalScheduleColumnGroup[] = ['comments', 'city'];
  let response: Response;
  let text: string;

  for (;;) {
    const select = [BASE_SELECT_FIELDS, ...groups.flatMap((group) => OPTIONAL_SCHEDULE_COLUMNS[group])].join(',');
    response = await supabaseRequest(
      `/schedule_events?show_slug=eq.${encodeURIComponent(showSlug)}&is_active=eq.true&select=${select}&order=date_iso.asc,time.asc`,
      { method: 'GET' },
    );
    text = await response.text();
    if (response.ok) break;
    const missing = findMissingColumnGroup(text, groups);
    if (!missing) break;
    groups = groups.filter((group) => group !== missing);
  }

  if (!response.ok) {
    throw new Error(`failed to fetch schedule events from Supabase: ${response.status} ${text}`);
  }
  const rows = text ? (JSON.parse(text) as ScheduleEventRow[]) : [];
  return rows.map(mapSupabaseRowToEvent);
}

async function loadLocalYamlSchedule(showSlug: ShowSlug): Promise<ScheduleEvent[]> {
  const schedulePath = path.join(process.cwd(), 'public', 'shows', showSlug, 'data', 'schedule.yaml');
  try {
    const raw = await readFile(schedulePath, 'utf8');
    const parsed = yaml.load(raw) as ScheduleYaml;
    return Array.isArray(parsed.schedule) ? parsed.schedule : [];
  } catch {
    return [];
  }
}

export async function loadScheduleForShow(showSlug: string): Promise<ScheduleEvent[]> {
  if (!isShowSlug(showSlug)) return [];
  const typedShowSlug = showSlug as ShowSlug;

  try {
    const scheduleFromDb = await loadSupabaseSchedule(typedShowSlug);
    if (scheduleFromDb.length > 0) {
      return scheduleFromDb;
    }
  } catch (error) {
    console.error('[schedule] failed to load Supabase schedule, fallback to local yaml', { showSlug, error });
  }

  return loadLocalYamlSchedule(typedShowSlug);
}

export async function getCachedScheduleForShow(showSlug: string): Promise<ScheduleEvent[]> {
  if (!isShowSlug(showSlug)) return [];

  const cached = unstable_cache(async () => loadScheduleForShow(showSlug), ['schedule', showSlug], {
    revalidate: 300,
    tags: [`schedule-${showSlug}`],
  });

  return cached();
}

export function normalizeScheduleDate(value: ScheduleEvent['date_iso']): string {
  if (typeof value === 'string') {
    return value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? '';
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return '';
}

export function getTodayIsoInIsrael(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function parseSchedulePrice(value: ScheduleEvent['price_ils']): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.trim().replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function isClosedSchedule(format: string): boolean {
  const normalized = format.toLowerCase();
  return normalized.includes('закрыт') || normalized.includes('סגור') || normalized.includes('private');
}
