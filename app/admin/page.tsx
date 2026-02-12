'use client';

import { useEffect, useMemo, useState } from 'react';

import { SHOWS, SHOW_SLUGS } from '@/shows';
import type { ShowSlug } from '@/shows/types';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

type EventRow = {
  show_slug: ShowSlug;
  event_id: string;
  date_iso: string;
  time: string;
  place_ru: string;
  format_ru: string;
};

const SHOW_ITEMS = SHOW_SLUGS.map((slug) => ({
  slug,
  label: SHOWS[slug].content.ru?.title ?? slug,
})) as Array<{ slug: ShowSlug; label: string }>;

export default function AdminHomePage() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [authMessage, setAuthMessage] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [selectedShow, setSelectedShow] = useState<ShowSlug>(SHOW_ITEMS[0]?.slug ?? 'zlata');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [events, setEvents] = useState<EventRow[]>([]);

  const [buyerName, setBuyerName] = useState('Ticket Test');
  const [buyerEmail, setBuyerEmail] = useState('test@example.com');
  const [qty, setQty] = useState('1');
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');
  const [freeTicketOpen, setFreeTicketOpen] = useState(false);

  const showEvents = useMemo(
    () => events.filter((event) => event.show_slug === selectedShow),
    [events, selectedShow]
  );

  useEffect(() => {
    if (!selectedEventId && showEvents.length > 0) {
      setSelectedEventId(showEvents[0].event_id);
    }
    if (selectedEventId && !showEvents.some((event) => event.event_id === selectedEventId)) {
      setSelectedEventId(showEvents[0]?.event_id ?? '');
    }
  }, [showEvents, selectedEventId]);

  const refreshEvents = async () => {
    const response = await fetch('/api/admin/schedule/events?show=all', { cache: 'no-store' });
    const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string; events?: EventRow[] };
    if (response.status === 401 || result.reason === 'unauthorized') {
      setAuthState('unauthenticated');
      setEvents([]);
      return;
    }
    if (!response.ok || !result.ok) {
      setGenerateMessage(`Не удалось загрузить события.${result.message ? ` ${result.message}` : ''}`);
      setEvents([]);
      return;
    }
    setEvents(Array.isArray(result.events) ? result.events : []);
  };

  const checkSession = async () => {
    setAuthState('loading');
    try {
      const response = await fetch('/api/admin/schedule/session', { cache: 'no-store' });
      const result = (await response.json()) as { ok?: boolean; reason?: string; authenticated?: boolean };
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
      await refreshEvents();
    } catch {
      setAuthState('unauthenticated');
      setAuthMessage('Ошибка сети при проверке сессии.');
    }
  };

  useEffect(() => {
    void checkSession();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage('');

    try {
      const response = await fetch('/api/admin/schedule/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: loginInput, password: passwordInput }),
      });

      const result = (await response.json()) as { ok?: boolean; reason?: string };
      if (!response.ok || !result.ok) {
        setAuthMessage(
          result.reason === 'invalid_credentials'
            ? 'Неверный логин или пароль.'
            : 'Не удалось выполнить вход.'
        );
        return;
      }

      setPasswordInput('');
      setAuthState('authenticated');
      await refreshEvents();
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
      setGenerateMessage('');
    }
  };

  const requestFreeTicket = async (action: 'issue' | 'download') => {
    setGenerateBusy(true);
    setGenerateMessage('');

    try {
      const response = await fetch('/api/admin/ticket/test-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          showSlug: selectedShow,
          eventId: selectedEventId,
          buyerName,
          buyerEmail,
          qty: Number.parseInt(qty, 10) || 1,
          action,
        }),
      });

      if (response.status === 401) {
        setAuthState('unauthenticated');
        setGenerateMessage('Сессия истекла. Войдите снова.');
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (action === 'download' && response.ok && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.href = objectUrl;
        link.download = `free-ticket-${selectedShow}-${selectedEventId}-${stamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        setGenerateMessage('PDF бесплатного билета скачан.');
        return;
      }

      const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string; email?: string };
      if (!response.ok || !result.ok) {
        setGenerateMessage(`Ошибка: ${result.reason ?? 'request_failed'}.${result.message ? ` ${result.message}` : ''}`);
        return;
      }

      if (action === 'issue') {
        setGenerateMessage(`Бесплатный билет выдан и отправлен на ${result.email ?? buyerEmail}.`);
      } else {
        setGenerateMessage('Бесплатный билет создан.');
      }
    } catch {
      setGenerateMessage('Ошибка сети при работе с бесплатным билетом.');
    } finally {
      setGenerateBusy(false);
    }
  };

  const handleGenerateTestTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    await requestFreeTicket('issue');
  };

  if (authState !== 'authenticated') {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="mt-2 text-sm text-slate-700">Войдите, чтобы работать с билетами и расписанием.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-3 rounded-xl border border-slate-300 bg-white p-4">
            <label className="block text-sm">
              <span className="font-medium">Логин</span>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Пароль</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
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
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Выйти
          </button>
        </div>

        <section className="rounded-xl border border-slate-300 bg-white">
          <button
            type="button"
            onClick={() => setFreeTicketOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-lg font-semibold">Бесплатный билет</span>
            <span className="text-sm text-slate-600">{freeTicketOpen ? 'Свернуть' : 'Развернуть'}</span>
          </button>

          {freeTicketOpen && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm text-slate-700">
                Выдает гостю бесплатный билет (0 ILS), отправляет обычное подтверждение на email и позволяет скачать PDF по кнопке.
              </p>

              <form onSubmit={handleGenerateTestTicket} className="grid gap-3 md:grid-cols-2">
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
              <span className="font-medium">Событие</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {showEvents.length === 0 ? (
                  <option value="">Нет событий</option>
                ) : (
                  showEvents.map((eventRow) => (
                    <option key={eventRow.event_id} value={eventRow.event_id}>
                      {eventRow.date_iso} {eventRow.time} | {eventRow.event_id}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium">Имя покупателя</span>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Email покупателя</span>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="font-medium">Количество</span>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={generateBusy || !selectedEventId}
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {generateBusy ? 'Обрабатываем...' : 'Выдать бесплатный билет'}
              </button>
              <button
                type="button"
                onClick={() => void requestFreeTicket('download')}
                disabled={generateBusy || !selectedEventId}
                className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Скачать PDF
              </button>
              <a href="/admin/schedule" className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white">
                Перейти к расписанию
              </a>
            </div>
          </form>

          {generateMessage && (
            <p className={`text-sm ${
              generateMessage.startsWith('Бесплатный билет') || generateMessage.startsWith('PDF')
                ? 'text-emerald-700'
                : 'text-red-700'
            }`}>
              {generateMessage}
            </p>
          )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
