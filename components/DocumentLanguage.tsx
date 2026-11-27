'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isLang } from '@/lib/i18n';

/** Keep the shared document layout in sync during Next.js client navigations between locales. */
export default function DocumentLanguage() {
  const pathname = usePathname();
  useEffect(() => {
    const segment = pathname.split('/')[1];
    const lang = isLang(segment) ? segment : 'ru';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [pathname]);
  return null;
}
