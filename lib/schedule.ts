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
  price_ils: number | string;
  capacity: number | string | null;
  ticket_mode: 'self' | 'venue' | string | null;
  ticket_url: string | null;
};

const CSV_SCHEMA = {
  id: ['id'],
  dateIso: ['date_iso'],
  dateDisplay: ['Дата', 'date', 'date_display'],
  time: ['Время', 'time', 'ru_time'],
  placeRu: ['Место_ru', 'ru_place'],
  placeEn: ['Место_en', 'en_place'],
  placeHe: ['Место_he', 'he_place'],
  formatRu: ['Формат_ru', 'ru_format'],
  formatEn: ['Формат_en', 'en_format'],
  formatHe: ['Формат_he', 'he_format'],
  langRu: ['Язык_ru', 'ru_language'],
  langEn: ['Язык_en', 'en_language'],
  langHe: ['Язык_he', 'he_language'],
  priceIls: ['Стоимость', 'price_ils'],
  capacity: ['Кол-во мест', 'capacity'],
  ticketMode: ['Продажа_билетов', 'ticket_mode', 'ticket_seller'],
  ticketUrl: ['Ссылка_билетов', 'ticket_url', 'ticket_link'],
} as const;

const FORMAT_FROM_RU: Record<string, { en: string; he: string }> = {
  'открытый показ': { en: 'Public performance', he: 'מופע פתוח' },
  'закрытый показ': { en: 'Private performance', he: 'מופע סגור' },
};

