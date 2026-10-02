import nodemailer from 'nodemailer';

import type { StoredOrder } from './ordersStore';
import { resolveOrderDetails } from './showEventDetails';
import { buildTicketArtifacts } from './ticket';

type SendTicketEmailResult = {
  id?: string;
};

const THEATRE_EMAIL = 'tickets.rybakiva@gmail.com';

type EmailProvider = 'gmail' | 'resend';

function resolveReceiptUrl(order: StoredOrder): string | null {
  const receipt = order.allpay_raw?.receipt;
  if (typeof receipt !== 'string') return null;

  try {
    const url = new URL(receipt);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveEmailProvider(): EmailProvider {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!configured) return process.env.GMAIL_APP_PASSWORD ? 'gmail' : 'resend';
  if (configured === 'gmail' || configured === 'resend') return configured;
  throw new Error(`Unsupported EMAIL_PROVIDER: ${configured}`);
}

export async function sendTicketEmail(order: StoredOrder): Promise<SendTicketEmailResult> {
  const provider = resolveEmailProvider();
  const gmailUser = (process.env.GMAIL_USER ?? THEATRE_EMAIL).trim();
  const fromEmail = (process.env.EMAIL_FROM ?? (provider === 'gmail' ? gmailUser : 'onboarding@resend.dev')).trim();
  const fromName = (process.env.EMAIL_FROM_NAME ?? 'Театр «Рыба Кива»').trim();
  const replyTo = (process.env.EMAIL_REPLY_TO ?? (provider === 'gmail' ? gmailUser : '')).trim();

  if (provider === 'resend' && !process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
  }
  if (provider === 'gmail' && !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_APP_PASSWORD is required when EMAIL_PROVIDER=gmail');
  }
  if (provider === 'resend' && process.env.NODE_ENV === 'production' && fromEmail.toLowerCase() === 'onboarding@resend.dev') {
    throw new Error('EMAIL_FROM must be set to your verified domain mailbox in production');
  }

  const from = fromEmail.includes('<') ? fromEmail : `${fromName} <${fromEmail}>`;

  const buyerName = order.buyer_name || 'Viewer';
  const ticket = await buildTicketArtifacts(order);
  const details = await resolveOrderDetails(order);
  const subject = 'Ваши билеты | Your tickets | הכרטיסים שלכם';
  const qtyLabel = String(order.qty ?? 1);
  const amountLabel = order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;
  const directions = details.eventDirectionsUrl;
  const receiptUrl = resolveReceiptUrl(order);
  const receiptHref = receiptUrl ? escapeHtml(receiptUrl) : null;

  const html = [
    `<p><strong>English</strong></p>`,
    `<p>Hello, ${buyerName}!</p>`,
    `<p>Your tickets are ready.</p>`,
    `<p><strong>Ticket code:</strong> ${ticket.ticketCode}</p>`,
    `<p><a href="${ticket.verifyUrl}">Verify ticket</a></p>`,
    receiptHref ? `<p><a href="${receiptHref}">View payment receipt</a></p>` : '',
    `<p><strong>Order:</strong> ${order.order_id}<br/>`,
    `<strong>Show:</strong> ${details.showTitle.en}<br/>`,
    `<strong>Date & time:</strong> ${details.eventDateTime.en}<br/>`,
    `<strong>Venue:</strong> ${details.eventPlace.en}<br/>`,
    directions ? `<strong>How to get there:</strong> <a href="${directions}" target="_blank" rel="noopener noreferrer">Waze</a><br/>` : '',
    `<strong>Qty:</strong> ${qtyLabel}<br/>`,
    `<strong>Amount:</strong> ${amountLabel}</p>`,
    `<hr/>`,
    `<p><strong>Русский</strong></p>`,
    `<p>Здравствуйте, ${buyerName}!</p>`,
    `<p>Ваши билеты готовы.</p>`,
    `<p><strong>Код билета:</strong> ${ticket.ticketCode}</p>`,
    `<p><a href="${ticket.verifyUrl}">Проверить билет</a></p>`,
    receiptHref ? `<p><a href="${receiptHref}">Открыть чек об оплате</a></p>` : '',
    `<p><strong>Заказ:</strong> ${order.order_id}<br/>`,
    `<strong>Спектакль:</strong> ${details.showTitle.ru}<br/>`,
    `<strong>Дата и время:</strong> ${details.eventDateTime.ru}<br/>`,
    `<strong>Место:</strong> ${details.eventPlace.ru}<br/>`,
    directions ? `<strong>Как добраться:</strong> <a href="${directions}" target="_blank" rel="noopener noreferrer">Waze</a><br/>` : '',
    `<strong>Количество:</strong> ${qtyLabel}<br/>`,
    `<strong>Сумма:</strong> ${amountLabel}</p>`,
    `<hr/>`,
    `<p dir="rtl"><strong>עברית</strong></p>`,
    `<p dir="rtl">שלום, ${buyerName}!</p>`,
    `<p dir="rtl">הכרטיסים שלכם מוכנים.</p>`,
    `<p dir="rtl"><strong>קוד כרטיס:</strong> ${ticket.ticketCode}</p>`,
    `<p dir="rtl"><a href="${ticket.verifyUrl}">אימות כרטיס</a></p>`,
    receiptHref ? `<p dir="rtl"><a href="${receiptHref}">צפייה בקבלה</a></p>` : '',
    `<p dir="rtl"><strong>הזמנה:</strong> ${order.order_id}<br/>`,
    `<strong>מופע:</strong> ${details.showTitle.he}<br/>`,
    `<strong>תאריך ושעה:</strong> ${details.eventDateTime.he}<br/>`,
    `<strong>מקום:</strong> ${details.eventPlace.he}<br/>`,
    directions ? `<strong>איך מגיעים:</strong> <a href="${directions}" target="_blank" rel="noopener noreferrer">Waze</a><br/>` : '',
    `<strong>כמות:</strong> ${qtyLabel}<br/>`,
    `<strong>סכום:</strong> ${amountLabel}</p>`,
    `<p>PDF ticket is attached / PDF-билет во вложении / כרטיס PDF מצורף.</p>`,
  ].join('');

  const textBody = [
    'English',
    '',
    `Hello, ${buyerName}!`,
    'Your tickets are ready.',
    `Ticket code: ${ticket.ticketCode}`,
    `Verify ticket: ${ticket.verifyUrl}`,
    ...(receiptUrl ? [`Payment receipt: ${receiptUrl}`] : []),
    `Order: ${order.order_id}`,
    `Show: ${details.showTitle.en}`,
    `Date & time: ${details.eventDateTime.en}`,
    `Venue: ${details.eventPlace.en}`,
    ...(directions ? [`How to get there: ${directions}`] : []),
    `Qty: ${qtyLabel}`,
    `Amount: ${amountLabel}`,
    '',
    'Русский',
    '',
    `Здравствуйте, ${buyerName}!`,
    'Ваши билеты готовы.',
    `Код билета: ${ticket.ticketCode}`,
    `Проверить билет: ${ticket.verifyUrl}`,
    ...(receiptUrl ? [`Чек об оплате: ${receiptUrl}`] : []),
    `Заказ: ${order.order_id}`,
    `Спектакль: ${details.showTitle.ru}`,
    `Дата и время: ${details.eventDateTime.ru}`,
    `Место: ${details.eventPlace.ru}`,
    ...(directions ? [`Как добраться: ${directions}`] : []),
    `Количество: ${qtyLabel}`,
    `Сумма: ${amountLabel}`,
    '',
    'עברית',
    '',
    `שלום, ${buyerName}!`,
    'הכרטיסים שלכם מוכנים.',
    `קוד כרטיס: ${ticket.ticketCode}`,
    `אימות כרטיס: ${ticket.verifyUrl}`,
    ...(receiptUrl ? [`קבלה: ${receiptUrl}`] : []),
    `הזמנה: ${order.order_id}`,
    `מופע: ${details.showTitle.he}`,
    `תאריך ושעה: ${details.eventDateTime.he}`,
    `מקום: ${details.eventPlace.he}`,
    ...(directions ? [`איך מגיעים: ${directions}`] : []),
    `כמות: ${qtyLabel}`,
    `סכום: ${amountLabel}`,
    '',
    'PDF ticket is attached / PDF-билет во вложении / כרטיס PDF מצורף.',
  ].join('\n');

  const attachments: Array<{ filename: string; content: string; type: string }> = [
    {
      filename: ticket.pdfFilename,
      content: ticket.pdfBase64,
      type: 'application/pdf',
    },
  ];

  const sendWithResend = async (): Promise<SendTicketEmailResult> => {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required for email fallback');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [order.buyer_email],
        ...(replyTo ? { reply_to: [replyTo] } : {}),
        subject,
        html,
        text: textBody,
        attachments,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`[email] resend failed: ${response.status} ${text}`);
    }

    try {
      return JSON.parse(text) as SendTicketEmailResult;
    } catch {
      return {};
    }
  };

  if (provider === 'gmail') {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: process.env.GMAIL_APP_PASSWORD!.replaceAll(' ', ''),
        },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      });

      const result = await transporter.sendMail({
        from: `${fromName} <${gmailUser}>`,
        to: order.buyer_email,
        replyTo: replyTo || gmailUser,
        subject,
        html,
        text: textBody,
        attachments: [
          {
            filename: ticket.pdfFilename,
            content: Buffer.from(ticket.pdfBase64, 'base64'),
            contentType: 'application/pdf',
          },
        ],
      });

      return { id: result.messageId };
    } catch (error) {
      if (!process.env.RESEND_API_KEY) throw error;
      console.error('[email] gmail send failed, falling back to resend', {
        orderId: order.order_id,
        error,
      });
      return sendWithResend();
    }
  }

  return sendWithResend();
}
