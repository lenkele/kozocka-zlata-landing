#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import yaml from 'js-yaml';

const ROOT = process.cwd();
const SHOWS_TO_SYNC = ['zlata', 'marita'];

const FORMAT_FROM_RU = {
  'открытый показ': { en: 'Public performance', he: 'מופע פתוח' },
  'закрытый показ': { en: 'Private performance', he: 'מופע סגור' },
};

const LANGUAGE_FROM_RU = {
  русский: { en: 'Russian', he: 'רוסית' },
  иврит: { en: 'Hebrew', he: 'עברית' },
  английский: { en: 'English', he: 'אנגלית' },
};

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function toDateIso(value) {
  if (value instanceof Date) {
    const yyyy = String(value.getUTCFullYear());
    const mm = String(value.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(value.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  }

  return '';
}

function toTime(value) {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : '';
}

function toPositiveNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Number(value.toFixed(2));
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed) && parsed > 0) return Number(parsed.toFixed(2));
  }
  return null;
}

function toPositiveInt(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function normalizeUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function mapFormat(formatRu, lang) {
  const mapped = FORMAT_FROM_RU[formatRu.trim().toLowerCase()];
  return mapped?.[lang] ?? formatRu;
}

function mapLanguage(languageRu, lang) {
  const mapped = LANGUAGE_FROM_RU[languageRu.trim().toLowerCase()];
  return mapped?.[lang] ?? languageRu;
}

function isPrivateFormat(formatRu) {
  return formatRu.trim().toLowerCase() === 'закрытый показ';
}

function isLegacyPriceNotNullError(errorText) {
  const text = String(errorText ?? '').toLowerCase();
  return text.includes('price_ils') && text.includes('null value') && text.includes('not-null constraint');
}

function buildRow(showSlug, event, index) {
  const entries = event?.entries ?? {};
  const ru = entries.ru ?? {};
  const en = entries.en ?? {};
  const he = entries.he ?? {};

  const dateIso = toDateIso(event?.date_iso);
  const time = toTime(ru.time) || toTime(en.time) || toTime(he.time);
  const eventId = typeof event?.id === 'string' ? event.id.trim() : '';
  const placeRu = typeof ru.place === 'string' ? ru.place.trim() : '';
  const placeEnRaw = typeof en.place === 'string' ? en.place.trim() : '';
  const placeHeRaw = typeof he.place === 'string' ? he.place.trim() : '';
  const placeEn = placeEnRaw || placeRu;
  const placeHe = placeHeRaw || placeRu;
  const formatRu = typeof ru.format === 'string' ? ru.format.trim() : '';
  const languageRu = typeof ru.language === 'string' ? ru.language.trim() : '';

  if (!eventId) throw new Error(`[${showSlug}] row ${index + 1}: missing id`);
  if (!dateIso) throw new Error(`[${showSlug}] row ${index + 1}: invalid date_iso`);
  if (!time) throw new Error(`[${showSlug}] row ${index + 1}: invalid time`);
  if (!placeRu || !placeEn || !placeHe) throw new Error(`[${showSlug}] row ${index + 1}: place is required`);
  if (!formatRu) throw new Error(`[${showSlug}] row ${index + 1}: format_ru is required`);
  if (!languageRu) throw new Error(`[${showSlug}] row ${index + 1}: language_ru is required`);

  const privateFormat = isPrivateFormat(formatRu);
  const ticketModeRaw = typeof event?.ticket_mode === 'string' ? event.ticket_mode.trim().toLowerCase() : 'self';
  const ticketMode = privateFormat ? 'self' : ticketModeRaw === 'venue' ? 'venue' : 'self';
  const ticketUrl = privateFormat ? null : ticketMode === 'venue' ? normalizeUrl(event?.ticket_url) : null;
  const priceIls = privateFormat ? null : ticketMode === 'self' ? toPositiveNumber(event?.price_ils) : null;
  const capacity = privateFormat ? null : toPositiveInt(event?.capacity);

  return {
    show_slug: showSlug,
    event_id: eventId,
    date_iso: dateIso,
    time,
    place_ru: placeRu,
    place_en: placeEn,
    place_he: placeHe,
    waze_url: normalizeUrl(event?.waze_url),
    format_ru: formatRu,
    format_en: (typeof en.format === 'string' ? en.format.trim() : '') || mapFormat(formatRu, 'en'),
    format_he: (typeof he.format === 'string' ? he.format.trim() : '') || mapFormat(formatRu, 'he'),
    language_ru: languageRu,
    language_en: (typeof en.language === 'string' ? en.language.trim() : '') || mapLanguage(languageRu, 'en'),
    language_he: (typeof he.language === 'string' ? he.language.trim() : '') || mapLanguage(languageRu, 'he'),
    price_ils: priceIls,
    capacity,
    ticket_mode: ticketMode,
    ticket_url: ticketUrl,
    is_active: true,
  };
}

async function loadYamlRows(showSlug) {
  const filePath = path.join(ROOT, 'public', 'shows', showSlug, 'data', 'schedule.yaml');
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = yaml.load(raw) ?? {};
  const schedule = Array.isArray(parsed.schedule) ? parsed.schedule : [];
  return schedule.map((event, index) => buildRow(showSlug, event, index));
}

async function supabaseRequest(baseUrl, serviceRoleKey, requestPath, init) {
  return fetch(`${baseUrl}/rest/v1${requestPath}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

async function run() {
  const baseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const allRows = [];
  for (const showSlug of SHOWS_TO_SYNC) {
    const rows = await loadYamlRows(showSlug);
    allRows.push(...rows);
  }

  const resetResponse = await supabaseRequest(
    baseUrl,
    serviceRoleKey,
    `/schedule_events?show_slug=in.(${SHOWS_TO_SYNC.join(',')},demo)`,
    { method: 'DELETE' },
  );
  const resetText = await resetResponse.text();
  if (!resetResponse.ok) {
    throw new Error(`failed to reset schedule_events: ${resetResponse.status} ${resetText}`);
  }

  if (allRows.length === 0) {
    console.log('No rows to import.');
    return;
  }

  let insertResponse = await supabaseRequest(
    baseUrl,
    serviceRoleKey,
    '/schedule_events?on_conflict=show_slug,event_id',
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(allRows),
    },
  );
  let insertText = await insertResponse.text();
  if (!insertResponse.ok && isLegacyPriceNotNullError(insertText)) {
    // Compatibility fallback for DBs where old NOT NULL is still active on price_ils.
    const patchedRows = allRows.map((row) => ({
      ...row,
      price_ils: row.price_ils ?? 1,
    }));
    insertResponse = await supabaseRequest(
      baseUrl,
      serviceRoleKey,
      '/schedule_events?on_conflict=show_slug,event_id',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(patchedRows),
      },
    );
    insertText = await insertResponse.text();
  }
  if (!insertResponse.ok) {
    throw new Error(`failed to insert rows: ${insertResponse.status} ${insertText}`);
  }

  console.log(`Imported ${allRows.length} rows from YAML (shows: ${SHOWS_TO_SYNC.join(', ')})`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
