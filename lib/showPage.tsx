import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import ShowLandingClient from '@/components/ShowLandingClient';
import { getCachedScheduleForShow, type ScheduleEvent } from '@/lib/schedule';
import { buildShowEventsJsonLd } from '@/lib/showEventsJsonLd';
import { SHOWS } from '@/shows';
import { getShowLanguages, localizedMetadata } from '@/lib/i18n';
import { type CarouselPhoto, type GalleryPhoto, type ShowConfig, type ShowSlug, type Lang } from '@/shows/types';

// Без этого Next зафиксирует список фото на момент `next build` (SSG).
// Для спектаклей с `autoDiscoverPhotos` после добавления/удаления файлов
// в `public/shows/<slug>/photos/` на сайте оставались бы «дырки», пока не пересоберёшь проект.
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

async function discoverPhotosForShow(slug: ShowSlug): Promise<string[]> {
  const photosDir = path.join(process.cwd(), 'public', 'shows', slug, 'photos');
  try {
    const entries = await readdir(photosDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'en'));
  } catch {
    return [];
  }
}

async function resolveShowWithPhotos(slug: ShowSlug): Promise<ShowConfig> {
  const baseShow = SHOWS[slug];
  if (!baseShow.autoDiscoverPhotos) {
    return baseShow;
  }

  const fileNames = await discoverPhotosForShow(slug);
  if (fileNames.length === 0) {
    return baseShow;
  }

  const title = baseShow.content.ru?.title ?? baseShow.content.en?.title ?? slug;
  const carouselPhotos: CarouselPhoto[] = fileNames.map((file, index) => ({
    src: `/shows/${slug}/photos/${file}`,
    alt: `Кадр спектакля «${title}» ${index + 1}`,
  }));
  const galleryPhotos: GalleryPhoto[] = fileNames.map((file, index) => ({
    src: `/shows/${slug}/photos/${file}`,
    alt: `Кадр спектакля «${title}» ${index + 1}`,
  }));

  return {
    ...baseShow,
    carouselPhotos,
    galleryPhotos,
  };
}

// Тот же вид, что отдаёт /api/schedule (даты строками), чтобы браузер разбирал данные одинаково.
function toClientSchedule(events: ScheduleEvent[]): ScheduleEvent[] {
  return events.map((event) => ({
    ...event,
    date_iso: event.date_iso instanceof Date ? event.date_iso.toISOString() : event.date_iso,
  }));
}

export function showMetadata(slug: ShowSlug, lang: Lang): Metadata {
  const show = SHOWS[slug];
  const content = show.content[lang]!;
  const seo = show.seo?.[lang];
  const title = seo?.title ?? (lang === 'ru' ? show.pageTitle : `${content.title} — ${content.theatreLabel}`);
  const description =
    seo?.description ??
    (lang === 'ru' ? show.pageDescription ?? content.seoSubtitle : content.seoSubtitle.replace(/\s+/g, ' ').trim());
  return localizedMetadata(lang, title, description, slug);
}

export async function LocalizedShow({ slug, lang }: { slug: ShowSlug; lang: Lang }) {
  if (!getShowLanguages(slug).includes(lang)) notFound();
  const show = await resolveShowWithPhotos(slug);
  // Расписание рендерим на сервере: поисковик сразу видит даты и места в HTML.
  // Если загрузка не удалась, страница работает как раньше — расписание подтянется в браузере.
  const schedule = await getCachedScheduleForShow(slug).catch((error) => {
    console.error('[show-page] failed to preload schedule', { slug, error });
    return undefined;
  });
  const eventsJsonLd = await buildShowEventsJsonLd(show, lang, schedule).catch(() => null);
  return (
    <>
      {eventsJsonLd && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd).replace(/</g, '\\u003c') }} />
      )}
      <ShowLandingClient show={show} lang={lang} initialSchedule={schedule ? toClientSchedule(schedule) : undefined} />
    </>
  );
}
