import crypto from 'node:crypto';

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import type { StoredOrder } from './ordersStore';
import { resolveOrderDetails } from './showEventDetails';

export type TicketArtifacts = {
  ticketCode: string;
  verifyUrl: string;
  qrImageUrl: string;
  pdfBase64: string;
  pdfFilename: string;
};

function amountLabel(order: StoredOrder): string {
  return order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatHebrewMixed(input: string): string {
  const tokens = input.match(/[A-Za-z0-9@:%+./,_'"()\-]+|[^A-Za-z0-9@:%+./,_'"()\-]+/g) ?? [input];
  const html = tokens
    .map((token) => {
      if (/^[A-Za-z0-9@:%+./,_'"()\-]+$/.test(token)) {
        return `<span class="ltr-token">${escapeHtml(token)}</span>`;
      }
      return `<span class="rtl-token">${escapeHtml(token)}</span>`;
    })
    .join('');

  return `<span class="he-mixed">${html}</span>`;
}

function buildTicketHtml(input: {
  ticketCode: string;
  orderId: string;
  qrImageUrl: string;
  showRu: string;
  showEn: string;
  showHe: string;
  dateRu: string;
  dateEn: string;
  dateHe: string;
  venueRu: string;
  venueEn: string;
  venueHe: string;
  buyerName: string;
  buyerEmail: string;
  qty: string;
  amount: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "DejaVu Sans", Arial, sans-serif; color: #111827; background: #eef1f6; }
      .page { width: 794px; margin: 0 auto; padding: 46px; }
      .card { background: #fff; border: 1px solid #d6deea; }
      .header { background: #13233f; color: #f8fafc; padding: 18px 26px 16px; }
      .header h1 { margin: 0; font-size: 36px; font-weight: 700; line-height: 1.1; }
      .header .code { margin-top: 8px; font-size: 20px; }
      .content { padding: 20px 26px 24px; }
      .top-grid { display: grid; grid-template-columns: 1fr 170px; gap: 18px; align-items: start; }
      .title-line { font-size: 18px; font-weight: 700; margin: 0 0 8px; line-height: 1.3; }
      .section { padding: 10px 0 12px; border-top: 1px solid #d6deea; }
      .section:first-of-type { border-top: none; padding-top: 0; }
      .section-title { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
      .row { display: grid; grid-template-columns: 170px 1fr; gap: 14px; margin: 4px 0; align-items: start; }
      .row .label { color: #6b7280; font-size: 14px; line-height: 1.35; }
      .row .value { font-size: 16px; line-height: 1.35; }
      .he .section-title { text-align: right; direction: rtl; }
      .he .row { grid-template-columns: 1fr 170px; }
      .he .label { text-align: right; direction: rtl; unicode-bidi: isolate; }
      .he .value { text-align: right; direction: rtl; unicode-bidi: isolate; }
      .he-mixed { direction: rtl; unicode-bidi: isolate; display: inline; }
      .rtl-token { direction: rtl; unicode-bidi: isolate; display: inline; }
      .ltr-token { direction: ltr; unicode-bidi: isolate; display: inline; }
      .qr-wrap { text-align: center; }
      .qr-box { border: 1px solid #d6deea; background: #f8fafc; padding: 10px; display: inline-block; }
      .qr-box img { width: 150px; height: 150px; display: block; }
      .qr-note { margin-top: 8px; font-size: 12px; line-height: 1.35; color: #374151; }
      .qr-note p { margin: 0; }
      .qr-note .he-note { direction: rtl; unicode-bidi: isolate; }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="card">
        <header class="header">
          <h1>RYBA KIVA | E-TICKET</h1>
          <div class="code">Ticket code: ${escapeHtml(input.ticketCode)}</div>
        </header>
        <div class="content">
          <div class="top-grid">
            <div>
              <p class="title-line">
                ${escapeHtml(input.showRu)} | ${escapeHtml(input.showEn)} | ${formatHebrewMixed(input.showHe)}
              </p>

              <section class="section">
                <h2 class="section-title">Русский</h2>
                <div class="row"><div class="label">Спектакль</div><div class="value">${escapeHtml(input.showRu)}</div></div>
                <div class="row"><div class="label">Дата и время</div><div class="value">${escapeHtml(input.dateRu)}</div></div>
                <div class="row"><div class="label">Место</div><div class="value">${escapeHtml(input.venueRu)}</div></div>
              </section>

              <section class="section">
                <h2 class="section-title">English</h2>
                <div class="row"><div class="label">Show</div><div class="value">${escapeHtml(input.showEn)}</div></div>
                <div class="row"><div class="label">Date &amp; time</div><div class="value">${escapeHtml(input.dateEn)}</div></div>
                <div class="row"><div class="label">Venue</div><div class="value">${escapeHtml(input.venueEn)}</div></div>
              </section>

              <section class="section he">
                <h2 class="section-title">עברית</h2>
                <div class="row">
                  <div class="value">${formatHebrewMixed(input.showHe)}</div>
                  <div class="label">מופע</div>
                </div>
                <div class="row">
                  <div class="value">${formatHebrewMixed(input.dateHe)}</div>
                  <div class="label">תאריך ושעה</div>
                </div>
                <div class="row">
                  <div class="value">${formatHebrewMixed(input.venueHe)}</div>
                  <div class="label">מקום</div>
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">Purchase details / Данные покупки / <span dir="rtl">פרטי רכישה</span></h2>
                <div class="row"><div class="label">Buyer / Покупатель / <span dir="rtl">רוכש</span></div><div class="value">${escapeHtml(input.buyerName)}</div></div>
                <div class="row"><div class="label">Email / <span dir="rtl">אימייל</span></div><div class="value">${escapeHtml(input.buyerEmail)}</div></div>
                <div class="row"><div class="label">Qty / Кол-во / <span dir="rtl">כמות</span></div><div class="value">${escapeHtml(input.qty)}</div></div>
                <div class="row"><div class="label">Amount / Сумма / <span dir="rtl">סכום</span></div><div class="value">${escapeHtml(input.amount)}</div></div>
              </section>
            </div>

            <aside class="qr-wrap">
              <div class="qr-box">
                <img src="${escapeHtml(input.qrImageUrl)}" alt="QR" />
              </div>
              <div class="qr-note">
                <p>Покажите QR на входе</p>
                <p>Show QR at the entrance</p>
                <p class="he-note"><span class="he-mixed"><span class="rtl-token">הראו את קוד ה-</span><span class="ltr-token">QR</span><span class="rtl-token"> בכניסה.</span></span></p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
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
  const baseUrl = process.env.APP_BASE_URL ?? 'https://kozocka-zlata-landing-coral.vercel.app';
  const ticketCode = crypto.createHash('sha256').update(order.order_id).digest('hex').slice(0, 12).toUpperCase();
  const verifyUrl = `${baseUrl}/payment/success?order_id=${encodeURIComponent(order.order_id)}&ticket=${ticketCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(verifyUrl)}`;

  const details = await resolveOrderDetails(order);
  const html = buildTicketHtml({
    ticketCode,
    orderId: order.order_id,
    qrImageUrl,
    showRu: details.showTitle.ru,
    showEn: details.showTitle.en,
    showHe: details.showTitle.he,
    dateRu: details.eventDateTime.ru,
    dateEn: details.eventDateTime.en,
    dateHe: details.eventDateTime.he,
    venueRu: details.eventPlace.ru,
    venueEn: details.eventPlace.en,
    venueHe: details.eventPlace.he,
    buyerName: order.buyer_name || '-',
    buyerEmail: order.buyer_email,
    qty: String(order.qty),
    amount: amountLabel(order),
  });

  const pdfBytes = await renderHtmlToPdf(html);

  return {
    ticketCode,
    verifyUrl,
    qrImageUrl,
    pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    pdfFilename: `ticket-${order.order_id}.pdf`,
  };
}
