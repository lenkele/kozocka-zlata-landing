import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLang, getShowLanguages } from '@/lib/i18n';
import { LocalizedShow, showMetadata } from '@/lib/showPage';
import { isShowSlug } from '@/shows';

type Props = { params: Promise<{ show: string; slug: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { show: lang, slug } = await params;
  if (!isLang(lang) || !isShowSlug(slug) || !getShowLanguages(slug).includes(lang)) return {};
  return showMetadata(slug, lang);
}

export default async function Page({ params }: Props) {
  const { show: lang, slug } = await params;
  if (!isLang(lang) || !isShowSlug(slug) || !getShowLanguages(slug).includes(lang)) notFound();
  return <LocalizedShow slug={slug} lang={lang} />;
}
