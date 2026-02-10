import path from 'node:path';
import { readFile } from 'node:fs/promises';

import yaml from 'js-yaml';

import { isShowSlug } from '@/shows';

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

export async function loadScheduleForShow(showSlug: string): Promise<ScheduleEvent[]> {
  if (!isShowSlug(showSlug)) return [];

  const schedulePath = path.join(process.cwd(), 'public', 'shows', showSlug, 'data', 'schedule.yaml');
  const raw = await readFile(schedulePath, 'utf8');
  const parsed = yaml.load(raw) as ScheduleYaml;
  return Array.isArray(parsed.schedule) ? parsed.schedule : [];
}
