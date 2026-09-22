import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import chromium from '@sparticuz/chromium';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';
import puppeteer from 'puppeteer-core';

import { SHOWS, isShowSlug } from '@/shows';
import type { Lang } from '@/shows/types';
import type { StoredOrder } from './ordersStore';
import { resolveOrderDetails } from './showEventDetails';

export type TicketArtifacts = {
  ticketCode: string;
  verifyUrl: string;
  qrImageUrl: string;
  pdfBase64: string;
  pdfFilename: string;
};

type PosterAsset = {
  dataUrl: string;
  bytes: Uint8Array;
  mimeType: string;
  alt: string;
};

type FontAsset = {
  dataUrl: string;
  bytes: Uint8Array;
};

export function generateTicketCode(orderId: string): string {
  return crypto.createHash('sha256').update(orderId).digest('hex').slice(0, 12).toUpperCase();
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripMarkdownLinks(input: string): string {
  return input.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

function cleanPlaceForTicket(input: string): string {
  const withoutLinks = stripMarkdownLinks(input);
  const withoutTicketingNotes = withoutLinks
    .replace(/\s*,?\s*(?:билеты|заказ билетов|информация и билеты|tickets?|order tickets|details and tickets|כרטיסים|פרטים וכרטיסים).*/iu, '')
    .trim()
    .replace(/[,\s]+$/u, '');

  return withoutTicketingNotes || withoutLinks;
}

function ticketWordRu(qty: number): string {
  const mod10 = qty % 10;
  const mod100 = qty % 100;
  if (mod10 === 1 && mod100 !== 11) return 'билет';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'билета';
  return 'билетов';
}

function buildPurchaseMessage(input: {
  lang: Lang;
  qty: number;
  showTitle: string;
  dateTime: string;
  place: string;
}): string {
  const place = cleanPlaceForTicket(input.place);

  if (input.lang === 'he') {
    return `רכשתם ${input.qty} כרטיסים למופע ״${input.showTitle}״ בכתובת ${place}, בתאריך ${input.dateTime}. נשמח לראותכם.`;
  }

  if (input.lang === 'en') {
    const ticketWord = input.qty === 1 ? 'ticket' : 'tickets';
    return `You have purchased ${input.qty} ${ticketWord} to "${input.showTitle}" at ${place} on ${input.dateTime}. We look forward to seeing you.`;
  }

  return `Вы купили ${input.qty} ${ticketWordRu(input.qty)} на спектакль «${input.showTitle}» по адресу ${place} ${input.dateTime}. Ждем вас.`;
}

function posterPathForOrder(showSlug: string, lang: Lang): string | null {
  if (!isShowSlug(showSlug)) return null;

  const show = SHOWS[showSlug];
  const content = show.content[lang] ?? show.content.ru ?? show.content.en ?? show.content.he;
  const posterImage = content?.posterImage;
  if (!posterImage) return null;

  const publicPath = posterImage.split('?')[0].replace(/^\/+/, '');
  return path.join(process.cwd(), 'public', publicPath);
}

function mimeTypeForFile(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return null;
}

async function resolvePosterAsset(showSlug: string, lang: Lang, alt: string): Promise<PosterAsset | null> {
  const posterPath = posterPathForOrder(showSlug, lang);
  if (!posterPath) return null;

  const mimeType = mimeTypeForFile(posterPath);
  if (!mimeType) return null;

  try {
    const bytes = await readFile(posterPath);
    return {
      dataUrl: `data:${mimeType};base64,${bytes.toString('base64')}`,
      bytes,
      mimeType,
      alt,
    };
  } catch (error) {
    console.error('[ticket] failed to load poster image', { showSlug, lang, posterPath, error });
    return null;
  }
}

async function resolveFontAsset(): Promise<FontAsset | null> {
  const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'DejaVuSans.ttf');

  try {
    const bytes = await readFile(fontPath);
    return {
      dataUrl: `data:font/ttf;base64,${bytes.toString('base64')}`,
      bytes,
    };
  } catch (error) {
    console.error('[ticket] failed to load ticket font', { fontPath, error });
    return null;
  }
}

function buildTicketHtml(input: {
  ticketCode: string;
  orderId: string;
  verifyUrl: string;
  lang: Lang;
  purchaseMessage: string;
  poster: PosterAsset | null;
  fontDataUrl: string | null;
}): string {
  const direction = input.lang === 'he' ? 'rtl' : 'ltr';
  const fontFace = input.fontDataUrl
    ? `@font-face { font-family: "TicketSans"; src: url("${input.fontDataUrl}") format("truetype"); font-weight: 400 800; }`
    : '';

  return `<!doctype html>
<html lang="${input.lang}" dir="${direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${fontFace}
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "TicketSans", "DejaVu Sans", Arial, sans-serif;
        color: #111827;
        background: #f8fafc;
      }
      .page {
        width: 794px;
        height: 1123px;
        margin: 0 auto;
        background: #ffffff;
        overflow: hidden;
      }
      .ticket-note {
        height: 180px;
        padding: 24px 34px 16px;
        background: #fff7ed;
        border-bottom: 3px solid #111827;
        overflow: hidden;
      }
      .message {
        margin: 0;
        font-size: 23px;
        font-weight: 800;
        line-height: 1.26;
      }
      .meta {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
        margin-top: 13px;
        color: #374151;
        font-size: 12px;
        line-height: 1.35;
      }
      .meta a { color: #1d4ed8; text-decoration: none; }
      .poster-wrap {
        width: 794px;
        height: 943px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
      }
      .poster {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .poster-fallback {
        padding: 48px;
        text-align: center;
        font-size: 28px;
        line-height: 1.35;
        color: #374151;
      }
      [dir="rtl"] .meta {
        flex-direction: row-reverse;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="ticket-note">
        <p class="message">${escapeHtml(input.purchaseMessage)}</p>
        <div class="meta">
          <span>Ticket code: ${escapeHtml(input.ticketCode)}</span>
          <span>Order: ${escapeHtml(input.orderId)}</span>
        </div>
      </section>
      <section class="poster-wrap">
        ${
          input.poster
            ? `<img class="poster" src="${input.poster.dataUrl}" alt="${escapeHtml(input.poster.alt)}" />`
            : `<div class="poster-fallback">${escapeHtml(input.purchaseMessage)}</div>`
        }
      </section>
    </main>
  </body>
</html>`;
}

function wrapPdfText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !currentLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function toFallbackVisualText(text: string, lang: Lang): string {
  if (lang !== 'he') return text;
  return Array.from(text).reverse().join('');
}

async function renderTicketToPdfFallback(input: {
  ticketCode: string;
  orderId: string;
  lang: Lang;
  purchaseMessage: string;
  poster: PosterAsset | null;
  fontBytes: Uint8Array | null;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const noteHeight = 138;
  const marginX = 26;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const font = input.fontBytes ? await pdfDoc.embedFont(input.fontBytes, { subset: true }) : await pdfDoc.embedFont(StandardFonts.Helvetica);
  const metaFont = input.fontBytes ? font : await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: pageHeight - noteHeight,
    width: pageWidth,
    height: noteHeight,
    color: rgb(1, 0.969, 0.929),
  });
  page.drawRectangle({
    x: 0,
    y: pageHeight - noteHeight - 2,
    width: pageWidth,
    height: 2,
    color: rgb(0.067, 0.094, 0.153),
  });

  const fontSize = 16;
  const lines = wrapPdfText(input.purchaseMessage, font, fontSize, pageWidth - marginX * 2).slice(0, 5);
  let y = pageHeight - 31;

  for (const line of lines) {
    const visualLine = toFallbackVisualText(line, input.lang);
    const textWidth = font.widthOfTextAtSize(visualLine, fontSize);
    page.drawText(visualLine, {
      x: input.lang === 'he' ? pageWidth - marginX - textWidth : marginX,
      y,
      size: fontSize,
      font,
      color: rgb(0.067, 0.094, 0.153),
    });
    y -= fontSize * 1.35;
  }

  page.drawText(`Ticket code: ${input.ticketCode}   Order: ${input.orderId}`, {
    x: marginX,
    y: pageHeight - noteHeight + 18,
    size: 8,
    font: metaFont,
    color: rgb(0.216, 0.255, 0.318),
  });

  if (input.poster) {
    const image =
      input.poster.mimeType === 'image/png'
        ? await pdfDoc.embedPng(input.poster.bytes)
        : await pdfDoc.embedJpg(input.poster.bytes);
    const posterHeight = pageHeight - noteHeight - 2;
    const scale = Math.min(pageWidth / image.width, posterHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (posterHeight - height) / 2,
      width,
      height,
    });
  }

  return pdfDoc.save();
}

