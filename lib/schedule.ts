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
  language: string;
  date_text?: string;
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

function parsePriceIls(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
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
    if (Number.isFinite(parsed) && parsed > 0) {
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

function mapSupabaseRowToEvent(row: ScheduleEventRow): ScheduleEvent {
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
        format: row.format_ru,
        language: row.language_ru,
      },
      he: {
        time: row.time,
        place: row.place_he,
        format: row.format_he,
        language: row.language_he,
      },
      en: {
        time: row.time,
        place: row.place_en,
        format: row.format_en,
        language: row.language_en,
      },
    },
  };
}

async function loadSupabaseSchedule(showSlug: ShowSlug): Promise<ScheduleEvent[]> {
  const response = await supabaseRequest(
    `/schedule_events?show_slug=eq.${encodeURIComponent(showSlug)}&is_active=eq.true&select=event_id,date_iso,time,place_ru,place_en,place_he,waze_url,format_ru,format_en,format_he,language_ru,language_en,language_he,price_ils,capacity,ticket_mode,ticket_url&order=date_iso.asc,time.asc`,
    { method: 'GET' },
  );
  const text = await response.text();
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
