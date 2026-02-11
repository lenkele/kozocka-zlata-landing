'use client';

import { useEffect, useMemo, useState } from 'react';

import { SHOWS, SHOW_SLUGS } from '@/shows';
import type { ShowSlug } from '@/shows/types';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

type EventRow = {
  event_id: string;
  date_iso: string;
  time: string;
  place_ru: string;
  format_ru: string;
  language_ru: string;
  price_ils: number;
  capacity: number | null;
  ticket_mode: 'self' | 'venue';
  ticket_url: string | null;
};

type TicketMode = 'self' | 'venue';

const SHOW_ITEMS = SHOW_SLUGS.map((slug) => ({
  slug,
  label: SHOWS[slug].content.ru?.title ?? slug,
})) as Array<{ slug: ShowSlug; label: string }>;

const FORMAT_OPTIONS = ['Открытый показ', 'Закрытый показ'] as const;
const LANGUAGE_OPTIONS = ['Русский', 'Иврит', 'Английский'] as const;

const FORMAT_MAP: Record<string, { en: string; he: string }> = {
  'Открытый показ': { en: 'Public performance', he: 'מופע פתוח' },
  'Закрытый показ': { en: 'Private performance', he: 'מופע סגור' },
};

const LANGUAGE_MAP: Record<string, { en: string; he: string }> = {
  Русский: { en: 'Russian', he: 'רוסית' },
  Иврит: { en: 'Hebrew', he: 'עברית' },
  Английский: { en: 'English', he: 'אנגלית' },
};

