import crypto from 'node:crypto';

import type { StoredOrder } from './ordersStore';

export type TicketArtifacts = {
  ticketCode: string;
  verifyUrl: string;
  qrImageUrl: string;
  pdfBase64: string;
  pdfFilename: string;
};

function escapePdfText(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(lines: string[]): Uint8Array {
  const contentLines = lines.map((line, idx) => {
    const y = 790 - idx * 22;
    return `BT /F1 12 Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`;
  });

  const stream = contentLines.join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push(
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj'
  );
  objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Uint8Array.from(Buffer.from(pdf, 'utf8'));
}

export function buildTicketArtifacts(order: StoredOrder): TicketArtifacts {
  const baseUrl = process.env.APP_BASE_URL ?? 'https://kozocka-zlata-landing-coral.vercel.app';
  const ticketCode = crypto.createHash('sha256').update(order.order_id).digest('hex').slice(0, 12).toUpperCase();
  const verifyUrl = `${baseUrl}/payment/success?order_id=${encodeURIComponent(order.order_id)}&ticket=${ticketCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}`;
  const amountLabel = order.amount != null ? `${order.amount} ${order.currency ?? 'ILS'}` : `- ${order.currency ?? 'ILS'}`;
  const buyerName = order.buyer_name || 'Viewer';

  const pdfLines = [
    'RYBA KIVA - TICKET',
    '',
    `Ticket code: ${ticketCode}`,
    `Order: ${order.order_id}`,
    `Show: ${order.show_slug}`,
    `Event: ${order.event_id || '-'}`,
    `Name: ${buyerName}`,
    `Email: ${order.buyer_email}`,
    `Qty: ${String(order.qty)}`,
    `Amount: ${amountLabel}`,
    '',
    `Verify URL: ${verifyUrl}`,
    `QR URL: ${qrImageUrl}`,
  ];

  const pdfBytes = buildSimplePdf(pdfLines);

  return {
    ticketCode,
    verifyUrl,
    qrImageUrl,
    pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    pdfFilename: `ticket-${order.order_id}.pdf`,
  };
}
