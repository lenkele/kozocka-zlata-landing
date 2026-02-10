import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { loadScheduleForShow } from '@/lib/schedule';
import { isShowSlug } from '@/shows';

type SyncBody = {
  show?: string;
  secret?: string;
};

export async function POST(request: Request) {
  const syncSecret = process.env.SCHEDULE_SYNC_SECRET?.trim();
  if (!syncSecret) {
    return NextResponse.json({ ok: false, reason: 'sync_secret_not_configured' }, { status: 500 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const showSlug = body.show?.trim() ?? '';
  const providedSecret = body.secret?.trim() ?? '';

  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }

  if (providedSecret !== syncSecret) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  try {
    const schedule = await loadScheduleForShow(showSlug, { forceRemote: true });
    revalidateTag(`schedule-${showSlug}`, 'max');

    return NextResponse.json({
      ok: true,
      show: showSlug,
      events: schedule.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[schedule-sync] failed to refresh schedule', { showSlug, error });
    return NextResponse.json({ ok: false, reason: 'sync_failed' }, { status: 500 });
  }
}
