import {
  getCachedScheduleForShow,
  getTodayIsoInIsrael,
  isClosedSchedule,
  normalizeScheduleDate,
  parseSchedulePrice,
  type ScheduleEvent,
} from '@/lib/schedule';
import type { Lang, ShowConfig } from '@/shows/types';
import { localizedPath } from '@/lib/i18n';

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

// Язык показа в админке пишется словом — в разметку отдаём код языка.
function performanceLanguageCode(language: string | undefined): string | undefined {
  const value = language?.trim().toLowerCase() ?? '';
  if (!value) return undefined;
  if (/рус|russian|רוסית/.test(value)) return 'ru';
  if (/иврит|hebrew|עברית/.test(value)) return 'he';
  if (/англ|english|אנגלית/.test(value)) return 'en';
  return undefined;
}

// TheaterEvent для ближайших открытых показов: Google показывает их в поиске мероприятий.
export async function buildShowEventsJsonLd(show: ShowConfig, lang: Lang = 'ru', preloadedEvents?: ScheduleEvent[]) {
  const content = show.content[lang] ?? show.content.ru ?? show.content.en;
  const title = content?.title ?? show.slug;
  const poster = content?.posterImage;
  const pageUrl = `${SITE_URL}${localizedPath(lang, show.slug)}`;
  const today = getTodayIsoInIsrael();
  const events = preloadedEvents ?? (await getCachedScheduleForShow(show.slug));

  const theaterEvents = events.flatMap((event) => {
    const entry = event.entries?.[lang] ?? event.entries?.ru ?? event.entries?.en ?? event.entries?.he;
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

    return [
      {
        '@type': 'TheaterEvent',
        name: `${title} — ${content?.theatreLabel ?? 'Ryba Kiva Theatre'}`,
        description: content?.seoSubtitle ?? show.pageDescription,
        startDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: place,
          address: {
            '@type': 'PostalAddress',
            streetAddress: place,
            ...(entry.city?.trim() ? { addressLocality: entry.city.trim() } : {}),
            addressCountry: 'IL',
          },
        },
        ...(performanceLanguageCode(entry.language) ? { inLanguage: performanceLanguageCode(entry.language) } : {}),
        image: poster ? [`${SITE_URL}${poster}`] : undefined,
        url: pageUrl,
        organizer: { '@type': 'PerformingGroup', name: 'Рыба Кива', url: SITE_URL },
        performer: { '@type': 'PerformingGroup', name: 'Рыба Кива', url: SITE_URL },
        workPerformed: { '@type': 'CreativeWork', name: title },
        ...(price === 0 ? { isAccessibleForFree: true } : {}),
        offers: offerUrl
          ? {
              '@type': 'Offer',
              url: offerUrl,
              ...(price !== null && event.ticket_mode !== 'venue' ? { price, priceCurrency: 'ILS' } : {}),
            }
          : undefined,
      },
    ];
  });

  if (theaterEvents.length === 0) return null;
  return { '@context': 'https://schema.org', '@graph': theaterEvents };
}
