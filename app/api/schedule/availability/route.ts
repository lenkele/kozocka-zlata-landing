import { NextResponse } from 'next/server';

import { getPaidQtyMapForShow } from '@/lib/ordersStore';
import { getCachedScheduleForShow, resolveCapacity } from '@/lib/schedule';
import { isShowSlug } from '@/shows';

type EventAvailability = {
  capacity: number | null;
  soldQty: number;
  remaining: number | null;
  soldOut: boolean;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const showSlug = url.searchParams.get('show')?.trim() ?? '';

  if (!isShowSlug(showSlug)) {
    return NextResponse.json({ ok: false, reason: 'invalid_show' }, { status: 400 });
  }

  try {
    const [scheduleEvents, soldMap] = await Promise.all([getCachedScheduleForShow(showSlug), getPaidQtyMapForShow(showSlug)]);

    const events: Record<string, EventAvailability> = {};

    for (const event of scheduleEvents) {
      const eventId = event.id?.trim();
      if (!eventId) continue;

      const capacity = resolveCapacity(event.capacity);
      const soldQty = soldMap[eventId] ?? 0;
      const remaining = capacity === null ? null : Math.max(0, capacity - soldQty);

      events[eventId] = {
        capacity,
        soldQty,
        remaining,
        soldOut: remaining !== null ? remaining <= 0 : false,
      };
    }

    return NextResponse.json(
      { ok: true, show: showSlug, events },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[schedule-availability] failed to calculate availability', { showSlug, error });
    return NextResponse.json({ ok: false, reason: 'availability_failed' }, { status: 500 });
  }
}
