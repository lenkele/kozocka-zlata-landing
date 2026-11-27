import type { MetadataRoute } from 'next';

import { SHOW_SLUGS } from '@/shows';
import { LANGUAGES, SITE_URL, getShowLanguages, languageAlternates, localizedPath } from '@/lib/i18n';
import { INFO_PAGE_SLUGS, infoPageAlternates, infoPagePath } from '@/lib/infoPages';

export default function sitemap(): MetadataRoute.Sitemap {
  const showPages = SHOW_SLUGS.flatMap((slug) => getShowLanguages(slug).map((lang) => ({
    url: `${SITE_URL}${localizedPath(lang, slug)}`,
    alternates: { languages: languageAlternates(slug) },
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })));

  const infoPages = INFO_PAGE_SLUGS.flatMap((slug) => LANGUAGES.map((lang) => ({
    url: `${SITE_URL}${infoPagePath(lang, slug)}`,
    alternates: { languages: infoPageAlternates(slug) },
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })));

  return [
    ...LANGUAGES.map((lang) => ({
      url: `${SITE_URL}${localizedPath(lang)}`,
      alternates: { languages: languageAlternates() },
      changeFrequency: 'weekly' as const,
      priority: 1,
    })),
    ...showPages,
    ...infoPages,
  ];
}
