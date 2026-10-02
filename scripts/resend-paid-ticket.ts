import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sendTicketEmail } from '../lib/email';
import { getOrderByOrderId, markTicketEmailSent } from '../lib/ordersStore';

async function main() {
  process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));

  const orderId = process.argv[2]?.trim();
  if (!orderId) {
    throw new Error('Usage: tsx scripts/resend-paid-ticket.ts <order_id>');
  }

  const order = await getOrderByOrderId(orderId);
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (order.status !== 'paid') {
    throw new Error(`Order is not paid: ${orderId}`);
  }

  const result = await sendTicketEmail(order);
  await markTicketEmailSent(order, result.id);
  console.log(JSON.stringify({ ok: true, orderId, emailId: result.id ?? null }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
