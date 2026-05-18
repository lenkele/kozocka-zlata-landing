import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import ShowLandingClient from '@/components/ShowLandingClient';
import { DEFAULT_SHOW_SLUG, SHOWS, SHOW_SLUGS, isShowSlug } from '@/shows';
import { type CarouselPhoto, type GalleryPhoto, type ShowConfig, type ShowSlug } from '@/shows/types';

type PageProps = {
  params: Promise<{
    show?: string;
  }>;
};

// Без этого Next зафиксирует список фото на момент `next build` (SSG).
// Для спектаклей с `autoDiscoverPhotos` после добавления/удаления файлов
// в `public/shows/<slug>/photos/` на сайте оставались бы «дырки», пока не пересоберёшь проект.
export const dynamic = 'force-dynamic';

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

  const show = await resolveShowWithPhotos(slug);
  return <ShowLandingClient show={show} />;
}

