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

const CSV_REQUIRED_COLUMNS = [
  'id',
  'date_iso',
  'price_ils',
  'capacity',
  'ru_time',
  'ru_place',
  'ru_format',
  'ru_language',
  'ru_date_text',
  'he_time',
  'he_place',
  'he_format',
  'he_language',
  'he_date_text',
  'en_time',
  'en_place',
  'en_format',
  'en_language',
  'en_date_text',
] as const;

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

function requireField(row: string[], indexMap: Map<string, number>, key: string, rowNum: number): string {
  const idx = indexMap.get(key);
  const value = idx === undefined ? '' : (row[idx] ?? '').trim();
  if (!value) {
    throw new Error(`row ${rowNum}: required field "${key}" is empty`);
  }
  return value;
}

function optionalField(row: string[], indexMap: Map<string, number>, key: string): string | undefined {
  const idx = indexMap.get(key);
  const value = idx === undefined ? '' : (row[idx] ?? '').trim();
  return value || undefined;
}

function parseCsvSchedule(text: string): ScheduleEvent[] {
  const rows = parseCsv(text);
  if (rows.length <= 1) return [];

  const headers = rows[0].map((value) => value.trim());
  const indexMap = new Map(headers.map((header, idx) => [header, idx]));

  for (const column of CSV_REQUIRED_COLUMNS) {
    if (!indexMap.has(column)) {
      throw new Error(`missing required CSV column "${column}"`);
    }
  }

  return rows
    .slice(1)
    .filter((row) => row.some((value) => value.trim() !== ''))
    .map((row, index) => {
      const rowNum = index + 2;
      const id = requireField(row, indexMap, 'id', rowNum);
      const date_iso = requireField(row, indexMap, 'date_iso', rowNum);
      const price_ils = requireField(row, indexMap, 'price_ils', rowNum);
      const capacity = optionalField(row, indexMap, 'capacity');

      const event: ScheduleEvent = {
        id,
        date_iso,
        price_ils,
        entries: {
          ru: {
            time: requireField(row, indexMap, 'ru_time', rowNum),
            place: requireField(row, indexMap, 'ru_place', rowNum),
            format: requireField(row, indexMap, 'ru_format', rowNum),
            language: requireField(row, indexMap, 'ru_language', rowNum),
            date_text: optionalField(row, indexMap, 'ru_date_text'),
          },
          he: {
            time: requireField(row, indexMap, 'he_time', rowNum),
            place: requireField(row, indexMap, 'he_place', rowNum),
            format: requireField(row, indexMap, 'he_format', rowNum),
            language: requireField(row, indexMap, 'he_language', rowNum),
            date_text: optionalField(row, indexMap, 'he_date_text'),
          },
          en: {
            time: requireField(row, indexMap, 'en_time', rowNum),
            place: requireField(row, indexMap, 'en_place', rowNum),
            format: requireField(row, indexMap, 'en_format', rowNum),
            language: requireField(row, indexMap, 'en_language', rowNum),
            date_text: optionalField(row, indexMap, 'en_date_text'),
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
  const csvUrl = getScheduleCsvUrl(showSlug);
  if (!csvUrl) return [];

  const response = await fetch(csvUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`failed to fetch CSV: ${response.status}`);
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
