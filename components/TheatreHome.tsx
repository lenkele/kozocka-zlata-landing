import Image from 'next/image';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { HOME_COPY } from '@/lib/homeCopy';
import { isPastPerformance, selectAfishaRows } from '@/lib/afisha';
import { LANGUAGES, LOCALES, SITE_URL, localizedPath } from '@/lib/i18n';
import { getCachedScheduleForShow, isClosedSchedule, normalizeScheduleDate, parseSchedulePrice } from '@/lib/schedule';
import { SHOWS, SHOW_SLUGS } from '@/shows';
import type { Lang, ShowConfig, ShowSlug } from '@/shows/types';

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/rybakiva' },
  { label: 'Instagram', href: 'https://www.instagram.com/ryba.kiva/' },
];

function homeJsonLd(lang: Lang) {
  const copy = HOME_COPY[lang];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // Имя как в соцсетях и прессе — по нему Google связывает сайт с театром.
        '@type': 'PerformingGroup', '@id': `${SITE_URL}/#organization`,
        name: 'Рыба Кива',
        alternateName: ['Театр «Рыба Кива»', 'Театрик «Рыба Кива»', 'Ryba Kiva', 'Ryba Kiva Theatre', 'ריבא קיווא'],
        description: 'Независимый музыкальный кукольный театр.',
        url: SITE_URL, logo: `${SITE_URL}/images/ryba-kiva-logo.jpg`,
        telephone: '+972-53-321-9998', email: 'info@ryba-kiva.com',
        sameAs: SOCIAL_LINKS.map((link) => link.href),
      },
      {
        '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL,
        name: copy.theatre, alternateName: ['Рыба Кива', 'Ryba Kiva', 'ריבא קיווא'],
        inLanguage: LANGUAGES, publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebPage', '@id': `${SITE_URL}${localizedPath(lang)}#webpage`,
        url: `${SITE_URL}${localizedPath(lang)}`, name: copy.title,
        description: copy.description, inLanguage: lang,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  };
}

type HomeScheduleRow = {
  id: string;
  showSlug: ShowSlug;
  showTitle: string;
  dateIso: string;
  dateLabel: string;
  weekday: string;
  time: string;
  place: string;
  details: string;
  ticketMode: 'self' | 'venue';
  ticketUrl: string | null;
  isClosed: boolean;
  isPast: boolean;
};

function getShowPoster(show: ShowConfig, lang: Lang): string {
  return show.content[lang]?.posterImage ?? show.content.en?.posterImage ?? show.content.ru?.posterImage ?? show.galleryPhotos[0]?.src ?? '/favicon.png';
}

function formatScheduleDate(dateIso: string, options: Intl.DateTimeFormatOptions, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    ...options,
    timeZone: 'Asia/Jerusalem',
  }).format(new Date(`${dateIso}T12:00:00+03:00`));
}

