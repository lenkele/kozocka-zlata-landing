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
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FONT_CANDIDATES = [
  path.join(process.cwd(), 'assets', 'fonts', 'DejaVuSans.ttf'),
  path.join(process.cwd(), 'DejaVuSans.ttf'),
];

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

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  if (!text) return ['-'];
  const words = text.split(' ');
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
  return lines.length > 0 ? lines : ['-'];
}

function drawTextLines(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options?: { size?: number; color?: ReturnType<typeof rgb>; lineHeight?: number }
): number {
  const size = options?.size ?? 11;
  const color = options?.color ?? rgb(0.12, 0.12, 0.12);
  const lineHeight = options?.lineHeight ?? size + 4;
  const lines = wrapText(font, text, size, maxWidth);

  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }

  return y;
}

function drawLabelValue(
  page: PDFPage,
  font: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
): number {
  const labelSize = 10;
  const valueSize = 12;
  page.drawText(label, { x, y, size: labelSize, font, color: rgb(0.45, 0.45, 0.45) });
  y -= labelSize + 5;
  y = drawTextLines(page, font, value, x, y, width, { size: valueSize, color: rgb(0.1, 0.1, 0.1), lineHeight: 16 });
  return y - 6;
}

function drawKeyValueRow(
  page: PDFPage,
  font: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
): number {
  const labelWidth = 140;
  const valueX = x + labelWidth;
  const valueWidth = Math.max(20, width - labelWidth);
  const labelSize = 11;
  const valueSize = 11;
  const lineHeight = 14;
  const valueLines = wrapText(font, value, valueSize, valueWidth);
  const rowHeight = Math.max(lineHeight, valueLines.length * lineHeight);

  page.drawText(label, {
    x,
    y,
    size: labelSize,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  let valueY = y;
  for (const line of valueLines) {
    page.drawText(line, {
      x: valueX,
      y: valueY,
      size: valueSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    valueY -= lineHeight;
  }

  return y - rowHeight - 8;
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

export async function buildTicketArtifacts(order: StoredOrder): Promise<TicketArtifacts> {
  const baseUrl = process.env.APP_BASE_URL ?? 'https://kozocka-zlata-landing-coral.vercel.app';
  const ticketCode = crypto.createHash('sha256').update(order.order_id).digest('hex').slice(0, 12).toUpperCase();
  const verifyUrl = `${baseUrl}/payment/success?order_id=${encodeURIComponent(order.order_id)}&ticket=${ticketCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}`;

  const details = await resolveOrderDetails(order);
  const showTitle = details.showTitle.ru !== '-' ? details.showTitle.ru : details.showTitle.en;
  const dateTime = details.eventDateTime.ru !== '-' ? details.eventDateTime.ru : details.eventDateTime.en;
  const place = details.eventPlace.ru !== '-' ? details.eventPlace.ru : details.eventPlace.en;

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
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 108,
    width: CONTENT_WIDTH,
    height: 74,
    color: rgb(0.12, 0.16, 0.22),
  });

  page.drawText('RYBA KIVA | E-TICKET', {
    x: MARGIN + 20,
    y: PAGE_HEIGHT - 72,
    size: 16,
    font,
    color: rgb(0.96, 0.96, 0.96),
  });
  page.drawText(`Ticket code: ${ticketCode}`, {
    x: MARGIN + 20,
    y: PAGE_HEIGHT - 93,
    size: 11,
    font,
    color: rgb(0.86, 0.9, 0.96),
  });

  page.drawRectangle({
    x: MARGIN,
    y: 96,
    width: CONTENT_WIDTH,
    height: PAGE_HEIGHT - 222,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: MARGIN,
    y: 96,
    width: CONTENT_WIDTH,
    height: PAGE_HEIGHT - 222,
    borderColor: rgb(0.86, 0.88, 0.92),
    borderWidth: 1,
  });

  const leftColX = MARGIN + 22;
  const leftColWidth = 332;
  const rightColX = MARGIN + 376;

  let y = PAGE_HEIGHT - 145;
  y = drawTextLines(page, font, showTitle, leftColX, y, leftColWidth, { size: 22, color: rgb(0.1, 0.12, 0.16), lineHeight: 28 });
  y -= 8;

  y = drawLabelValue(page, font, 'Дата и время / Date & time', dateTime, leftColX, y, leftColWidth);
  y = drawLabelValue(page, font, 'Место / Venue', place, leftColX, y, leftColWidth);

  y -= 6;
  page.drawRectangle({
    x: leftColX,
    y: y - 2,
    width: leftColWidth,
    height: 1,
    color: rgb(0.9, 0.92, 0.95),
  });
  y -= 16;

  y = drawKeyValueRow(page, font, 'Покупатель / Buyer', order.buyer_name || '-', leftColX, y, leftColWidth);
  y = drawKeyValueRow(page, font, 'Email', order.buyer_email, leftColX, y, leftColWidth);
  y = drawKeyValueRow(page, font, 'Количество / Qty', String(order.qty), leftColX, y, leftColWidth);
  y = drawKeyValueRow(page, font, 'Сумма / Amount', amountLabel(order), leftColX, y, leftColWidth);

  const qrImage = await embedQrImage(pdfDoc, qrImageUrl);
  if (qrImage) {
    page.drawImage(qrImage, {
      x: rightColX,
      y: PAGE_HEIGHT - 330,
      width: 150,
      height: 150,
    });
  } else {
    page.drawRectangle({
      x: rightColX,
      y: PAGE_HEIGHT - 330,
      width: 150,
      height: 150,
      borderColor: rgb(0.82, 0.84, 0.88),
      borderWidth: 1,
    });
    page.drawText('QR unavailable', {
      x: rightColX + 35,
      y: PAGE_HEIGHT - 255,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  let qrTextY = PAGE_HEIGHT - 350;
  qrTextY = drawTextLines(page, font, 'Покажите QR-код на входе.', rightColX, qrTextY, 150, {
    size: 10,
    color: rgb(0.25, 0.25, 0.25),
    lineHeight: 14,
  });
  qrTextY = drawTextLines(page, font, 'Show this QR code at the entrance.', rightColX, qrTextY - 2, 150, {
    size: 10,
    color: rgb(0.25, 0.25, 0.25),
    lineHeight: 14,
  });
  drawTextLines(page, font, 'אפשר לסרוק את הקוד בכניסה.', rightColX, qrTextY - 2, 150, {
    size: 10,
    color: rgb(0.25, 0.25, 0.25),
    lineHeight: 14,
  });

  page.drawText(`Order ID: ${order.order_id}`, {
    x: MARGIN + 22,
    y: 78,
    size: 9,
    font,
    color: rgb(0.42, 0.42, 0.42),
  });
  page.drawText('Verify link is embedded in the QR code', {
    x: MARGIN + 22,
    y: 62,
    size: 9,
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
