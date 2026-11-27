import type { Metadata } from 'next';
import { SHOWS } from '@/shows';
import type { Lang, ShowSlug } from '@/shows/types';

export const SITE_URL = 'https://ryba-kiva.com';
export const LANGUAGES: Lang[] = ['ru', 'he', 'en'];
export const LANGUAGE_COOKIE = 'preferredLang';
export const LANGUAGE_HEADER = 'x-site-language';
export const LOCALES: Record<Lang, string> = { ru: 'ru-RU', he: 'he-IL', en: 'en-US' };

export function isLang(value: unknown): value is Lang {
  return value === 'ru' || value === 'he' || value === 'en';
}

export function getShowLanguages(slug: ShowSlug): Lang[] {
  const show = SHOWS[slug];
  return (show.availableLanguages ?? LANGUAGES).filter((lang) => Boolean(show.content[lang]));
}

export function availableLanguage(lang: Lang, available: Lang[]): Lang {
  return available.includes(lang) ? lang : available.includes('en') ? 'en' : available[0] ?? 'ru';
}

export function localizedPath(lang: Lang, slug?: ShowSlug): string {
  return slug ? `/${availableLanguage(lang, getShowLanguages(slug))}/${slug}` : `/${lang}`;
}

/** Explicit choice > saved choice > weighted browser languages. No browser preference defaults to Russian. */
export function selectLanguage(
  acceptLanguage: string | null,
  available: Lang[],
  preferred?: string | null,
  explicit?: string | null,
): Lang {
  if (isLang(explicit)) return availableLanguage(explicit, available);
  if (isLang(preferred)) return availableLanguage(preferred, available);
  const tags = (acceptLanguage ?? '').split(',').map((part, index) => {
    const [tag, ...parameters] = part.trim().toLowerCase().split(';');
    const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
    return { tag, quality: quality ? Number(quality.trim().slice(2)) : 1, index };
  }).filter(({ tag, quality }) => tag && Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const { tag } of tags) {
    const base = tag.split('-')[0];
    const lang = base === 'iw' ? 'he' : base;
    if (isLang(lang) && available.includes(lang)) return lang;
  }
  return acceptLanguage?.trim() ? availableLanguage('en', available) : availableLanguage('ru', available);
}

export function languageAlternates(slug?: ShowSlug): Record<string, string> {
  const available = slug ? getShowLanguages(slug) : LANGUAGES;
  return {
    ...Object.fromEntries(available.map((lang) => [lang, `${SITE_URL}${localizedPath(lang, slug)}`])),
    'x-default': `${SITE_URL}${slug ? `/${slug}` : '/'}`,
  };
}

export function localizedMetadata(lang: Lang, title: string, description: string, slug?: ShowSlug): Metadata {
  const path = localizedPath(lang, slug);
  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(slug) },
    openGraph: {
      title, description, url: path,
      siteName: lang === 'he' ? 'תיאטרון ״ריבא קיווא״' : lang === 'en' ? 'Ryba Kiva Theatre' : 'Театр «Рыба Кива»',
      locale: LOCALES[lang].replace('-', '_'),
      alternateLocale: (slug ? getShowLanguages(slug) : LANGUAGES).filter((other) => other !== lang).map((other) => LOCALES[other].replace('-', '_')),
      type: 'website',
    },
  };
}
