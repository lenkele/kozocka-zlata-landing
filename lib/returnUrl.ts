import { isShowSlug } from '@/shows';
import type { ShowSlug } from '@/shows/types';

export type ResolveReturnUrlOptions = {
  /** Slug спектакля, с которого шла покупка — для корректного возврата при относительном пути */
  showSlug?: ShowSlug;
};

/**
 * Whitelist доменов, на которые разрешён возврат после оплаты.
 * Должен совпадать с доменами спектаклей (proxy.ts HOST_TO_SHOW).
 */
const ALLOWED_RETURN_HOSTS = new Set([
  'ryba-kiva-zlata.com',
  'www.ryba-kiva-zlata.com',
  'ryba-kiva-marita.com',
  'www.ryba-kiva-marita.com',
  'localhost',
  '127.0.0.1',
  'kozocka-zlata-landing-coral.vercel.app',
  'kozocka-zlata-landing.vercel.app',
]);

/** Канонические production-домены для спектаклей (proxy.ts HOST_TO_SHOW) */
const SHOW_CANONICAL_ORIGIN: Record<ShowSlug, string> = {
  zlata: 'https://ryba-kiva-zlata.com',
  marita: 'https://ryba-kiva-marita.com',
};

function getHostFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isHostAllowed(host: string): boolean {
  const lower = host.toLowerCase();
  if (ALLOWED_RETURN_HOSTS.has(lower)) return true;
  if (lower.endsWith('.vercel.app')) return true;
  return false;
}

/** Извлекает slug из пути (/zlata, /marita, /) */
function getSlugFromPath(pathname: string): ShowSlug {
  const segment = (pathname || '/').split('/')[1];
  return segment && isShowSlug(segment) ? (segment as ShowSlug) : 'zlata';
}

/** Преобразует относительный путь в канонический production URL */
function pathToCanonicalUrl(path: string, showSlug?: ShowSlug): string {
  const pathname = path.split('?')[0] || '/';
  const search = path.includes('?') ? path.slice(path.indexOf('?')) : '';
  const slug = showSlug ?? getSlugFromPath(pathname);
  const canonicalPath = pathname === '/' ? `/${slug}` : pathname;
  return `${SHOW_CANONICAL_ORIGIN[slug]}${canonicalPath}${search}`;
}

/** Если URL с preview-домена (*.vercel.app), заменяем на канонический production */
function rewritePreviewToCanonical(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('.vercel.app')) return url;

    const pathname = parsed.pathname || '/';
    const slug = getSlugFromPath(pathname);
    const canonical = SHOW_CANONICAL_ORIGIN[slug];
    return `${canonical}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Валидирует и возвращает безопасный URL для возврата.
 * Принимает относительный путь (/zlata) или полный URL (https://...).
 * URL с preview-доменов (*.vercel.app) заменяются на канонические production-домена.
 * @param raw — значение параметра return из URL
 * @param fallbackPath — путь по умолчанию (например /)
 * @param options.showSlug — slug спектакля, с которого шла покупка (из параметра show)
 */
export function resolveSafeReturnUrl(
  raw: string | undefined,
  fallbackPath: string,
  options?: ResolveReturnUrlOptions
): string {
  const showSlug = options?.showSlug;
  if (typeof raw !== 'string') return pathToCanonicalUrl(fallbackPath, showSlug);
  const trimmed = raw.trim();
  if (!trimmed) return pathToCanonicalUrl(fallbackPath, showSlug);

  // Относительный путь — всегда преобразуем в канонический URL,
  // используя showSlug для определения спектакля (важно при path="/")
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return pathToCanonicalUrl(trimmed, showSlug);
  }

  // Полный URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const decoded = decodeURIComponent(trimmed);
      const host = getHostFromUrl(decoded);
      if (!host || !isHostAllowed(host)) return pathToCanonicalUrl(fallbackPath, showSlug);
      return rewritePreviewToCanonical(decoded);
    } catch {
      return pathToCanonicalUrl(fallbackPath, showSlug);
    }
  }

  return pathToCanonicalUrl(fallbackPath, showSlug);
}
