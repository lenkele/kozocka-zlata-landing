'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

type FooterLang = 'ru' | 'en' | 'he';

const FOOTER_LABELS: Record<FooterLang, { terms: string; privacy: string }> = {
  ru: {
    terms: 'Условия',
    privacy: 'Политика конфиденциальности',
  },
  en: {
    terms: 'Terms',
    privacy: 'Privacy Policy',
  },
  he: {
    terms: 'תנאי שימוש',
    privacy: 'מדיניות פרטיות',
  },
};

export default function LegalFooterLinks() {
  const lang = useSyncExternalStore<FooterLang>(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener('storage', onStoreChange);
      window.addEventListener('preferredLangChanged', onStoreChange);
      return () => {
        window.removeEventListener('storage', onStoreChange);
        window.removeEventListener('preferredLangChanged', onStoreChange);
      };
    },
    () => {
      const preferred = localStorage.getItem('preferredLang');
      if (preferred === 'ru' || preferred === 'en' || preferred === 'he') {
        return preferred;
      }
      return 'ru';
    },
    () => 'ru',
  );

  const labels = FOOTER_LABELS[lang];

  return (
    <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 md:gap-6">
      <Link href="/terms" className="hover:text-slate-100 underline-offset-4 hover:underline">
        {labels.terms}
      </Link>
      <span aria-hidden="true" className="text-slate-500">|</span>
      <Link href="/privacy" className="hover:text-slate-100 underline-offset-4 hover:underline">
        {labels.privacy}
      </Link>
    </div>
  );
}
