import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, type PDFFont, type PDFPage, rgb } from 'pdf-lib';

import type { StoredOrder } from './ordersStore';
import { resolveOrderDetails } from './showEventDetails';

export type TicketArtifacts = {
  ticketCode: string;
  verifyUrl: string;
  qrImageUrl: string;
  pdfBase64: string;
  pdfFilename: string;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 36;
const CARD_X = MARGIN;
const CARD_Y = 92;
const CARD_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CARD_HEIGHT = PAGE_HEIGHT - CARD_Y - 36;
const HEADER_HEIGHT = 68;
const LEFT_X = CARD_X + 20;
const LEFT_WIDTH = 360;
const RIGHT_X = CARD_X + CARD_WIDTH - 132;
const QR_SIZE = 96;

const FONT_CANDIDATES = [
  path.join(process.cwd(), 'assets', 'fonts', 'DejaVuSans.ttf'),
  path.join(process.cwd(), 'DejaVuSans.ttf'),
];

type LangCode = 'ru' | 'en' | 'he';
const RLM = '\u200F';
const LRI = '\u2066';
const PDI = '\u2069';

async function loadUnicodeFont(): Promise<Uint8Array> {
  for (const filePath of FONT_CANDIDATES) {
    try {
      return await readFile(filePath);
    } catch {
      // try next location
    }
  }
  throw new Error('DejaVuSans.ttf not found (assets/fonts/DejaVuSans.ttf or project root)');
}

function amountLabel(order: StoredOrder): string {
  return order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number, maxLines?: number): string[] {
  const source = (text || '-').trim();
  if (!source) return ['-'];

  const words = source.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (current) {
        lines.push(current);
        current = '';
      }
      let chunk = '';
      for (const ch of word) {
        const candidate = `${chunk}${ch}`;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          chunk = candidate;
          continue;
        }
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
      current = chunk;
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);

  if (!maxLines || lines.length <= maxLines) return lines;

  const cropped = lines.slice(0, maxLines);
  const lastIndex = cropped.length - 1;
  let last = cropped[lastIndex];
  while (last.length > 0 && font.widthOfTextAtSize(`${last}...`, size) > maxWidth) {
    last = last.slice(0, -1);
  }
  cropped[lastIndex] = last ? `${last}...` : '...';
  return cropped;
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  width: number,
  options?: {
    size?: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
    rtl?: boolean;
    maxLines?: number;
    bold?: boolean;
  }
): number {
  const size = options?.size ?? 11;
  const lineHeight = options?.lineHeight ?? size + 3;
  const color = options?.color ?? rgb(0.14, 0.14, 0.14);
  const lines = wrapText(font, text, size, width, options?.maxLines);

  for (const line of lines) {
    const renderLine = options?.rtl ? applyRtlBidi(line) : line;
    const lineWidth = font.widthOfTextAtSize(line, size);
    const drawX = options?.rtl ? x + Math.max(0, width - lineWidth) : x;
    page.drawText(renderLine, { x: drawX, y, size, font, color });
    if (options?.bold) {
      page.drawText(renderLine, { x: drawX + 0.35, y, size, font, color });
    }
    y -= lineHeight;
  }

  return y;
}

