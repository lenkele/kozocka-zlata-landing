import { notFound } from 'next/navigation';

import ShowLandingClient from '@/components/ShowLandingClient';
import { DEFAULT_SHOW_SLUG, SHOWS, SHOW_SLUGS, isShowSlug } from '@/shows';

type PageProps = {
  params: Promise<{
    show?: string;
  }>;
};

export function generateStaticParams() {
  return SHOW_SLUGS.map((slug) => ({ show: slug }));
}

export default async function ShowPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = (resolvedParams.show ?? DEFAULT_SHOW_SLUG).toLowerCase();
  if (!isShowSlug(slug)) {
    notFound();
  }

  return <ShowLandingClient show={SHOWS[slug]} />;
}

