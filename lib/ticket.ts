import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, type PDFFont, type PDFPage, rgb } from 'pdf-lib';

import type { StoredOrder } from './ordersStore';

export type TicketArtifacts = {
  ticketCode: string;
  verifyUrl: string;
  qrImageUrl: string;
  pdfBase64: string;
  pdfFilename: string;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT_X = 40;
const RIGHT_X = 390;
const CONTENT_WIDTH = RIGHT_X - LEFT_X;
const FONT_SIZE = 12;
const LINE_GAP = 18;

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

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  if (!text) return [''];

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);

    // If a single token is longer than the line width, hard-wrap by characters.
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = '';
      for (const ch of word) {
        const chunkCandidate = `${chunk}${ch}`;
        if (font.widthOfTextAtSize(chunkCandidate, size) <= maxWidth) {
          chunk = chunkCandidate;
          continue;
        }
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
      current = chunk;
      continue;
    }

    current = word;
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function drawWrappedLine(
  page: PDFPage,
  font: PDFFont,
  text: string,
  y: number,
  options: { size?: number; rtl?: boolean; color?: ReturnType<typeof rgb> } = {}
): number {
  const size = options.size ?? FONT_SIZE;
  const maxWidth = CONTENT_WIDTH;
  const lines = wrapText(font, text, size, maxWidth);

  for (const line of lines) {
    const width = font.widthOfTextAtSize(line, size);
    const x = options.rtl ? Math.max(LEFT_X, RIGHT_X - width) : LEFT_X;
    page.drawText(line, {
      x,
      y,
      size,
      font,
      color: options.color ?? rgb(0.1, 0.1, 0.1),
    });
    y -= LINE_GAP;
  }

  return y;
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

function amountLabel(order: StoredOrder): string {
  return order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;
}

export async function buildTicketArtifacts(order: StoredOrder): Promise<TicketArtifacts> {
  const baseUrl = process.env.APP_BASE_URL ?? 'https://kozocka-zlata-landing-coral.vercel.app';
  const ticketCode = crypto.createHash('sha256').update(order.order_id).digest('hex').slice(0, 12).toUpperCase();
  const verifyUrl = `${baseUrl}/payment/success?order_id=${encodeURIComponent(order.order_id)}&ticket=${ticketCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}`;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadUnicodeFont();
  const font = await pdfDoc.embedFont(fontBytes, { subset: false });
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const qrImage = await embedQrImage(pdfDoc, qrImageUrl);
  if (qrImage) {
    page.drawImage(qrImage, {
      x: 405,
      y: 640,
      width: 150,
      height: 150,
    });
  }

  let y = 800;
  y = drawWrappedLine(page, font, 'RYBA KIVA - TICKET', y, { size: 18 });
  y = drawWrappedLine(page, font, 'БИЛЕТ - РЫБА КИВА', y);
  y = drawWrappedLine(page, font, 'כרטיס - ריבה קיבה', y, { rtl: true });
  y -= 8;

  const common = {
    ticketCode,
    orderId: order.order_id,
    show: order.show_slug,
    event: order.event_id || '-',
    name: order.buyer_name || '-',
    email: order.buyer_email,
    qty: String(order.qty),
    amount: amountLabel(order),
  };

  y = drawWrappedLine(page, font, 'English', y, { size: 14 });
  y = drawWrappedLine(page, font, `Ticket code: ${common.ticketCode}`, y);
  y = drawWrappedLine(page, font, `Order: ${common.orderId}`, y);
  y = drawWrappedLine(page, font, `Show: ${common.show}`, y);
  y = drawWrappedLine(page, font, `Event: ${common.event}`, y);
  y = drawWrappedLine(page, font, `Name: ${common.name}`, y);
  y = drawWrappedLine(page, font, `Email: ${common.email}`, y);
  y = drawWrappedLine(page, font, `Qty: ${common.qty}`, y);
  y = drawWrappedLine(page, font, `Amount: ${common.amount}`, y);
  y -= 6;

  y = drawWrappedLine(page, font, 'Русский', y, { size: 14 });
  y = drawWrappedLine(page, font, `Код билета: ${common.ticketCode}`, y);
  y = drawWrappedLine(page, font, `Заказ: ${common.orderId}`, y);
  y = drawWrappedLine(page, font, `Спектакль: ${common.show}`, y);
  y = drawWrappedLine(page, font, `Сеанс: ${common.event}`, y);
  y = drawWrappedLine(page, font, `Имя: ${common.name}`, y);
  y = drawWrappedLine(page, font, `Email: ${common.email}`, y);
  y = drawWrappedLine(page, font, `Количество: ${common.qty}`, y);
  y = drawWrappedLine(page, font, `Сумма: ${common.amount}`, y);
  y -= 6;

  y = drawWrappedLine(page, font, 'עברית', y, { size: 14, rtl: true });
  y = drawWrappedLine(page, font, `קוד כרטיס: ${common.ticketCode}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `הזמנה: ${common.orderId}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `מופע: ${common.show}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `אירוע: ${common.event}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `שם: ${common.name}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `דוא"ל: ${common.email}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `כמות: ${common.qty}`, y, { rtl: true });
  y = drawWrappedLine(page, font, `סכום: ${common.amount}`, y, { rtl: true });
  y -= 8;

  y = drawWrappedLine(
    page,
    font,
    'Use the QR code in this PDF to verify the ticket. / Используйте QR-код в PDF для проверки билета.',
    y,
    { size: 10, color: rgb(0.25, 0.25, 0.25) }
  );
  drawWrappedLine(page, font, 'השתמשו בקוד ה-QR שב-PDF כדי לאמת את הכרטיס.', y, {
    size: 10,
    color: rgb(0.25, 0.25, 0.25),
    rtl: true,
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
