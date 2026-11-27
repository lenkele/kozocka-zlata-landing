import type { Metadata } from 'next';

import { LANGUAGES, LOCALES, SITE_URL } from '@/lib/i18n';
import type { Lang } from '@/shows/types';

// Отдельные страницы для организаторов (не спектакли). Есть на всех трёх языках.
export const INFO_PAGE_SLUGS = ['invite', 'workshops'] as const;
export type InfoPageSlug = (typeof INFO_PAGE_SLUGS)[number];

export function isInfoPageSlug(value: unknown): value is InfoPageSlug {
  return typeof value === 'string' && (INFO_PAGE_SLUGS as readonly string[]).includes(value);
}

export function infoPagePath(lang: Lang, slug: InfoPageSlug): string {
  return `/${lang}/${slug}`;
}

export function infoPageAlternates(slug: InfoPageSlug): Record<string, string> {
  return {
    ...Object.fromEntries(LANGUAGES.map((lang) => [lang, `${SITE_URL}${infoPagePath(lang, slug)}`])),
    'x-default': `${SITE_URL}/${slug}`,
  };
}

const SITE_NAMES: Record<Lang, string> = { ru: 'Театр «Рыба Кива»', he: 'תיאטרון ״ריבא קיווא״', en: 'Ryba Kiva Theatre' };

export function infoPageMetadata(lang: Lang, slug: InfoPageSlug, title: string, description: string, image?: string): Metadata {
  const path = infoPagePath(lang, slug);
  return {
    title,
    description,
    alternates: { canonical: path, languages: infoPageAlternates(slug) },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAMES[lang],
      locale: LOCALES[lang].replace('-', '_'),
      alternateLocale: LANGUAGES.filter((other) => other !== lang).map((other) => LOCALES[other].replace('-', '_')),
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}
