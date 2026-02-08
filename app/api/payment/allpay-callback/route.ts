import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const rawBody = await request.text();

  console.log('[allpay-callback] incoming webhook', {
    contentType,
    bodyLength: rawBody.length,
    bodyPreview: rawBody.slice(0, 500),
  });

  return NextResponse.json({ ok: true });
}