function drawFieldRow(
  page: PDFPage,
  font: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  options?: { rtl?: boolean; maxValueLines?: number; rightLabelLeftValue?: boolean }
): number {
  const labelWidth = 124;
  const valueX = options?.rightLabelLeftValue ? x : x + labelWidth;
  const valueWidth = Math.max(20, width - labelWidth);
  const labelX = options?.rightLabelLeftValue ? x + valueWidth : x;
  const labelWidthLocal = options?.rightLabelLeftValue ? labelWidth : labelWidth;
  const labelColor = rgb(0.45, 0.45, 0.45);

  const visualLabel = options?.rtl ? applyRtlBidi(label) : label;
  const labelTextWidth = font.widthOfTextAtSize(label, 9);
  const labelDrawX = options?.rightLabelLeftValue
    ? labelX + Math.max(0, labelWidthLocal - labelTextWidth)
    : labelX;
  page.drawText(visualLabel, {
    x: labelDrawX,
    y,
    size: 9,
    font,
    color: labelColor,
  });

  const lines = wrapText(font, value, 10, valueWidth, options?.maxValueLines ?? 2);
  let valueY = y;
  for (const line of lines) {
    const visualLine = options?.rtl ? applyRtlBidi(line) : line;
    const lineWidth = font.widthOfTextAtSize(line, 10);
    const drawX = options?.rtl && !options?.rightLabelLeftValue ? valueX + Math.max(0, valueWidth - lineWidth) : valueX;
    page.drawText(visualLine, {
      x: drawX,
      y: valueY,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    valueY -= 13;
  }

  const rowHeight = Math.max(13, lines.length * 13);
  return y - rowHeight - 6;
}

function drawSectionTitle(page: PDFPage, font: PDFFont, title: string, x: number, y: number, rtl = false): number {
  return drawWrapped(page, font, title, x, y, LEFT_WIDTH, {
    size: 11,
    lineHeight: 14,
    color: rgb(0.1, 0.12, 0.16),
    rtl,
    maxLines: 1,
  }) - 2;
}

function drawDivider(page: PDFPage, x: number, y: number, width: number): number {
  page.drawRectangle({
    x,
    y,
    width,
    height: 1,
    color: rgb(0.9, 0.92, 0.95),
  });
  return y - 14;
}

function applyRtlBidi(input: string): string {
  const isolatedLtrRuns = input.replace(/[A-Za-z0-9@:%+./,_'"()\-]+/g, (chunk) => `${LRI}${chunk}${PDI}`);
  return `${RLM}${isolatedLtrRuns}${RLM}`;
}

async function embedQrImage(pdfDoc: PDFDocument, qrImageUrl: string) {
  try {
    const response = await fetch(qrImageUrl);
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    return await pdfDoc.embedPng(bytes);
  } catch {
    return null;
  }
}

function langTitle(lang: LangCode): string {
  if (lang === 'ru') return 'Русский';
  if (lang === 'en') return 'English';
  return 'עברית';
}

function labels(lang: LangCode) {
  if (lang === 'ru') {
    return {
      show: 'Спектакль',
      dateTime: 'Дата и время',
      venue: 'Место',
    };
  }
  if (lang === 'en') {
    return {
      show: 'Show',
      dateTime: 'Date & time',
      venue: 'Venue',
    };
  }
  return {
    show: 'מופע',
    dateTime: 'תאריך ושעה',
    venue: 'מקום',
  };
}

export async function buildTicketArtifacts(order: StoredOrder): Promise<TicketArtifacts> {
  const baseUrl = process.env.APP_BASE_URL ?? 'https://kozocka-zlata-landing-coral.vercel.app';
  const ticketCode = crypto.createHash('sha256').update(order.order_id).digest('hex').slice(0, 12).toUpperCase();
  const verifyUrl = `${baseUrl}/payment/success?order_id=${encodeURIComponent(order.order_id)}&ticket=${ticketCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}`;

  const details = await resolveOrderDetails(order);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadUnicodeFont();
  const font = await pdfDoc.embedFont(fontBytes, { subset: false });
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.965, 0.968, 0.974),
  });

  page.drawRectangle({
    x: CARD_X,
    y: CARD_Y,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: CARD_X,
    y: CARD_Y,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderColor: rgb(0.84, 0.87, 0.92),
    borderWidth: 1,
  });

  page.drawRectangle({
    x: CARD_X,
    y: CARD_Y + CARD_HEIGHT - HEADER_HEIGHT,
    width: CARD_WIDTH,
    height: HEADER_HEIGHT,
    color: rgb(0.11, 0.15, 0.22),
  });

  page.drawText('RYBA KIVA | E-TICKET', {
    x: LEFT_X,
    y: CARD_Y + CARD_HEIGHT - 28,
    size: 14,
    font,
    color: rgb(0.95, 0.96, 0.98),
  });
  page.drawText(`Ticket code: ${ticketCode}`, {
    x: LEFT_X,
    y: CARD_Y + CARD_HEIGHT - 46,
    size: 10,
    font,
    color: rgb(0.84, 0.89, 0.96),
  });

  const showTitleLine = `${details.showTitle.ru} | ${details.showTitle.en} | ${applyRtlBidi(details.showTitle.he)}`;

  let y = CARD_Y + CARD_HEIGHT - HEADER_HEIGHT - 20;
  y = drawWrapped(page, font, showTitleLine, LEFT_X, y, LEFT_WIDTH, {
    size: 11,
    lineHeight: 14,
    color: rgb(0.1, 0.12, 0.16),
    maxLines: 1,
    bold: true,
  });
  y -= 2;

  const langs: LangCode[] = ['ru', 'en', 'he'];
  for (const lang of langs) {
    const l = labels(lang);
    const rtl = lang === 'he';
    y = drawSectionTitle(page, font, langTitle(lang), LEFT_X, y, rtl);
    y = drawFieldRow(page, font, l.show, details.showTitle[lang], LEFT_X, y, LEFT_WIDTH, {
      rtl,
      maxValueLines: 1,
      rightLabelLeftValue: rtl,
    });
    y = drawFieldRow(page, font, l.dateTime, details.eventDateTime[lang], LEFT_X, y, LEFT_WIDTH, {
      rtl,
      maxValueLines: 2,
      rightLabelLeftValue: rtl,
    });
    y = drawFieldRow(page, font, l.venue, details.eventPlace[lang], LEFT_X, y, LEFT_WIDTH, {
      rtl,
      maxValueLines: 2,
      rightLabelLeftValue: rtl,
    });
    y = drawDivider(page, LEFT_X, y, LEFT_WIDTH);
  }

  y = drawSectionTitle(page, font, `Purchase details / Данные покупки / ${applyRtlBidi('פרטי רכישה')}`, LEFT_X, y);
  y = drawFieldRow(page, font, `Buyer / Покупатель / ${applyRtlBidi('רוכש')}`, order.buyer_name || '-', LEFT_X, y, LEFT_WIDTH, { maxValueLines: 2 });
  y = drawFieldRow(page, font, 'Email', order.buyer_email, LEFT_X, y, LEFT_WIDTH, { maxValueLines: 2 });
  y = drawFieldRow(page, font, `Qty / Кол-во / ${applyRtlBidi('כמות')}`, String(order.qty), LEFT_X, y, LEFT_WIDTH, { maxValueLines: 1 });
  y = drawFieldRow(page, font, `Amount / Сумма / ${applyRtlBidi('סכום')}`, amountLabel(order), LEFT_X, y, LEFT_WIDTH, { maxValueLines: 1 });

  const qrTopY = CARD_Y + CARD_HEIGHT - HEADER_HEIGHT - 20;
  page.drawRectangle({
    x: RIGHT_X - 8,
    y: qrTopY - (QR_SIZE + 8),
    width: QR_SIZE + 16,
    height: QR_SIZE + 16,
    color: rgb(0.985, 0.988, 0.992),
    borderColor: rgb(0.86, 0.88, 0.92),
    borderWidth: 1,
  });

  const qrImage = await embedQrImage(pdfDoc, qrImageUrl);
  if (qrImage) {
    page.drawImage(qrImage, {
      x: RIGHT_X,
      y: qrTopY - QR_SIZE,
      width: QR_SIZE,
      height: QR_SIZE,
    });
  } else {
    page.drawRectangle({
      x: RIGHT_X,
      y: qrTopY - QR_SIZE,
      width: QR_SIZE,
      height: QR_SIZE,
      borderColor: rgb(0.82, 0.84, 0.88),
      borderWidth: 1,
    });
    page.drawText('QR', {
      x: RIGHT_X + 40,
      y: qrTopY - 48,
      size: 14,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  let qrTextY = qrTopY - QR_SIZE - 18;
  qrTextY = drawWrapped(page, font, 'Покажите QR на входе', RIGHT_X - 4, qrTextY, QR_SIZE + 8, {
    size: 8,
    lineHeight: 11,
    color: rgb(0.3, 0.3, 0.3),
    maxLines: 2,
  });
  qrTextY = drawWrapped(page, font, 'Show QR at the entrance', RIGHT_X - 4, qrTextY, QR_SIZE + 8, {
    size: 8,
    lineHeight: 11,
    color: rgb(0.3, 0.3, 0.3),
    maxLines: 2,
  });
  drawWrapped(page, font, 'הציגו QR בכניסה', RIGHT_X - 4, qrTextY, QR_SIZE + 8, {
    size: 8,
    lineHeight: 11,
    color: rgb(0.3, 0.3, 0.3),
    rtl: true,
    maxLines: 2,
  });

  page.drawText(`Order ID: ${order.order_id}`, {
    x: LEFT_X,
    y: CARD_Y + 14,
    size: 8.5,
    font,
    color: rgb(0.42, 0.42, 0.42),
  });
  page.drawText('Verification URL is encoded in the QR code', {
    x: LEFT_X,
    y: CARD_Y + 2,
    size: 8.5,
    font,
    color: rgb(0.42, 0.42, 0.42),
  });

  const pdfBytes = await pdfDoc.save();

  return {
    ticketCode,
    verifyUrl,
    qrImageUrl,
    pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    pdfFilename: `ticket-${order.order_id}.pdf`,
  };
}