async function renderHtmlToPdf(html: string): Promise<Uint8Array> {
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--disable-gpu', '--font-render-hinting=none'],
    executablePath: executablePath || undefined,
    defaultViewport: {
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    },
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

export async function buildTicketArtifacts(order: StoredOrder): Promise<TicketArtifacts> {
  const baseUrl = process.env.APP_BASE_URL ?? process.env.CANONICAL_SITE_URL ?? 'https://ryba-kiva.com';
  const ticketCode = generateTicketCode(order.order_id);
  const verifyUrl = `${baseUrl}/ticket/validate?order_id=${encodeURIComponent(order.order_id)}&ticket=${ticketCode}&show=${encodeURIComponent(order.show_slug)}`;

  const details = await resolveOrderDetails(order);
  const lang = details.eventLanguage;
  const showTitle = details.showTitle[lang] || details.showTitle.ru || details.showTitle.en || order.show_slug;
  const dateTime = details.eventDateTime[lang] || details.eventDateTime.ru || order.event_id || '-';
  const place = details.eventPlace[lang] || details.eventPlace.ru || '-';
  const purchaseMessage = buildPurchaseMessage({
    lang,
    qty: order.qty,
    showTitle,
    dateTime,
    place,
  });
  const poster = await resolvePosterAsset(order.show_slug, lang, showTitle);
  const fontAsset = await resolveFontAsset();

  const html = buildTicketHtml({
    ticketCode,
    orderId: order.order_id,
    verifyUrl,
    lang,
    purchaseMessage,
    poster,
    fontDataUrl: fontAsset?.dataUrl ?? null,
  });

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await renderHtmlToPdf(html);
  } catch (error) {
    console.error('[ticket] chromium render failed, falling back to pdf-lib ticket renderer', { orderId: order.order_id, error });
    pdfBytes = await renderTicketToPdfFallback({
      ticketCode,
      orderId: order.order_id,
      lang,
      purchaseMessage,
      poster,
      fontBytes: fontAsset?.bytes ?? null,
    });
  }

  return {
    ticketCode,
    verifyUrl,
    qrImageUrl: '',
    pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    pdfFilename: `ticket-${order.order_id}.pdf`,
  };
}
