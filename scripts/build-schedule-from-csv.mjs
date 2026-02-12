#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

const REQUIRED_COLUMNS = [
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
];

function getArgValue(args, flag) {
  const idx = args.findIndex((item) => item === flag);
  if (idx === -1 || idx + 1 >= args.length) return '';
  return args[idx + 1];
}

function parseCsv(text) {
  const rows = [];
  let row = [];
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

function toPositiveNumber(value, fieldName, rowNumber) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Row ${rowNumber}: invalid ${fieldName} "${value}"`);
  }
  return Number.isInteger(parsed) ? parsed : Number.parseFloat(parsed.toFixed(2));
}

function toOptionalCapacity(value, rowNumber) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Row ${rowNumber}: invalid capacity "${value}"`);
  }
  return parsed;
}

function toOptionalText(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || undefined;
}

function requireText(value, fieldName, rowNumber) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    throw new Error(`Row ${rowNumber}: required field "${fieldName}" is empty`);
  }
  return trimmed;
}

function buildScheduleObject(headers, rows) {
  const index = new Map(headers.map((header, idx) => [header, idx]));

  for (const column of REQUIRED_COLUMNS) {
    if (!index.has(column)) {
      throw new Error(`Missing required column: ${column}`);
    }
  }

  const schedule = rows
    .filter((values) => values.some((value) => String(value ?? '').trim() !== ''))
    .map((values, rowIdx) => {
      const rowNumber = rowIdx + 2;
      const get = (column) => values[index.get(column)] ?? '';

      const id = requireText(get('id'), 'id', rowNumber);
      const dateIso = requireText(get('date_iso'), 'date_iso', rowNumber);
      const priceIls = toPositiveNumber(get('price_ils'), 'price_ils', rowNumber);
      const capacity = toOptionalCapacity(get('capacity'), rowNumber);

      const event = {
        id,
        date_iso: dateIso,
        price_ils: priceIls,
        entries: {
          ru: {
            time: requireText(get('ru_time'), 'ru_time', rowNumber),
            place: requireText(get('ru_place'), 'ru_place', rowNumber),
            format: requireText(get('ru_format'), 'ru_format', rowNumber),
            language: requireText(get('ru_language'), 'ru_language', rowNumber),
            date_text: toOptionalText(get('ru_date_text')),
          },
          he: {
            time: requireText(get('he_time'), 'he_time', rowNumber),
            place: requireText(get('he_place'), 'he_place', rowNumber),
            format: requireText(get('he_format'), 'he_format', rowNumber),
            language: requireText(get('he_language'), 'he_language', rowNumber),
            date_text: toOptionalText(get('he_date_text')),
          },
          en: {
            time: requireText(get('en_time'), 'en_time', rowNumber),
            place: requireText(get('en_place'), 'en_place', rowNumber),
            format: requireText(get('en_format'), 'en_format', rowNumber),
            language: requireText(get('en_language'), 'en_language', rowNumber),
            date_text: toOptionalText(get('en_date_text')),
          },
        },
      };

      if (capacity !== null) {
        event.capacity = capacity;
      }

      return event;
    });

  return { schedule };
}

async function main() {
  const args = process.argv.slice(2);
  const inputRaw = getArgValue(args, '--input');
  const outputRaw = getArgValue(args, '--output');

  if (!inputRaw || !outputRaw) {
    throw new Error('Usage: node scripts/build-schedule-from-csv.mjs --input <source.csv> --output <schedule.yaml>');
  }

  const inputPath = path.resolve(process.cwd(), inputRaw);
  const outputPath = path.resolve(process.cwd(), outputRaw);

  const rawCsv = await readFile(inputPath, 'utf8');
  const rows = parseCsv(rawCsv);
  if (rows.length === 0) {
    throw new Error('CSV is empty');
  }

  const headers = rows[0].map((value) => String(value).trim());
  const dataRows = rows.slice(1);
  const scheduleObj = buildScheduleObject(headers, dataRows);
  const yamlText = yaml.dump(scheduleObj, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });

  await writeFile(outputPath, yamlText, 'utf8');
  console.log(`[schedule-build] wrote ${scheduleObj.schedule.length} events -> ${outputRaw}`);
}

main().catch((error) => {
  console.error(`[schedule-build] ${error.message}`);
  process.exitCode = 1;
});
