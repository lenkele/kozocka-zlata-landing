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
  entries?: Partial<Record<'ru' | 'he' | 'en', ScheduleEntry>>;
};

type ScheduleYaml = {
  schedule?: ScheduleEvent[];
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
  const parsed = parsePositiveInt(value);
  return parsed ?? fallbackPrice;
}

function envCsvKey(showSlug: ShowSlug): string {
  return `SCHEDULE_CSV_URL_${showSlug.toUpperCase()}`;
}

function getScheduleCsvUrl(showSlug: ShowSlug): string {
  return process.env[envCsvKey(showSlug)]?.trim() ?? '';
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

      const price_ils = requireByAliases(row, headerMap, CSV_SCHEMA.priceIls, rowNum, 'Стоимость');
      const capacity = getByAliases(row, headerMap, CSV_SCHEMA.capacity) || undefined;
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

      return event;
    });
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
