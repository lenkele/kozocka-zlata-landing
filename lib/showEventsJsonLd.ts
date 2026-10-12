import { getPaidQtyMapForShow } from '@/lib/ordersStore';
import {
  getCachedScheduleForShow,
  getTodayIsoInIsrael,
  isClosedSchedule,
  normalizeScheduleDate,
  parseSchedulePrice,
  resolveCapacity,
} from '@/lib/schedule';
import type { ShowConfig } from '@/shows/types';

const SITE_URL = 'https://ryba-kiva.com';

// Смещение Израиля на конкретную дату (+02:00 зимой, +03:00 летом).
function getIsraelUtcOffset(dateIso: string): string {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${dateIso}T12:00:00Z`))
    .find((part) => part.type === 'timeZoneName')?.value;
  return name?.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? '+02:00';
}

// В поле места бывают markdown-ссылки на билеты — в разметке оставляем только адрес.
function cleanPlace(place: string): string {
  return place
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,]+$/, '')
    .trim();
}

// TheaterEvent для ближайших открытых показов: Google показывает их в поиске мероприятий.
export async function buildShowEventsJsonLd(show: ShowConfig) {
  const title = show.content.ru?.title ?? show.content.en?.title ?? show.slug;
  const poster = show.content.ru?.posterImage ?? show.content.en?.posterImage;
  const pageUrl = `${SITE_URL}/${show.slug}`;
  const today = getTodayIsoInIsrael();
  const [events, soldMap] = await Promise.all([
    getCachedScheduleForShow(show.slug),
    // Без данных о продажах просто не указываем наличие билетов.
    getPaidQtyMapForShow(show.slug).catch(() => null),
  ]);

  const theaterEvents = events.flatMap((event) => {
    const entry = event.entries?.ru ?? event.entries?.en ?? event.entries?.he;
    const dateIso = normalizeScheduleDate(event.date_iso);
    if (!entry || !dateIso || dateIso < today) return [];
    if (isClosedSchedule(entry.format_original ?? entry.format)) return [];

    const place = cleanPlace(entry.place);
    if (!place) return [];

    const time = entry.time?.trim().match(/^(\d{1,2}):(\d{2})/);
    const startDate = time
      ? `${dateIso}T${time[1].padStart(2, '0')}:${time[2]}:00${getIsraelUtcOffset(dateIso)}`
      : dateIso;

    const price = parseSchedulePrice(event.price_ils);
    const ticketUrl = typeof event.ticket_url === 'string' && event.ticket_url.trim() ? event.ticket_url.trim() : null;
    const offerUrl = event.ticket_mode === 'venue' ? ticketUrl : `${pageUrl}#schedule`;

    // Наличие знаем только для билетов, которые продаём сами (как в /api/schedule/availability).
    let availability: string | undefined;
    if (event.ticket_mode !== 'venue' && soldMap) {
      const capacity = resolveCapacity(event.capacity);
      const remaining = capacity === null ? null : Math.max(0, capacity - (soldMap[event.id?.trim() ?? ''] ?? 0));
      availability =
        remaining === null || remaining > 5
          ? 'https://schema.org/InStock'
          : remaining > 0
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/SoldOut';
    }

    return [
      {
        '@type': 'TheaterEvent',
        name: `«${title}» — театр «Рыба Кива»`,
        description: show.pageDescription,
        startDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: place, address: place },
        image: poster ? [`${SITE_URL}${poster}`] : undefined,
        url: pageUrl,
        organizer: { '@type': 'PerformingGroup', name: 'Рыба Кива', url: SITE_URL },
        performer: { '@type': 'PerformingGroup', name: 'Рыба Кива', url: SITE_URL },
        workPerformed: { '@type': 'CreativeWork', name: title },
        offers: offerUrl
          ? {
              '@type': 'Offer',
              url: offerUrl,
              ...(price !== null && event.ticket_mode !== 'venue' ? { price, priceCurrency: 'ILS' } : {}),
              ...(availability ? { availability } : {}),
            }
          : undefined,
      },
    ];
  });

  if (theaterEvents.length === 0) return null;
  return { '@context': 'https://schema.org', '@graph': theaterEvents };
}
