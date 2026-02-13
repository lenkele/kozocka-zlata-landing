import { isShowSlug } from '@/shows';
import type { ShowSlug } from '@/shows/types';

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

/** Если URL с preview-домена (*.vercel.app), заменяем на канонический production */
function rewritePreviewToCanonical(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('.vercel.app')) return url;

    const pathname = parsed.pathname || '/';
    const segment = pathname.split('/')[1];
    const slug = (segment && isShowSlug(segment) ? segment : 'zlata') as ShowSlug;
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
 */
export function resolveSafeReturnUrl(
  raw: string | undefined,
  fallbackPath: string
): string {
  if (typeof raw !== 'string') return fallbackPath;
  const trimmed = raw.trim();
  if (!trimmed) return fallbackPath;

  // Относительный путь
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Полный URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const decoded = decodeURIComponent(trimmed);
      const host = getHostFromUrl(decoded);
      if (!host || !isHostAllowed(host)) return fallbackPath;
      return rewritePreviewToCanonical(decoded);
    } catch {
      return fallbackPath;
    }
  }

  return fallbackPath;
}
