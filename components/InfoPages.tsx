import Image from 'next/image';
import Link from 'next/link';

import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { HOME_COPY } from '@/lib/homeCopy';
import { SITE_URL, localizedPath } from '@/lib/i18n';
import { infoPagePath, type InfoPageSlug } from '@/lib/infoPages';
import { INVITE_COPY, NAV_COPY, WORKSHOPS_COPY, type Fact, type Workshop } from '@/lib/infoPagesCopy';
import { SHOWS, SHOW_SLUGS } from '@/shows';
import type { Lang } from '@/shows/types';

const NUNITO = { fontFamily: 'Nunito, Arial, sans-serif' };
const WHATSAPP_BASE = 'https://wa.me/972533219998?text=';
const PRIMARY_BUTTON = 'rounded-full bg-[#e8a33d] px-6 py-3.5 text-[17px] font-black text-[#2f2418] transition hover:bg-[#f6b957]';
const OUTLINE_BUTTON =
  'rounded-full border border-[#f2c46b73] px-6 py-3.5 text-[17px] font-black text-[#f2c46b] transition hover:bg-[#f2c46b1f] hover:text-[#ffd98a]';

function pageJsonLd(lang: Lang, slug: InfoPageSlug, title: string, description: string) {
  const url = `${SITE_URL}${infoPagePath(lang, slug)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: HOME_COPY[lang].theatre, item: `${SITE_URL}${localizedPath(lang)}` },
          { '@type': 'ListItem', position: 2, name: NAV_COPY[lang][slug], item: url },
        ],
      },
    ],
  };
}

function PageShell({ lang, page, jsonLd, children }: { lang: Lang; page: InfoPageSlug; jsonLd: object; children: React.ReactNode }) {
  return (
    <main
      lang={lang}
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      className="min-h-screen text-[#f4ecdd]"
      style={{
        fontFamily: "'PT Sans', Arial, Helvetica, sans-serif",
        backgroundColor: '#d9c59b',
        backgroundImage: "linear-gradient(rgba(47,36,24,.24), rgba(47,36,24,.34)), url('/images/background1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteHeader lang={lang} page={page} />
      {children}
      <SiteFooter lang={lang} />
    </main>
  );
}

function Hero({ kicker, heading, lead }: { kicker: string; heading: string; lead: string[] }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-6 pt-12 md:px-7 md:pt-16">
      <div className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.2em] text-[#4c3a22]" style={NUNITO}>
        {kicker}
      </div>
      <h1
        className="mb-6 text-[34px] font-black leading-[1.08] text-[#fdf1d4] [text-wrap:balance] sm:text-[40px] md:text-[46px]"
        style={{ ...NUNITO, textShadow: '0 3px 18px rgba(47,36,24,.45)' }}
      >
        {heading}
      </h1>
      <div className="max-w-3xl space-y-4">
        {lead.map((paragraph) => (
          <p key={paragraph} className="rounded-2xl bg-[#2f2418b8] px-5 py-5 text-[18.5px] leading-8 text-[#f4ecdd] md:px-6">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-3xl font-black text-[#fdf1d4] md:text-[38px]" style={{ ...NUNITO, textShadow: '0 2px 14px rgba(47,36,24,.4)' }}>
      {children}
    </h2>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418cc] px-5 py-6 md:px-7 ${className}`}>{children}</div>;
}

