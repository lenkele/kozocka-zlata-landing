import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import proxy from '../proxy';
import { getShowLanguages, languageAlternates, localizedPath, selectLanguage } from '../lib/i18n';
import sitemap from '../app/sitemap';
import { resolveSafeReturnUrl } from '../lib/returnUrl';

function request(path: string, language?: string, cookie?: string, host = 'ryba-kiva.com') {
  const headers: Record<string, string> = { host };
  if (language) headers['accept-language'] = language;
  if (cookie) headers.cookie = `preferredLang=${cookie}`;
  return new NextRequest(`https://${host}${path}`, { headers });
}

test('browser negotiation supports Hebrew, old iw tags, quality and explicit/saved choices', () => {
  const all = ['ru', 'he', 'en'] as const;
  assert.equal(selectLanguage('he-IL,he;q=0.9,en;q=0.8', [...all]), 'he');
  assert.equal(selectLanguage('iw-IL,en;q=0.5', [...all]), 'he');
  assert.equal(selectLanguage('en;q=0.5,ru;q=0.9,he;q=0', [...all]), 'ru');
  assert.equal(selectLanguage('ru;q=broken,en;q=0.8', [...all]), 'en');
  assert.equal(selectLanguage('he', [...all], 'ru'), 'ru');
  assert.equal(selectLanguage('he', [...all], 'ru', 'en'), 'en');
  assert.equal(selectLanguage(null, [...all]), 'ru');
  assert.equal(selectLanguage('de', [...all]), 'en');
  assert.equal(selectLanguage('he,en;q=0.5', getShowLanguages('marita')), 'en');
});

test('existing shared links choose a language and preserve all query parameters', () => {
  for (const slug of ['', 'zlata', 'marita', 'gefilte-lid']) {
    const response = proxy(request(`/${slug}?utm_source=whatsapp&event=123`, 'he-IL,en;q=0.8'));
    const target = new URL(response.headers.get('location')!);
    assert.equal(response.status, 307);
    assert.equal(target.pathname, slug === '' ? '/he' : slug === 'zlata' ? '/he/zlata' : `/en/${slug}`);
    assert.equal(target.search, '?utm_source=whatsapp&event=123');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('vary'), 'Accept-Language, Cookie');
  }
  assert.equal(new URL(proxy(request('/zlata?lang=he', 'ru')).headers.get('location')!).pathname, '/he/zlata');
});

test('explicit language addresses stay stable regardless of browser or cookie', () => {
  for (const [path, lang] of [['/ru', 'ru'], ['/he', 'he'], ['/en', 'en'], ['/ru/marita', 'ru'], ['/he/zlata', 'he'], ['/en/gefilte-lid', 'en']]) {
    const response = proxy(request(path, 'en-US', 'ru'));
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('x-middleware-request-x-site-language'), lang);
  }
  assert.equal(new URL(proxy(request('/he/marita?utm_source=test')).headers.get('location')!).pathname, '/en/marita');
});

test('assets, API, payment returns and legal routes bypass language redirects', () => {
  for (const path of ['/api/schedule?show=zlata', '/api/payment/allpay-callback', '/payment/success?show=marita&lang=he', '/payment/return', '/ticket/validate', '/terms', '/privacy', '/admin', '/sitemap.xml', '/robots.txt', '/shows/zlata/files/poster.pdf', '/images/background1.png']) {
    assert.equal(proxy(request(path, 'he')).headers.get('location'), null, path);
  }
});

test('legacy domains retain permanent redirects and payment callback compatibility', () => {
  for (const slug of ['zlata', 'marita']) {
    const host = `ryba-kiva-${slug}.com`;
    const response = proxy(request('/?utm_source=old', 'he', undefined, host));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), `https://ryba-kiva.com/${slug}?utm_source=old`);
    assert.equal(proxy(request('/api/payment/allpay-callback', 'he', undefined, host)).headers.get('location'), null);
  }
});

test('sitemap contains all ten real language pages with reciprocal hreflang', () => {
  const entries = sitemap();
  assert.equal(entries.length, 10);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, 10);
  assert.ok(!entries.some((entry) => entry.url.includes('/he/marita') || entry.url.includes('/he/gefilte-lid')));
  assert.equal(languageAlternates('zlata').he, 'https://ryba-kiva.com/he/zlata');
  assert.equal(localizedPath('he', 'marita'), '/en/marita');
  for (const entry of entries) {
    const languages = entry.alternates?.languages ?? {};
    assert.ok(Object.values(languages).includes(entry.url));
    assert.ok(languages['x-default']);
  }
});

test('localized show URLs remain valid payment return destinations', () => {
  assert.equal(resolveSafeReturnUrl('/he/zlata?event=123', '/zlata'), 'https://ryba-kiva.com/he/zlata?event=123');
  assert.equal(resolveSafeReturnUrl('/en/marita?event=456', '/marita', { showSlug: 'marita' }), 'https://ryba-kiva.com/en/marita?event=456');
  assert.equal(resolveSafeReturnUrl('https://untrusted.example/en/marita', '/ru/marita'), 'https://ryba-kiva.com/ru/marita');
});
