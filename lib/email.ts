import type { StoredOrder } from './ordersStore';
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

  const buyerName = order.buyer_name || 'Зритель';
  const ticket = buildTicketArtifacts(order);
  const subject = 'Оплата получена: билет оформлен';
  const showLabel = order.show_slug;
  const eventLabel = order.event_id || '-';
  const qtyLabel = String(order.qty ?? 1);
  const amountLabel = order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;

  const html = [
    `<p>Здравствуйте, ${buyerName}!</p>`,
    `<p>Оплата успешно получена.</p>`,
    `<p><strong>Код билета:</strong> ${ticket.ticketCode}</p>`,
    `<p><img src="${ticket.qrImageUrl}" alt="QR ticket" width="180" height="180" /></p>`,
    `<p><a href="${ticket.verifyUrl}">Проверить билет</a></p>`,
    `<p><strong>Заказ:</strong> ${order.order_id}<br/>`,
    `<strong>Спектакль:</strong> ${showLabel}<br/>`,
    `<strong>Сеанс:</strong> ${eventLabel}<br/>`,
    `<strong>Количество:</strong> ${qtyLabel}<br/>`,
    `<strong>Сумма:</strong> ${amountLabel}</p>`,
    `<p>Во вложении — PDF-билет.</p>`,
  ].join('');

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
      attachments: [
        {
          filename: ticket.pdfFilename,
          content: ticket.pdfBase64,
          type: 'application/pdf',
        },
      ],
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