function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid gap-2 text-[16px] leading-6">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-wrap gap-x-2">
          <dt className="font-black text-[#f2c46b]" style={NUNITO}>
            {fact.label}:
          </dt>
          <dd className="text-[#eadfc9]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InvitePage({ lang }: { lang: Lang }) {
  const copy = INVITE_COPY[lang];
  const home = HOME_COPY[lang];
  const whatsappUrl = WHATSAPP_BASE + encodeURIComponent(copy.whatsappMessage);

  return (
    <PageShell lang={lang} page="invite" jsonLd={pageJsonLd(lang, 'invite', copy.metaTitle, copy.metaDescription)}>
      <Hero kicker={copy.kicker} heading={copy.heading} lead={copy.lead} />

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-7">
        <SectionTitle>{copy.showsHeading}</SectionTitle>
        <div className="grid gap-5 lg:grid-cols-3">
          {SHOW_SLUGS.map((slug) => {
            const show = SHOWS[slug];
            const poster = show.content[lang]?.posterImage ?? show.content.en?.posterImage ?? show.content.ru?.posterImage;
            return (
              <article key={slug} className="flex gap-4 rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418c7] p-4">
                {poster && (
                  <Link href={localizedPath(lang, slug)} className="relative block h-28 w-[4.6rem] shrink-0 overflow-hidden rounded-md bg-[#5f5d5c] sm:h-32 sm:w-20">
                    <Image src={poster} alt={`${home.poster}: ${home.shows[slug].title}`} fill sizes="96px" className="object-cover" />
                  </Link>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#d8a24a]" style={NUNITO}>
                    {copy.shows[slug].note}
                  </div>
                  <h3 className="text-2xl font-black leading-tight text-[#fdf1d4]" style={NUNITO}>
                    <Link href={localizedPath(lang, slug)} className="hover:text-[#ffd98a]">
                      {home.shows[slug].title}
                    </Link>
                  </h3>
                  <div className="text-[15px] text-[#c6b699]">{copy.shows[slug].facts}</div>
                  <Link href={localizedPath(lang, slug)} className="mt-auto pt-1 text-[15.5px] font-black text-[#f2c46b] hover:text-[#ffd98a]" style={NUNITO}>
                    {copy.showLink}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-7">
        <SectionTitle>{copy.audiencesHeading}</SectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          {copy.audiences.map((audience) => (
            <Panel key={audience.title}>
              <h3 className="mb-2 text-xl font-black text-[#fdf1d4]" style={NUNITO}>
                {audience.title}
              </h3>
              <p className="text-[16.5px] leading-7 text-[#eadfc9]">{audience.text}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-7">
        <Panel className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-3xl">
            <h2 className="mb-2 text-2xl font-black text-[#fdf1d4] md:text-3xl" style={NUNITO}>
              {copy.workshopsHeading}
            </h2>
            <p className="text-[17px] leading-7 text-[#eadfc9]">{copy.workshopsText}</p>
          </div>
          <Link href={infoPagePath(lang, 'workshops')} className={OUTLINE_BUTTON} style={NUNITO}>
            {copy.workshopsLink}
          </Link>
        </Panel>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:grid-cols-2 md:px-7">
        <Panel>
          <h2 className="mb-4 text-2xl font-black text-[#fdf1d4] md:text-3xl" style={NUNITO}>
            {copy.venueHeading}
          </h2>
          <ul className="list-disc space-y-2 ps-5 text-[16.5px] leading-7 text-[#eadfc9] marker:text-[#f2c46b]">
            {copy.venue.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-2xl font-black text-[#fdf1d4] md:text-3xl" style={NUNITO}>
            {copy.orderHeading}
          </h2>
          <ol className="list-decimal space-y-2 ps-5 text-[16.5px] leading-7 text-[#eadfc9] marker:font-black marker:text-[#f2c46b]">
            {copy.order.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <p className="mt-4 text-[16.5px] leading-7 text-[#fdf1d4]">{copy.price}</p>
        </Panel>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-2 md:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <a href={whatsappUrl} className={PRIMARY_BUTTON} style={NUNITO}>
            {copy.whatsapp}
          </a>
          <a href="mailto:info@ryba-kiva.com" dir="ltr" className={OUTLINE_BUTTON} style={NUNITO}>
            info@ryba-kiva.com
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const images = [workshop.image, workshop.image2].filter((image) => image !== undefined);
  return (
    <article id={workshop.id} className="scroll-mt-64 md:scroll-mt-24">
      <Panel className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#d8a24a]" style={NUNITO}>
            {workshop.kicker}
          </div>
          <h2 className="mb-4 text-3xl font-black leading-tight text-[#fdf1d4] md:text-[34px]" style={NUNITO}>
            {workshop.title}
          </h2>
          <div className="mb-5 space-y-3 text-[17px] leading-7 text-[#eadfc9]">
            {workshop.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <FactList facts={workshop.facts} />
          {workshop.quote && (
            <blockquote className="mt-5 border-s-4 border-[#e8a33d] ps-4 text-[16px] italic leading-7 text-[#eadfc9]">
              «{workshop.quote.text}»
              <footer className="mt-1 text-[14px] not-italic text-[#c6b699]">— {workshop.quote.source}</footer>
            </blockquote>
          )}
        </div>
        {images.length > 0 && (
          <div className={`grid items-start gap-3 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
            {images.map((image) => (
              <div key={image.src} className="rounded-[4px] bg-[#fff8ea] p-2 shadow-[0_14px_30px_rgba(0,0,0,.35)]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 768px) 22vw, 45vw"
                  className="h-auto w-full rounded-[2px]"
                />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </article>
  );
}

export function WorkshopsPage({ lang }: { lang: Lang }) {
  const copy = WORKSHOPS_COPY[lang];
  const whatsappUrl = WHATSAPP_BASE + encodeURIComponent(copy.whatsappMessage);

  return (
    <PageShell lang={lang} page="workshops" jsonLd={pageJsonLd(lang, 'workshops', copy.metaTitle, copy.metaDescription)}>
      <Hero kicker={copy.kicker} heading={copy.heading} lead={copy.lead} />

      <section className="mx-auto max-w-6xl px-5 pb-4 md:px-7">
        <Panel>
          <FactList facts={copy.general} />
        </Panel>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:px-7">
        {copy.workshops.map((workshop) => <WorkshopCard key={workshop.id} workshop={workshop} />)}
        <p className="rounded-2xl bg-[#2f2418b8] px-5 py-4 text-[17px] leading-7 text-[#fdf1d4] md:px-6">{copy.combineNote}</p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-2 md:px-7">
        <Panel>
          <h2 className="mb-2 text-2xl font-black text-[#fdf1d4] md:text-3xl" style={NUNITO}>
            {copy.ctaHeading}
          </h2>
          <p className="mb-5 max-w-3xl text-[17px] leading-7 text-[#eadfc9]">{copy.ctaText}</p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={whatsappUrl} className={PRIMARY_BUTTON} style={NUNITO}>
              {copy.whatsapp}
            </a>
            <a href="mailto:info@ryba-kiva.com" dir="ltr" className={OUTLINE_BUTTON} style={NUNITO}>
              info@ryba-kiva.com
            </a>
            <Link href={infoPagePath(lang, 'invite')} className={OUTLINE_BUTTON} style={NUNITO}>
              {copy.inviteLink}
            </Link>
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
