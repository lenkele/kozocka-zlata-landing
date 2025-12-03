import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { DEFAULT_SHOW_SLUG, isShowSlug } from '@/shows';
import { type ShowSlug } from '@/shows/types';

const HOST_TO_SHOW: Record<string, ShowSlug> = {
  'www.ryba-kiva-zlata.com': 'zlata',
  'ryba-kiva-zlata.com': 'zlata',
  'www.ryba-kiva-marita.com': 'marita',
  'ryba-kiva-marita.com': 'marita',
  localhost: DEFAULT_SHOW_SLUG,
  '127.0.0.1': DEFAULT_SHOW_SLUG,
};

const EXCLUDED_PREFIXES = ['/api', '/_next', '/static', '/favicon.ico', '/shows'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Проверяем, не является ли текущий путь уже валидным slug спектакля
  const currentSlug = pathname.split('/')[1];
  if (currentSlug && isShowSlug(currentSlug)) {
    // Путь уже указывает на конкретный спектакль - не трогаем его
    return NextResponse.next();
  }

  const hostHeader = request.headers.get('host')?.toLowerCase() ?? '';
  const hostname = hostHeader.split(':')[0];
  const targetSlug = HOST_TO_SHOW[hostname];

  if (!targetSlug || !isShowSlug(targetSlug)) {
    return NextResponse.next();
  }

  // Rewrite только для корневого пути
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${targetSlug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|shows).*)'],
};