function parseScheduleLinks(text: string, disableLinks = false): React.ReactNode {
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(disableLinks ? match[1] : (
      <a key={`${match.index}-${match[2]}`} href={match[2]} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 hover:text-[#ffd98a]">
        {match[1]}
      </a>
    ));
    lastIndex = linkPattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

async function getHomeScheduleRows(lang: Lang): Promise<HomeScheduleRow[]> {
  const now = new Date();
  const schedules = await Promise.all(
    SHOW_SLUGS.map(async (showSlug) => ({
      showSlug,
      events: await getCachedScheduleForShow(showSlug),
    })),
  );

  const rows = schedules
    .flatMap(({ showSlug, events }) =>
      events.map((event, index): HomeScheduleRow | null => {
        const entry = event.entries?.[lang] ?? event.entries?.en ?? event.entries?.ru ?? event.entries?.he;
        const dateIso = normalizeScheduleDate(event.date_iso);
        if (!entry || !dateIso) return null;

        const formatOriginal = entry.format_original ?? entry.format;
        const price = parseSchedulePrice(event.price_ils);
        const priceLabel =
          price === null
            ? ''
            : price === 0
              ? HOME_COPY[lang].freeEntry
              : new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(price);
        const details = [entry.format, entry.language, priceLabel].filter(Boolean).join(' · ');

        return {
          id: event.id ?? `${dateIso}-${entry.time}-${index}`,
          showSlug,
          showTitle: HOME_COPY[lang].shows[showSlug].title,
          dateIso,
          dateLabel: formatScheduleDate(dateIso, { day: 'numeric', month: 'long', year: 'numeric' }, lang),
          weekday: formatScheduleDate(dateIso, { weekday: 'long' }, lang),
          time: entry.time,
          place: entry.place,
          details,
          ticketMode: event.ticket_mode === 'venue' ? 'venue' : 'self',
          ticketUrl: typeof event.ticket_url === 'string' && event.ticket_url.trim() ? event.ticket_url.trim() : null,
          isClosed: isClosedSchedule(formatOriginal),
          isPast: isPastPerformance({ dateIso, time: entry.time }, now),
        };
      }),
    )
    .filter((row): row is HomeScheduleRow => row !== null);
  return selectAfishaRows(rows, now);
}

export default async function TheatreHome({ lang }: { lang: Lang }) {
  const copy = HOME_COPY[lang];
  const whatsappInviteUrl = 'https://wa.me/972533219998?text=' + encodeURIComponent(copy.whatsappMessage);
  const shows = SHOW_SLUGS.map((slug) => SHOWS[slug]);
  const scheduleRows = await getHomeScheduleRows(lang);

  return (
    <main
      lang={lang}
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      className="min-h-screen text-[#f4ecdd]"
      style={{
        fontFamily: "'PT Sans', Arial, Helvetica, sans-serif",
        backgroundColor: '#d9c59b',
        backgroundImage:
          "linear-gradient(rgba(47,36,24,.24), rgba(47,36,24,.34)), url('/images/background1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(lang)).replace(/</g, '\\u003c') }}
      />
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-4 bg-[#2f2418] px-5 py-3 shadow-[0_6px_24px_rgba(40,28,14,.35)] md:px-7">
        <Link href={localizedPath(lang)} className="flex flex-col gap-0.5">
          <span className="text-[15px] font-black uppercase tracking-[0.18em] text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            {copy.theatre}
          </span>
          <span className="text-xs font-bold text-[#d8a24a]">{copy.subtitle}</span>
        </Link>

        <div className="hidden flex-1 md:block" />
        <LanguageSwitcher lang={lang} available={LANGUAGES} />

        <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <a
            href="#afisha"
            className="rounded-full bg-[#e8a33d] px-5 py-2.5 text-sm font-black text-[#2f2418] transition hover:bg-[#f6b957]"
            style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
          >
            {copy.afisha}
          </a>
          <a
            href="#shows"
            className="rounded-full bg-[#1f1810] px-5 py-2.5 text-sm font-bold text-[#f2c46b] transition hover:text-[#ffd98a]"
            style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
          >
            {copy.showsLabel}
          </a>
          <a
            href="#invite"
            className="rounded-full bg-[#c9812a] px-5 py-2.5 text-sm font-black text-[#fff6e4] transition hover:bg-[#dd9339]"
            style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
          >
            {copy.invite}
          </a>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.15fr_.85fr] md:px-7 md:py-16">
        <div>
          <div className="mb-7 flex items-center gap-4 sm:gap-5 md:gap-6">
            <Image
              src="/images/ryba-kiva-logo.jpg"
              alt={copy.logoAlt}
              width={180}
              height={180}
              priority
              className="h-24 w-24 shrink-0 object-contain mix-blend-multiply md:h-28 md:w-28"
            />
            <h1
              className="min-w-0 text-[34px] font-black leading-[1.05] text-[#fdf1d4] [text-wrap:balance] sm:text-[40px] md:text-[46px]"
              style={{ fontFamily: 'Nunito, Arial, sans-serif', textShadow: '0 3px 18px rgba(47,36,24,.45)' }}
            >
              {copy.heading}
            </h1>
          </div>

          <div className="space-y-4">
            {copy.hero.map((paragraph) => <TextPanel key={paragraph}><span className="whitespace-pre-line">{paragraph}</span></TextPanel>)}
          </div>
        </div>

        <div className="relative mx-auto h-[500px] w-full max-w-[480px] sm:h-[600px] md:h-[690px] md:max-w-none">
          <div className="absolute left-1 top-2 z-0 w-[61%] -rotate-[4deg] rounded-[4px] bg-[#fff8ea] p-2.5 shadow-[0_22px_44px_rgba(47,36,24,.42)] sm:left-4 sm:top-4 sm:w-[58%] md:left-0 md:top-2 md:w-[64%]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-[2px]">
              <Image
                src="/images/theatre-team.JPG"
                alt={copy.teamAlt}
                fill
                priority
                sizes="(min-width: 768px) 24vw, 58vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="absolute bottom-2 right-0 z-10 w-[88%] rotate-[3deg] rounded-[4px] bg-[#fff8ea] p-2.5 shadow-[0_24px_48px_rgba(47,36,24,.5)] sm:bottom-4 sm:w-[84%] md:-right-3 md:bottom-6 md:w-[86%]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2px]">
              <Image
                src="/images/theatre-performance.jpg"
                alt={copy.performanceAlt}
                fill
                priority
                sizes="(min-width: 768px) 34vw, 84vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="afisha" className="scroll-mt-64 md:scroll-mt-24 mx-auto max-w-6xl px-5 pb-2 pt-6 md:px-7">
        <SectionTitle>{copy.afishaHeading}</SectionTitle>
        <div className="mt-7 overflow-hidden rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418cc]">
          {scheduleRows.length > 0 ? (
            scheduleRows.map((row, index) => (
              <div
                key={`${row.showSlug}-${row.id}`}
                data-performance-id={`${row.showSlug}:${row.id}`}
                data-performance-date={row.dateIso}
                data-performance-past={row.isPast}
                className="flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 md:px-7"
                style={{ borderBottom: index === scheduleRows.length - 1 ? undefined : '1px solid rgba(242,196,107,.14)' }}
              >
                <div className="w-40">
                  <div className="text-[22px] font-black text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    {row.dateLabel}
                  </div>
                  <div className="text-[15px] text-[#c6b699]">
                    {row.weekday}, {row.time}
                  </div>
                </div>
                <div className="min-w-44 flex-1">
                  <Link href={localizedPath(lang, row.showSlug)} className="text-xl font-black text-[#fdf1d4] hover:text-[#ffd98a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    {row.showTitle}
                  </Link>
                  <div className="text-[15px] text-[#c6b699]">{parseScheduleLinks(row.details, row.isPast)}</div>
                </div>
                <div className="min-w-40 flex-1 text-[16.5px]">{parseScheduleLinks(row.place, row.isPast)}</div>
                <div className="ms-auto min-w-28 text-end">
                  {row.isPast ? (
                    <span className="text-sm text-[#c6b699]">{copy.passed}</span>
                  ) : row.isClosed ? (
                    <span className="text-sm text-[#c6b699]">{copy.closed}</span>
                  ) : row.ticketMode === 'venue' && row.ticketUrl ? (
                    <a
                      href={row.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex whitespace-nowrap rounded-full bg-[#e8a33d] px-5 py-2.5 text-sm font-black text-[#2f2418] transition hover:bg-[#f6b957]"
                      style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
                    >
                      {copy.tickets}
                    </a>
                  ) : row.ticketMode === 'venue' ? (
                    <span className="text-sm text-[#c6b699]">{copy.unavailable}</span>
                  ) : (
                    <Link
                      href={`${localizedPath(lang, row.showSlug)}#schedule`}
                      className="inline-flex whitespace-nowrap rounded-full bg-[#e8a33d] px-5 py-2.5 text-sm font-black text-[#2f2418] transition hover:bg-[#f6b957]"
                      style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
                    >
                      {copy.tickets}
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-base text-[#eadfc9] md:px-7">{copy.emptySchedule}</p>
          )}
        </div>
      </section>

      <section id="shows" className="scroll-mt-64 md:scroll-mt-24 mx-auto max-w-6xl px-5 py-14 md:px-7">
        <SectionKicker>{copy.repertoire}</SectionKicker>
        <SectionTitle>{copy.showsHeading}</SectionTitle>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {shows.map((show) => {
            const showCopy = HOME_COPY[lang].shows[show.slug];
            return (
              <article key={show.slug} className="flex min-h-full gap-4 rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418c7] p-4 transition hover:border-[#f2c46b73] hover:bg-[#2f2418eb]">
                <Link href={localizedPath(lang, show.slug)} className="relative block h-28 w-[4.6rem] shrink-0 overflow-hidden rounded-md bg-[#5f5d5c] sm:h-32 sm:w-20">
                  <Image src={getShowPoster(show, lang)} alt={`${copy.poster}: ${showCopy.title}`} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#d8a24a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    {showCopy.eyebrow}
                  </div>
                  <Link href={localizedPath(lang, show.slug)} className="text-2xl font-black leading-tight text-[#fdf1d4] hover:text-[#ffd98a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    {showCopy.title}
                  </Link>
                  <p className="text-[15.5px] leading-6 text-[#eadfc9]">{showCopy.description}</p>
                  <div className="mt-auto text-[15px] text-[#c6b699]">{showCopy.meta}</div>
                  <div className="flex flex-wrap gap-3 pt-1 text-[15.5px] font-black" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    <Link href={localizedPath(lang, show.slug)} className="text-[#f2c46b] hover:text-[#ffd98a]">
                      {copy.aboutShow}
                    </Link>
                    <Link href={`${localizedPath(lang, show.slug)}#schedule`} className="text-[#f2c46b] hover:text-[#ffd98a]">
                      {copy.schedule}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="invite" className="scroll-mt-64 md:scroll-mt-24 mx-auto max-w-6xl px-5 py-6 md:px-7">
        <div className="rounded-[22px] border border-[#f2c46b2e] bg-[#2f2418cc] px-5 py-8 md:px-10 md:py-10">
          <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-[#d8a24a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            {copy.invite}
          </div>
          <h2 className="mb-3 text-3xl font-black text-[#fdf1d4] md:text-[38px]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            {copy.inviteHeading}
          </h2>
          <p className="mb-8 max-w-3xl whitespace-pre-line text-lg leading-7 text-[#eadfc9]">{copy.inviteIntro}</p>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {copy.inviteSteps.map((step, index) => <InviteStep key={step} number={String(index + 1)}>{step}</InviteStep>)}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappInviteUrl}
              className="rounded-full bg-[#e8a33d] px-6 py-3.5 text-[17px] font-black text-[#2f2418] transition hover:bg-[#f6b957]"
              style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
            >
              {copy.whatsapp}
            </a>
            <a
              href="mailto:info@ryba-kiva.com"
              dir="ltr"
              className="rounded-full border border-[#f2c46b73] px-6 py-3.5 text-[17px] font-black text-[#f2c46b] transition hover:bg-[#f2c46b1f] hover:text-[#ffd98a]"
              style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
            >
              info@ryba-kiva.com
            </a>
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#f2c46b73] px-6 py-3.5 text-[17px] font-black text-[#f2c46b] transition hover:bg-[#f2c46b1f] hover:text-[#ffd98a]"
                style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-64 md:scroll-mt-24 mx-auto grid max-w-6xl gap-7 px-5 py-14 md:grid-cols-2 md:px-7">
        <div>
          <SectionKicker>{copy.about}</SectionKicker>
          <SectionTitle>{copy.aboutHeading}</SectionTitle>
          <div className="mt-5 space-y-4 text-lg leading-7 text-[#3f3020]">
            {copy.aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418c7] px-6 py-6 md:px-7">
          <div className="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#d8a24a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            {copy.teamHeading}
          </div>
          <div className="grid gap-3.5 text-[17px] leading-6">
            {copy.team.map((member) => <TeamMember key={member.name} {...member} />)}
          </div>
        </div>
      </section>

      <footer className="mt-8 bg-[#2f2418] px-5 py-9 md:px-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 text-[15px] font-black uppercase tracking-[0.18em] text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
              {copy.theatre}
            </div>
            <div className="text-base text-[#c6b699]">
              {copy.footer} ·{' '}
              <a href="mailto:info@ryba-kiva.com" dir="ltr" className="text-[#f2c46b] hover:text-[#ffd98a]">
                info@ryba-kiva.com
              </a>
            </div>
          </div>
          <nav className="flex flex-wrap gap-4 text-[15px] text-[#c6b699]">
            <a href="#afisha" className="hover:text-[#ffd98a]">
              {copy.afisha}
            </a>
            <a href="#shows" className="hover:text-[#ffd98a]">
              {copy.showsLabel}
            </a>
            <a href="#about" className="hover:text-[#ffd98a]">
              {copy.theatre}
            </a>
            <Link href="/terms" className="hover:text-[#ffd98a]">
              {copy.terms}
            </Link>
            <Link href="/privacy" className="hover:text-[#ffd98a]">
              {copy.privacy}
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function TextPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#2f2418b8] px-5 py-5 text-[18.5px] leading-8 text-[#f4ecdd] md:px-6">{children}</div>;
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.2em] text-[#4c3a22]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 text-4xl font-black text-[#fdf1d4] md:text-[42px]"
      style={{ fontFamily: 'Nunito, Arial, sans-serif', textShadow: '0 2px 14px rgba(47,36,24,.4)' }}
    >
      {children}
    </h2>
  );
}

function InviteStep({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-white/10 px-5 py-5">
      <div className="mb-2 text-[22px] font-black text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
        {number}
      </div>
      <div className="text-[16.5px] leading-6">{children}</div>
    </div>
  );
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <div>
      <strong className="font-black text-[#fdf1d4]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
        {name}
      </strong>
      <div className="text-[15.5px] text-[#c6b699]">{role}</div>
    </div>
  );
}
