import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isShowSlug } from '@/shows';
import { type ShowSlug } from '@/shows/types';
import { LANGUAGES, LANGUAGE_COOKIE, LANGUAGE_HEADER, getShowLanguages, isLang, localizedPath, selectLanguage } from '@/lib/i18n';
import { infoPagePath, isInfoPageSlug } from '@/lib/infoPages';

const LEGACY_HOST_TO_SHOW: Record<string, ShowSlug> = {
  'www.ryba-kiva-zlata.com': 'zlata',
  'ryba-kiva-zlata.com': 'zlata',
  'www.ryba-kiva-marita.com': 'marita',
  'ryba-kiva-marita.com': 'marita',
  'www.ryba-kiva-gefilte-lid.com': 'gefilte-lid',
  'ryba-kiva-gefilte-lid.com': 'gefilte-lid',
};

const CANONICAL_ORIGIN = 'https://ryba-kiva.com';

const EXCLUDED_PREFIXES = ['/api', '/_next', '/static', '/favicon.ico', '/shows'];

function languageRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url, 307);
  // Language decisions must never be cached across visitors or browser preferences.
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Accept-Language, Cookie');
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hostHeader = request.headers.get('host')?.toLowerCase() ?? '';
  const hostname = hostHeader.split(':')[0];
  const legacyShowSlug = LEGACY_HOST_TO_SHOW[hostname];

  // www дублирует основной домен — склеиваем для Google постоянным редиректом.
  if (hostname === 'www.ryba-kiva.com' && !pathname.startsWith('/api/')) {
    const redirectUrl = new URL(pathname, CANONICAL_ORIGIN);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (legacyShowSlug) {
    // Keep legacy payment callbacks reachable until the old domains expire.
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    const redirectUrl = new URL(pathname === '/' ? `/${legacyShowSlug}` : pathname, CANONICAL_ORIGIN);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const [first, second] = segments;
  // Короткие ссылки на страницы для организаторов (/invite, /workshops) — на языке посетителя.
  if (segments.length === 1 && isInfoPageSlug(first)) {
    const lang = selectLanguage(
      request.headers.get('accept-language'),
      LANGUAGES,
      request.cookies.get(LANGUAGE_COOKIE)?.value,
      request.nextUrl.searchParams.get('lang'),
    );
    return languageRedirect(request, infoPagePath(lang, first));
  }
  if (pathname === '/' || (segments.length === 1 && isShowSlug(first))) {
    const slug = isShowSlug(first) ? first : undefined;
    const lang = selectLanguage(
      request.headers.get('accept-language'),
      slug ? getShowLanguages(slug) : LANGUAGES,
      request.cookies.get(LANGUAGE_COOKIE)?.value,
      request.nextUrl.searchParams.get('lang'),
    );
    return languageRedirect(request, localizedPath(lang, slug));
  }
  if (isLang(first) && segments.length === 2 && isShowSlug(second)) {
    const target = localizedPath(first, second);
    if (target !== pathname.replace(/\/$/, '')) return languageRedirect(request, target);
  }

  // The URL, never a browser preference, determines the rendered language on localized pages.
  const headers = new Headers(request.headers);
  headers.set(LANGUAGE_HEADER, isLang(first) ? first : 'ru');
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|shows).*)'],
};

