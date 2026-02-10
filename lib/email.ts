import type { StoredOrder } from './ordersStore';
import { resolveOrderDetails } from './showEventDetails';
import { buildTicketArtifacts } from './ticket';

type SendTicketEmailResult = {
  id?: string;
};

export async function sendTicketEmail(order: StoredOrder): Promise<SendTicketEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required');
  }

  const buyerName = order.buyer_name || 'Viewer';
  const ticket = await buildTicketArtifacts(order);
  const details = await resolveOrderDetails(order);
  const subject = 'Payment confirmed / Оплата подтверждена / התשלום אושר';
  const qtyLabel = String(order.qty ?? 1);
  const amountLabel = order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;

  const html = [
    `<p><strong>English</strong></p>`,
    `<p>Hello, ${buyerName}!</p>`,
    `<p>Your payment was received successfully.</p>`,
    `<p><strong>Ticket code:</strong> ${ticket.ticketCode}</p>`,
    `<p><a href="${ticket.verifyUrl}">Verify ticket</a></p>`,
    `<p><strong>Order:</strong> ${order.order_id}<br/>`,
    `<strong>Show:</strong> ${details.showTitle.en}<br/>`,
    `<strong>Date & time:</strong> ${details.eventDateTime.en}<br/>`,
    `<strong>Venue:</strong> ${details.eventPlace.en}<br/>`,
    `<strong>Qty:</strong> ${qtyLabel}<br/>`,
    `<strong>Amount:</strong> ${amountLabel}</p>`,
    `<hr/>`,
    `<p><strong>Русский</strong></p>`,
    `<p>Здравствуйте, ${buyerName}!</p>`,
    `<p>Оплата успешно получена.</p>`,
    `<p><strong>Код билета:</strong> ${ticket.ticketCode}</p>`,
    `<p><a href="${ticket.verifyUrl}">Проверить билет</a></p>`,
    `<p><strong>Заказ:</strong> ${order.order_id}<br/>`,
    `<strong>Спектакль:</strong> ${details.showTitle.ru}<br/>`,
    `<strong>Дата и время:</strong> ${details.eventDateTime.ru}<br/>`,
    `<strong>Место:</strong> ${details.eventPlace.ru}<br/>`,
    `<strong>Количество:</strong> ${qtyLabel}<br/>`,
    `<strong>Сумма:</strong> ${amountLabel}</p>`,
    `<hr/>`,
    `<p dir="rtl"><strong>עברית</strong></p>`,
    `<p dir="rtl">שלום, ${buyerName}!</p>`,
    `<p dir="rtl">התשלום התקבל בהצלחה.</p>`,
    `<p dir="rtl"><strong>קוד כרטיס:</strong> ${ticket.ticketCode}</p>`,
    `<p dir="rtl"><a href="${ticket.verifyUrl}">אימות כרטיס</a></p>`,
    `<p dir="rtl"><strong>הזמנה:</strong> ${order.order_id}<br/>`,
    `<strong>מופע:</strong> ${details.showTitle.he}<br/>`,
    `<strong>תאריך ושעה:</strong> ${details.eventDateTime.he}<br/>`,
    `<strong>מקום:</strong> ${details.eventPlace.he}<br/>`,
    `<strong>כמות:</strong> ${qtyLabel}<br/>`,
    `<strong>סכום:</strong> ${amountLabel}</p>`,
    `<p>PDF ticket is attached / PDF-билет во вложении / כרטיס PDF מצורף.</p>`,
  ].join('');

  const attachments: Array<{ filename: string; content: string; type: string }> = [
    {
      filename: ticket.pdfFilename,
      content: ticket.pdfBase64,
      type: 'application/pdf',
    },
  ];

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [order.buyer_email],
      subject,
      html,
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
}