const LANGUAGE_FROM_RU: Record<string, { en: string; he: string }> = {
  русский: { en: 'Russian', he: 'רוסית' },
  иврит: { en: 'Hebrew', he: 'עברית' },
  английский: { en: 'English', he: 'אנגלית' },
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

export function resolveUnitPrice(value: unknown, fallbackPrice: number): number {
  const parsed = parsePriceIls(value);
  return parsed ?? fallbackPrice;
}

function envCsvKey(showSlug: ShowSlug): string {
  return `SCHEDULE_CSV_URL_${showSlug.toUpperCase()}`;
}

function getScheduleCsvUrl(showSlug: ShowSlug): string {
  return process.env[envCsvKey(showSlug)]?.trim() ?? '';
}

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

function normalizeGoogleCsvUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) return value;

  try {
    const url = new URL(value);

    // If editor URL was pasted, convert it to export CSV URL.
    if (url.hostname === 'docs.google.com' && /\/spreadsheets\/d\/[^/]+\/edit/.test(url.pathname)) {
      const idMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)\//);
      const id = idMatch?.[1] ?? '';
      const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? '0';
      if (id) {
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
      }
    }

    // Ensure published URL is explicitly CSV.
    if (url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets/d/e/') && url.pathname.endsWith('/pub')) {
      url.searchParams.set('output', 'csv');
      if (!url.searchParams.has('gid')) {
        url.searchParams.set('gid', '0');
      }
      if (!url.searchParams.has('single')) {
        url.searchParams.set('single', 'true');
      }
      return url.toString();
    }

    return url.toString();
  } catch {
    return value;
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (ch === '\r') continue;
    field += ch;
  }

  row.push(field);
  if (row.some((value) => value.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

function buildHeaderMap(headers: string[]): Map<string, number> {
  return new Map(headers.map((header, idx) => [header.trim(), idx]));
}

function getByAliases(row: string[], headerMap: Map<string, number>, aliases: readonly string[]): string {
  for (const alias of aliases) {
    const idx = headerMap.get(alias);
    if (idx === undefined) continue;
    const value = (row[idx] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function requireByAliases(row: string[], headerMap: Map<string, number>, aliases: readonly string[], rowNum: number, label: string): string {
  const value = getByAliases(row, headerMap, aliases);
  if (!value) {
    throw new Error(`row ${rowNum}: required field "${label}" is empty`);
  }
  return value;
}

function hasAnyAlias(headerMap: Map<string, number>, aliases: readonly string[]): boolean {
  return aliases.some((alias) => headerMap.has(alias));
}

function parseDateDisplayToIso(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return '';
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDateIso(value: string): string {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;
  return parseDateDisplayToIso(trimmed);
}

function mapFormatFromRu(formatRu: string, lang: 'en' | 'he'): string {
  const mapped = FORMAT_FROM_RU[formatRu.trim().toLowerCase()];
  return mapped?.[lang] ?? formatRu;
}

function mapLanguageFromRu(languageRu: string, lang: 'en' | 'he'): string {
  const mapped = LANGUAGE_FROM_RU[languageRu.trim().toLowerCase()];
  return mapped?.[lang] ?? languageRu;
}

function parsePriceIls(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Number.isInteger(value) ? value : Number.parseFloat(value.toFixed(2));
  }

  if (typeof value === 'string') {
    // Handles: "10", "10.5", "10,50", "₪ 10,00"
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

function parseTicketMode(value: string): 'self' | 'venue' {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'self';

  if (
    normalized === 'venue' ||
    normalized === 'external' ||
    normalized === 'площадка' ||
    normalized === 'площадка продает' ||
    normalized === 'площадка продаёт'
  ) {
    return 'venue';
  }

  return 'self';
}

function normalizeTicketUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed;
}

function parseCsvSchedule(text: string): ScheduleEvent[] {
  const rows = parseCsv(text);
  if (rows.length <= 1) return [];

  const headers = rows[0].map((value) => value.trim()).filter(Boolean);
  const headerMap = buildHeaderMap(headers);

  const requiredSchemaKeys: Array<keyof typeof CSV_SCHEMA> = [
    'id',
    'priceIls',
    'time',
    'placeRu',
    'placeEn',
    'placeHe',
    'formatRu',
    'langRu',
  ];

  for (const key of requiredSchemaKeys) {
    if (!hasAnyAlias(headerMap, CSV_SCHEMA[key])) {
      throw new Error(`missing required CSV column: one of [${CSV_SCHEMA[key].join(', ')}]`);
    }
  }

  if (!hasAnyAlias(headerMap, CSV_SCHEMA.dateIso) && !hasAnyAlias(headerMap, CSV_SCHEMA.dateDisplay)) {
    throw new Error('missing required date column: one of [date_iso] or [Дата]');
  }

  return rows
    .slice(1)
    .filter((row) => row.some((value) => value.trim() !== ''))
    .map((row, index) => {
      const rowNum = index + 2;
      const id = requireByAliases(row, headerMap, CSV_SCHEMA.id, rowNum, 'id');
      const rawDateIso = getByAliases(row, headerMap, CSV_SCHEMA.dateIso);
      const rawDateDisplay = getByAliases(row, headerMap, CSV_SCHEMA.dateDisplay);
      const date_iso = normalizeDateIso(rawDateIso || rawDateDisplay);
      if (!date_iso) {
        throw new Error(`row ${rowNum}: invalid date, expected YYYY-MM-DD or DD.MM.YYYY`);
      }

      const rawPriceIls = requireByAliases(row, headerMap, CSV_SCHEMA.priceIls, rowNum, 'Стоимость');
      const price_ils = parsePriceIls(rawPriceIls);
      if (price_ils === null) {
        throw new Error(`row ${rowNum}: invalid price in "Стоимость" (${rawPriceIls})`);
      }
      const capacity = getByAliases(row, headerMap, CSV_SCHEMA.capacity) || undefined;
      const ticketModeRaw = getByAliases(row, headerMap, CSV_SCHEMA.ticketMode);
      const ticket_mode = parseTicketMode(ticketModeRaw);
      const ticket_url = normalizeTicketUrl(getByAliases(row, headerMap, CSV_SCHEMA.ticketUrl));
      const time = requireByAliases(row, headerMap, CSV_SCHEMA.time, rowNum, 'Время');

      const formatRu = requireByAliases(row, headerMap, CSV_SCHEMA.formatRu, rowNum, 'Формат_ru');
      const formatEn = getByAliases(row, headerMap, CSV_SCHEMA.formatEn) || mapFormatFromRu(formatRu, 'en');
      const formatHe = getByAliases(row, headerMap, CSV_SCHEMA.formatHe) || mapFormatFromRu(formatRu, 'he');

      const langRu = requireByAliases(row, headerMap, CSV_SCHEMA.langRu, rowNum, 'Язык_ru');
      const langEn = getByAliases(row, headerMap, CSV_SCHEMA.langEn) || mapLanguageFromRu(langRu, 'en');
      const langHe = getByAliases(row, headerMap, CSV_SCHEMA.langHe) || mapLanguageFromRu(langRu, 'he');
      const placeRu = requireByAliases(row, headerMap, CSV_SCHEMA.placeRu, rowNum, 'Место_ru');
      const placeEn = getByAliases(row, headerMap, CSV_SCHEMA.placeEn) || placeRu;
      const placeHe = getByAliases(row, headerMap, CSV_SCHEMA.placeHe) || placeRu;

      const event: ScheduleEvent = {
        id,
        date_iso,
        price_ils,
        entries: {
          ru: {
            time,
            place: placeRu,
            format: formatRu,
            language: langRu,
          },
          he: {
            time,
            place: placeHe,
            format: formatHe,
            language: langHe,
          },
          en: {
            time,
            place: placeEn,
            format: formatEn,
            language: langEn,
          },
        },
      };

      if (capacity) {
        event.capacity = capacity;
      }
      event.ticket_mode = ticket_mode;

      if (ticket_mode === 'venue') {
        if (!ticket_url) {
          throw new Error(`row ${rowNum}: required field "Ссылка_билетов" is empty for venue ticketing`);
        }
        event.ticket_url = ticket_url;
      }

      return event;
    });
}

function mapSupabaseRowToEvent(row: ScheduleEventRow): ScheduleEvent {
  return {
    id: row.event_id,
    date_iso: row.date_iso,
    price_ils: row.price_ils,
    capacity: row.capacity ?? undefined,
    ticket_mode: row.ticket_mode === 'venue' ? 'venue' : 'self',
    ticket_url: row.ticket_url ?? undefined,
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
    `/schedule_events?show_slug=eq.${encodeURIComponent(showSlug)}&is_active=eq.true&select=event_id,date_iso,time,place_ru,place_en,place_he,format_ru,format_en,format_he,language_ru,language_en,language_he,price_ils,capacity,ticket_mode,ticket_url&order=date_iso.asc,time.asc`,
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
  const raw = await readFile(schedulePath, 'utf8');
  const parsed = yaml.load(raw) as ScheduleYaml;
  return Array.isArray(parsed.schedule) ? parsed.schedule : [];
}

async function loadGoogleCsvSchedule(showSlug: ShowSlug): Promise<ScheduleEvent[]> {
  const csvUrl = normalizeGoogleCsvUrl(getScheduleCsvUrl(showSlug));
  if (!csvUrl) return [];

  const response = await fetch(csvUrl, {
    cache: 'no-store',
    redirect: 'follow',
    headers: {
      Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; RybaKivaScheduleBot/1.0; +https://ryba-kiva.com)',
    },
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 240);
    throw new Error(`failed to fetch CSV: ${response.status} ${response.statusText}; body=${body}`);
  }
  const rawCsv = await response.text();
  return parseCsvSchedule(rawCsv);
}

export async function loadScheduleForShow(
  showSlug: string,
  options?: {
    forceRemote?: boolean;
  }
): Promise<ScheduleEvent[]> {
  if (!isShowSlug(showSlug)) return [];
  const typedShowSlug = showSlug as ShowSlug;

  try {
    const scheduleFromDb = await loadSupabaseSchedule(typedShowSlug);
    if (scheduleFromDb.length > 0) {
      return scheduleFromDb;
    }
  } catch (error) {
    if (options?.forceRemote) {
      throw error;
    }
    console.error('[schedule] failed to load Supabase schedule, fallback to external/local', { showSlug, error });
  }

  const csvUrl = getScheduleCsvUrl(typedShowSlug);
  if (csvUrl) {
    try {
      return await loadGoogleCsvSchedule(typedShowSlug);
    } catch (error) {
      if (options?.forceRemote) {
        throw error;
      }
      console.error('[schedule] failed to load Google CSV, fallback to local yaml', { showSlug, error });
    }
  }

  return loadLocalYamlSchedule(typedShowSlug);
}

export async function getCachedScheduleForShow(showSlug: string): Promise<ScheduleEvent[]> {
  if (!isShowSlug(showSlug)) return [];

  const cached = unstable_cache(
    async () => loadScheduleForShow(showSlug),
    ['schedule', showSlug],
    {
      revalidate: 300,
      tags: [`schedule-${showSlug}`],
    }
  );

  return cached();
}
