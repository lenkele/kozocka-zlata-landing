import type { MetadataRoute } from 'next';

import { SHOW_SLUGS } from '@/shows';
import { LANGUAGES, SITE_URL, getShowLanguages, languageAlternates, localizedPath } from '@/lib/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const showPages = SHOW_SLUGS.flatMap((slug) => getShowLanguages(slug).map((lang) => ({
    url: `${SITE_URL}${localizedPath(lang, slug)}`,
    alternates: { languages: languageAlternates(slug) },
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })));

  return [
    ...LANGUAGES.map((lang) => ({
      url: `${SITE_URL}${localizedPath(lang)}`,
      alternates: { languages: languageAlternates() },
      changeFrequency: 'weekly' as const,
      priority: 1,
    })),
    ...showPages,
  ];
}
