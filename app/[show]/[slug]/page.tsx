import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { InvitePage, WorkshopsPage } from '@/components/InfoPages';
import { isLang, getShowLanguages } from '@/lib/i18n';
import { infoPageMetadata, isInfoPageSlug } from '@/lib/infoPages';
import { INVITE_COPY, WORKSHOPS_COPY } from '@/lib/infoPagesCopy';
import { LocalizedShow, showMetadata } from '@/lib/showPage';
import { isShowSlug } from '@/shows';

type Props = { params: Promise<{ show: string; slug: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { show: lang, slug } = await params;
  if (!isLang(lang)) return {};
  if (slug === 'invite') return infoPageMetadata(lang, slug, INVITE_COPY[lang].metaTitle, INVITE_COPY[lang].metaDescription);
  if (slug === 'workshops') {
    return infoPageMetadata(lang, slug, WORKSHOPS_COPY[lang].metaTitle, WORKSHOPS_COPY[lang].metaDescription, '/images/workshops/suitcase-horse.jpg');
  }
  if (!isShowSlug(slug) || !getShowLanguages(slug).includes(lang)) return {};
  return showMetadata(slug, lang);
}

export default async function Page({ params }: Props) {
  const { show: lang, slug } = await params;
  if (!isLang(lang)) notFound();
  if (isInfoPageSlug(slug)) return slug === 'invite' ? <InvitePage lang={lang} /> : <WorkshopsPage lang={lang} />;
  if (!isShowSlug(slug) || !getShowLanguages(slug).includes(lang)) notFound();
  return <LocalizedShow slug={slug} lang={lang} />;
}