export default function AdminSchedulePage() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [authMessage, setAuthMessage] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [selectedShow, setSelectedShow] = useState<ShowSlug>(SHOW_ITEMS[0]?.slug ?? 'zlata');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [listBusy, setListBusy] = useState(false);
  const [listMessage, setListMessage] = useState('');

  const [dateIso, setDateIso] = useState('');
  const [time, setTime] = useState('');
  const [placeRu, setPlaceRu] = useState('');
  const [placeEn, setPlaceEn] = useState('');
  const [placeHe, setPlaceHe] = useState('');
  const [formatRu, setFormatRu] = useState<(typeof FORMAT_OPTIONS)[number]>('Открытый показ');
  const [languageRu, setLanguageRu] = useState<(typeof LANGUAGE_OPTIONS)[number]>('Русский');
  const [priceIls, setPriceIls] = useState('');
  const [capacity, setCapacity] = useState('');
  const [ticketMode, setTicketMode] = useState<TicketMode>('self');
  const [ticketUrl, setTicketUrl] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const derivedFormat = useMemo(() => FORMAT_MAP[formatRu], [formatRu]);
  const derivedLanguage = useMemo(() => LANGUAGE_MAP[languageRu], [languageRu]);

  const refreshEvents = async (showSlug: ShowSlug) => {
    setListBusy(true);
    setListMessage('');
    try {
      const response = await fetch(`/api/admin/schedule/events?show=${encodeURIComponent(showSlug)}`, { cache: 'no-store' });
      const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string; events?: EventRow[] };
      if (response.status === 401 || result.reason === 'unauthorized') {
        setAuthState('unauthenticated');
        setEvents([]);
        setListMessage('');
        return;
      }
      if (!response.ok || !result.ok) {
        setEvents([]);
        setListMessage(`Не удалось загрузить события.${result.message ? ` ${result.message}` : ''}`);
        return;
      }
      setEvents(Array.isArray(result.events) ? result.events : []);
    } catch {
      setEvents([]);
      setListMessage('Ошибка сети при загрузке расписания.');
    } finally {
      setListBusy(false);
    }
  };

  const checkSession = async () => {
    setAuthState('loading');
    try {
      const response = await fetch('/api/admin/schedule/session', { cache: 'no-store' });
      const result = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        authenticated?: boolean;
      };
      if (!response.ok || !result.ok) {
        if (result.reason === 'admin_credentials_not_configured') {
          setAuthState('unauthenticated');
          setAuthMessage('Не настроены ADMIN_SCHEDULE_LOGIN / ADMIN_SCHEDULE_PASSWORD в Vercel.');
          return;
        }
        setAuthState('unauthenticated');
        setAuthMessage('Не удалось проверить сессию администратора.');
        return;
      }
      if (!result.authenticated) {
        setAuthState('unauthenticated');
        return;
      }
      setAuthState('authenticated');
      await refreshEvents(selectedShow);
    } catch {
      setAuthState('unauthenticated');
      setAuthMessage('Ошибка сети при проверке сессии.');
    }
  };

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authState === 'authenticated') {
      refreshEvents(selectedShow);
    }
  }, [selectedShow, authState]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage('');
    try {
      const response = await fetch('/api/admin/schedule/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          login: loginInput,
          password: passwordInput,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; reason?: string };
      if (!response.ok || !result.ok) {
        const message =
          result.reason === 'invalid_credentials'
            ? 'Неверный логин или пароль.'
            : result.reason === 'admin_credentials_not_configured'
              ? 'Не настроены ADMIN_SCHEDULE_LOGIN / ADMIN_SCHEDULE_PASSWORD в Vercel.'
              : 'Не удалось выполнить вход.';
        setAuthMessage(message);
        return;
      }
      setPasswordInput('');
      setAuthState('authenticated');
      await refreshEvents(selectedShow);
    } catch {
      setAuthMessage('Ошибка сети при входе.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/schedule/logout', { method: 'POST' });
    } finally {
      setAuthState('unauthenticated');
      setEvents([]);
      setSaveMessage('');
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveBusy(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/admin/schedule/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          showSlug: selectedShow,
          dateIso,
          time,
          placeRu,
          placeEn,
          placeHe,
          formatRu,
          formatEn: derivedFormat.en,
          formatHe: derivedFormat.he,
          languageRu,
          languageEn: derivedLanguage.en,
          languageHe: derivedLanguage.he,
          priceIls,
          capacity,
          ticketMode,
          ticketUrl,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string; event?: EventRow | null };
      if (response.status === 401 || result.reason === 'unauthorized') {
        setAuthState('unauthenticated');
        setSaveMessage('Сессия истекла. Войдите снова.');
        return;
      }
      if (!response.ok || !result.ok) {
        const reasonText = result.reason ?? 'save_failed';
        const detail = result.message ? ` ${result.message}` : '';
        setSaveMessage(`Ошибка сохранения: ${reasonText}.${detail}`);
        return;
      }

      setDateIso('');
      setTime('');
      setPlaceRu('');
      setPlaceEn('');
      setPlaceHe('');
      setPriceIls('');
      setCapacity('');
      setTicketMode('self');
      setTicketUrl('');
      setSaveMessage(`Событие сохранено: ${result.event?.event_id ?? ''}`);
      await refreshEvents(selectedShow);
    } catch {
      setSaveMessage('Ошибка сети при сохранении события.');
    } finally {
      setSaveBusy(false);
    }
  };

  if (authState !== 'authenticated') {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-2xl font-bold">Админка расписания</h1>
          <p className="mt-2 text-sm text-slate-700">Войдите, чтобы редактировать расписание спектаклей.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-3 rounded-xl border border-slate-300 bg-white p-4">
            <label className="block text-sm">
              <span className="font-medium">Логин</span>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Пароль</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </label>
            <button
              type="submit"
              disabled={authBusy || authState === 'loading'}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {authBusy || authState === 'loading' ? 'Входим...' : 'Войти'}
            </button>
            {authMessage && <p className="text-sm text-red-700">{authMessage}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Управление расписанием</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Выйти
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-slate-300 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Спектакль</span>
              <select
                value={selectedShow}
                onChange={(e) => setSelectedShow(e.target.value as ShowSlug)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {SHOW_ITEMS.map((show) => (
                  <option key={show.slug} value={show.slug}>
                    {show.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Дата</span>
              <input type="date" value={dateIso} onChange={(e) => setDateIso(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Время</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Стоимость (ILS)</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={priceIls}
                onChange={(e) => setPriceIls(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Формат (RU)</span>
              <select value={formatRu} onChange={(e) => setFormatRu(e.target.value as (typeof FORMAT_OPTIONS)[number])} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Язык (RU)</span>
              <select value={languageRu} onChange={(e) => setLanguageRu(e.target.value as (typeof LANGUAGE_OPTIONS)[number])} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Кол-во мест (опционально)</span>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium">Место (RU)</span>
              <input value={placeRu} onChange={(e) => setPlaceRu(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Место (EN)</span>
              <input value={placeEn} onChange={(e) => setPlaceEn(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Место (HE)</span>
              <input value={placeHe} onChange={(e) => setPlaceHe(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-300 p-3">
            <p className="text-sm font-medium">Продажа билетов</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="ticketMode" checked={ticketMode === 'self'} onChange={() => setTicketMode('self')} />
              Мы продаём (через сайт)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="ticketMode" checked={ticketMode === 'venue'} onChange={() => setTicketMode('venue')} />
              Площадка продаёт (внешняя ссылка)
            </label>
            {ticketMode === 'venue' && (
              <label className="block text-sm">
                <span className="font-medium">Ссылка на покупку у площадки</span>
                <input
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  required
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            )}
          </div>

          <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
            <p>Формат EN/HE: {derivedFormat.en} | {derivedFormat.he}</p>
            <p>Язык EN/HE: {derivedLanguage.en} | {derivedLanguage.he}</p>
          </div>

          <button type="submit" disabled={saveBusy} className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saveBusy ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {saveMessage && <p className={`text-sm ${saveMessage.startsWith('Событие сохранено') ? 'text-emerald-700' : 'text-red-700'}`}>{saveMessage}</p>}
        </form>

        <section className="rounded-xl border border-slate-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Текущие события ({SHOWS[selectedShow].content.ru?.title ?? selectedShow})</h2>
            <button type="button" onClick={() => refreshEvents(selectedShow)} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
              Обновить список
            </button>
          </div>
          {listBusy ? (
            <p className="mt-3 text-sm text-slate-600">Загрузка...</p>
          ) : listMessage ? (
            <p className="mt-3 text-sm text-red-700">{listMessage}</p>
          ) : events.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Пока нет событий.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-2 py-2">ID</th>
                    <th className="px-2 py-2">Дата</th>
                    <th className="px-2 py-2">Время</th>
                    <th className="px-2 py-2">Место (RU)</th>
                    <th className="px-2 py-2">Формат</th>
                    <th className="px-2 py-2">Язык</th>
                    <th className="px-2 py-2">Цена</th>
                    <th className="px-2 py-2">Места</th>
                    <th className="px-2 py-2">Продажа</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((item) => (
                    <tr key={item.event_id} className="border-t border-slate-200">
                      <td className="px-2 py-2">{item.event_id}</td>
                      <td className="px-2 py-2">{item.date_iso}</td>
                      <td className="px-2 py-2">{item.time}</td>
                      <td className="px-2 py-2">{item.place_ru}</td>
                      <td className="px-2 py-2">{item.format_ru}</td>
                      <td className="px-2 py-2">{item.language_ru}</td>
                      <td className="px-2 py-2">₪ {item.price_ils}</td>
                      <td className="px-2 py-2">{item.capacity ?? '∞'}</td>
                      <td className="px-2 py-2">{item.ticket_mode === 'venue' ? 'Площадка' : 'Сайт'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
