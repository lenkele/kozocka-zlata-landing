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
  // Vercel preview deployments
  'kozocka-zlata-landing-coral.vercel.app',
  'kozocka-zlata-landing.vercel.app',
]);

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

/**
 * Валидирует и возвращает безопасный URL для возврата.
 * Принимает относительный путь (/zlata) или полный URL (https://...).
 * Для полных URL проверяет whitelist доменов.
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
      return decoded;
    } catch {
      return fallbackPath;
    }
  }

  return fallbackPath;
}
