import { sendTicketEmail } from '@/lib/email';
import { appendOrderRow, isSheetsIntegrationEnabled } from '@/lib/googleSheet';
import type { StoredOrder } from '@/lib/ordersStore';
import { getEventSheetId, markTicketEmailSent } from '@/lib/ordersStore';

// Общий шаг после подтверждения заказа (оплата AllPay или бесплатная регистрация):
// строка в Google-таблицу показа и письмо с билетом.
export async function fulfillConfirmedOrder(
  order: StoredOrder,
  options: { appendToSheet: boolean; logPrefix: string },
): Promise<{ emailId?: string }> {
  const { appendToSheet, logPrefix } = options;

  // Best-effort: таблица не должна блокировать выдачу билета.
  if (appendToSheet && isSheetsIntegrationEnabled()) {
    try {
      const sheetId = await getEventSheetId(order.show_slug, order.event_id);
      if (sheetId) {
        await appendOrderRow(sheetId, order);
        console.log(`${logPrefix} order appended to sheet`, { orderId: order.order_id, sheetId });
      } else {
        console.warn(`${logPrefix} no sheet for event, skip append`, {
          orderId: order.order_id,
          showSlug: order.show_slug,
          eventId: order.event_id,
        });
      }
    } catch (error) {
      console.error(`${logPrefix} failed to append order to sheet`, { orderId: order.order_id, error });
    }
  }

  const emailResult = await sendTicketEmail(order);
  await markTicketEmailSent(order, emailResult.id);
  return { emailId: emailResult.id };
}
