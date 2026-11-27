import Link from 'next/link';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import WhatsAppGroupButton from '@/components/WhatsAppGroupButton';
import { HOME_COPY } from '@/lib/homeCopy';
import { LANGUAGES, localizedPath } from '@/lib/i18n';
import { infoPagePath, type InfoPageSlug } from '@/lib/infoPages';
import { NAV_COPY } from '@/lib/infoPagesCopy';
import type { Lang } from '@/shows/types';

const NUNITO = { fontFamily: 'Nunito, Arial, sans-serif' };
const BUTTON = 'rounded-full px-4 py-2 text-[13px] sm:px-5 sm:py-2.5 sm:text-sm transition';
const DARK = `${BUTTON} bg-[#1f1810] font-bold text-[#f2c46b] hover:text-[#ffd98a]`;

/** Шапка главной и страниц для организаторов. `page` — текущая страница (для подсветки и переключателя языка). */
export function SiteHeader({ lang, page }: { lang: Lang; page?: InfoPageSlug }) {
  const copy = HOME_COPY[lang];
  const nav = NAV_COPY[lang];
  const home = localizedPath(lang);

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-3 bg-[#2f2418] px-5 py-3 shadow-[0_6px_24px_rgba(40,28,14,.35)] md:gap-4 md:px-7">
      <Link href={home} className="flex flex-col gap-0.5">
        <span className="text-[15px] font-black uppercase tracking-[0.18em] text-[#f2c46b]" style={NUNITO}>
          {copy.theatre}
        </span>
        <span className="text-xs font-bold text-[#d8a24a]">{copy.subtitle}</span>
      </Link>

      <div className="hidden flex-1 md:block" />
      <LanguageSwitcher lang={lang} available={LANGUAGES} pagePath={page} />

      <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <a href={`${home}#afisha`} className={`${BUTTON} bg-[#e8a33d] font-black text-[#2f2418] hover:bg-[#f6b957]`} style={NUNITO}>
          {nav.afisha}
        </a>
        <a href={`${home}#shows`} className={DARK} style={NUNITO}>
          {nav.shows}
        </a>
        <Link
          href={infoPagePath(lang, 'workshops')}
          aria-current={page === 'workshops' ? 'page' : undefined}
          className={`${DARK} aria-[current=page]:ring-2 aria-[current=page]:ring-[#f2c46b]`}
          style={NUNITO}
        >
          {nav.workshops}
        </Link>
        <Link
          href={infoPagePath(lang, 'invite')}
          aria-current={page === 'invite' ? 'page' : undefined}
          className={`${BUTTON} bg-[#c9812a] font-black text-[#fff6e4] hover:bg-[#dd9339] aria-[current=page]:ring-2 aria-[current=page]:ring-[#f2c46b]`}
          style={NUNITO}
        >
          {nav.invite}
        </Link>
        <WhatsAppGroupButton lang={lang} className={`cursor-pointer ${DARK}`} style={NUNITO} />
      </nav>
    </header>
  );
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const copy = HOME_COPY[lang];
  const nav = NAV_COPY[lang];
  const home = localizedPath(lang);

  return (
    <footer className="mt-8 bg-[#2f2418] px-5 py-9 md:px-7">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div>
          <div className="mb-2 text-[15px] font-black uppercase tracking-[0.18em] text-[#f2c46b]" style={NUNITO}>
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
          <a href={`${home}#afisha`} className="hover:text-[#ffd98a]">
            {nav.afisha}
          </a>
          <a href={`${home}#shows`} className="hover:text-[#ffd98a]">
            {nav.shows}
          </a>
          <Link href={infoPagePath(lang, 'workshops')} className="hover:text-[#ffd98a]">
            {nav.workshops}
          </Link>
          <Link href={infoPagePath(lang, 'invite')} className="hover:text-[#ffd98a]">
            {nav.invite}
          </Link>
          <a href={`${home}#about`} className="hover:text-[#ffd98a]">
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
  );
}
