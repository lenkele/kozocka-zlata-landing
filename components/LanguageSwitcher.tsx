'use client';

import type { MouseEvent } from 'react';
import { LANGUAGE_COOKIE, localizedPath } from '@/lib/i18n';
import type { Lang, ShowSlug } from '@/shows/types';

const LABELS: Record<Lang, string> = { ru: 'Рус', he: 'עברית', en: 'English' };
const NAMES: Record<Lang, string> = { ru: 'Русский', he: 'עברית', en: 'English' };

function saveLanguageChoice(target: Lang) {
  document.cookie = `${LANGUAGE_COOKIE}=${target}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  try {
    localStorage.setItem('preferredLang', target);
    window.dispatchEvent(new Event('preferredLangChanged'));
  } catch { /* Navigation still works when browser storage is unavailable. */ }
}

export default function LanguageSwitcher({ lang, available, slug }: { lang: Lang; available: Lang[]; slug?: ShowSlug }) {
  function chooseLanguage(event: MouseEvent<HTMLAnchorElement>, target: Lang) {
    // Hashes are not sent to the server. Preserve them (and tracking/payment query parameters) here.
    const url = new URL(localizedPath(target, slug), window.location.origin);
    url.search = window.location.search;
    url.searchParams.delete('lang');
    url.hash = window.location.hash;
    event.currentTarget.href = url.toString();
    saveLanguageChoice(target);
  }

  return (
    <nav aria-label="Language" dir="ltr" className="flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-sm">
      {available.map((target) => (
        <a key={target} href={localizedPath(target, slug)} hrefLang={target} lang={target}
          aria-label={NAMES[target]} aria-current={target === lang ? 'page' : undefined}
          onClick={(event) => chooseLanguage(event, target)}
          className={`rounded-full px-2.5 py-1 transition ${target === lang ? 'bg-amber-500 font-semibold text-black' : 'text-amber-100 hover:bg-white/10'}`}>
          {LABELS[target]}
        </a>
      ))}
    </nav>
  );
}
