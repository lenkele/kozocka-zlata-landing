import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import TheatreHome from '@/components/TheatreHome';
import { HOME_COPY } from '@/lib/homeCopy';
import { isLang, localizedMetadata } from '@/lib/i18n';
import { isShowSlug } from '@/shows';

type Props = { params: Promise<{ show: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { show: lang } = await params;
  if (!isLang(lang)) return {};
  const copy = HOME_COPY[lang];
  return localizedMetadata(lang, copy.title, copy.description);
}

export default async function Page({ params }: Props) {
  const { show: lang } = await params;
  if (isLang(lang)) return <TheatreHome lang={lang} />;
  if (isShowSlug(lang)) redirect(`/ru/${lang}`);
  notFound();
}
