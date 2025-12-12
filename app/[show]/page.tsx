import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = (resolvedParams.show ?? DEFAULT_SHOW_SLUG).toLowerCase();
  
  if (!isShowSlug(slug)) {
    return { title: 'Спектакль не найден' };
  }

  const show = SHOWS[slug];
  return {
    title: show.pageTitle,
    description: show.pageDescription,
  };
}

export default async function ShowPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = (resolvedParams.show ?? DEFAULT_SHOW_SLUG).toLowerCase();
  if (!isShowSlug(slug)) {
    notFound();
  }

  return <ShowLandingClient show={SHOWS[slug]} />;
}

