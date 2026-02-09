import type { StoredOrder } from './ordersStore';

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
  const subject = 'Оплата получена: билет оформлен';
  const showLabel = order.show_slug;
  const eventLabel = order.event_id || '-';
  const qtyLabel = String(order.qty ?? 1);
  const amountLabel = order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;

  const html = [
    `<p>Здравствуйте, ${buyerName}!</p>`,
    `<p>Оплата успешно получена.</p>`,
    `<p><strong>Заказ:</strong> ${order.order_id}<br/>`,
    `<strong>Спектакль:</strong> ${showLabel}<br/>`,
    `<strong>Сеанс:</strong> ${eventLabel}<br/>`,
    `<strong>Количество:</strong> ${qtyLabel}<br/>`,
    `<strong>Сумма:</strong> ${amountLabel}</p>`,
    `<p>Это тестовый билет (MVP). На следующем шаге подключим вложение PDF/QR.</p>`,
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
