import { NextResponse } from 'next/server';

import { getCachedScheduleForShow } from '@/lib/schedule';
import { isShowSlug } from '@/shows';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const showSlug = url.searchParams.get('show')?.trim() ?? '';

  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }

  try {
    const schedule = await getCachedScheduleForShow(showSlug);
    return NextResponse.json({ ok: true, show: showSlug, schedule }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api-schedule] failed to load schedule', { showSlug, error });
    return NextResponse.json({ ok: false, reason: 'schedule_load_failed' }, { status: 500 });
  }
}
