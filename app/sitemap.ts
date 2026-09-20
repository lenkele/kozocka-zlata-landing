import type { MetadataRoute } from 'next';

import { SHOW_SLUGS } from '@/shows';

const SITE_URL = 'https://ryba-kiva.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const showPages = SHOW_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...showPages,
  ];
}
