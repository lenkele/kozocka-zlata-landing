import { SHOWS, isShowSlug } from '@/shows';
import type { Lang } from '@/shows/types';
import type { StoredOrder } from './ordersStore';
import { loadScheduleForShow } from './schedule';

type ScheduleLangEntry = {
  time?: string;
  place?: string;
  date_text?: string;
};

type ScheduleEvent = {
  id?: string;
  date_iso?: string | Date;
  entries?: Partial<Record<Lang, ScheduleLangEntry>>;
};

export type ResolvedOrderDetails = {
  showTitle: Record<Lang, string>;
  eventDateTime: Record<Lang, string>;
  eventPlace: Record<Lang, string>;
};

const EMPTY_TEXT: Record<Lang, string> = { ru: '-', en: '-', he: '-' };
const LANGS: Lang[] = ['ru', 'en', 'he'];

function normalizeDateIso(value: unknown): string {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return '';
}

function formatDate(dateIso: string, lang: Lang): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;

  const monthNames: Record<Lang, string[]> = {
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    he: ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };

  return `${date.getDate()} ${monthNames[lang][date.getMonth()]}`;
}

function resolveShowTitle(showSlug: string): Record<Lang, string> {
  if (!isShowSlug(showSlug)) return { ...EMPTY_TEXT };
  const show = SHOWS[showSlug];
  return {
    ru: show.content.ru?.title ?? show.slug,
    en: show.content.en?.title ?? show.content.ru?.title ?? show.slug,
    he: show.content.he?.title ?? show.content.ru?.title ?? show.slug,
  };
}

export function resolveCheckoutItemName(showSlug: string, lang: Lang): string {
  const titles = resolveShowTitle(showSlug);
  const localized = titles[lang];
  const showTitle = localized && localized !== '-' ? localized : titles.ru !== '-' ? titles.ru : 'Ticket';

  const suffixByLang: Record<Lang, string> = {
    ru: 'Билет на спектакль',
    en: 'Performance ticket',
    he: 'כרטיס למופע',
  };

  return `${showTitle} – ${suffixByLang[lang]}`;
}

async function loadScheduleEvent(showSlug: string, eventId: string): Promise<ScheduleEvent | null> {
  if (!isShowSlug(showSlug) || !eventId) return null;

  try {
    const events = await loadScheduleForShow(showSlug);
    return events.find((event) => event.id === eventId) ?? null;
  } catch (error) {
    console.error('[showEventDetails] failed to load schedule', { showSlug, eventId, error });
    return null;
  }
}

function buildEventDetails(event: ScheduleEvent | null, fallbackEventId: string): Pick<ResolvedOrderDetails, 'eventDateTime' | 'eventPlace'> {
  if (!event) {
    return {
      eventDateTime: { ...EMPTY_TEXT, ru: fallbackEventId, en: fallbackEventId, he: fallbackEventId },
      eventPlace: { ...EMPTY_TEXT },
    };
  }

  const dateIso = normalizeDateIso(event.date_iso);
  const eventDateTime: Record<Lang, string> = { ...EMPTY_TEXT };
  const eventPlace: Record<Lang, string> = { ...EMPTY_TEXT };

  for (const lang of LANGS) {
    const entry = event.entries?.[lang];
    if (!entry) continue;
    const dateText = entry.date_text || (dateIso ? formatDate(dateIso, lang) : fallbackEventId);
    const timeText = entry.time?.trim() || '';
    eventDateTime[lang] = timeText ? `${dateText} ${timeText}` : dateText;
    eventPlace[lang] = entry.place?.trim() || '-';
  }

  return { eventDateTime, eventPlace };
}

export async function resolveOrderDetails(order: StoredOrder): Promise<ResolvedOrderDetails> {
  const showTitle = resolveShowTitle(order.show_slug);
  const event = await loadScheduleEvent(order.show_slug, order.event_id ?? '');
  const { eventDateTime, eventPlace } = buildEventDetails(event, order.event_id ?? '-');

  return {
    showTitle,
    eventDateTime,
    eventPlace,
  };
}
