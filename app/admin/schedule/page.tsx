'use client';

import { useState } from 'react';

type SyncResult = {
  ok: boolean;
  text: string;
};

const SHOWS = [
  { slug: 'zlata', label: 'Козочка Злата' },
  { slug: 'marita', label: 'Колдовство Мариты' },
] as const;

export default function AdminSchedulePage() {
  const [secret, setSecret] = useState('');
  const [busyShow, setBusyShow] = useState<string | null>(null);
  const [resultByShow, setResultByShow] = useState<Record<string, SyncResult>>({});

  const syncSchedule = async (show: string) => {
    setBusyShow(show);
    try {
      const response = await fetch('/api/admin/schedule/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ show, secret }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        events?: number;
        refreshedAt?: string;
      };

      if (!response.ok || !result.ok) {
        const message =
          result.reason === 'unauthorized'
            ? 'Неверный пароль синхронизации.'
            : result.reason === 'sync_secret_not_configured'
              ? 'Переменная SCHEDULE_SYNC_SECRET не настроена в Vercel.'
              : `Не удалось обновить расписание.${result.message ? ` ${result.message}` : ''}`;
        setResultByShow((prev) => ({
          ...prev,
          [show]: { ok: false, text: message },
        }));
        return;
      }

      setResultByShow((prev) => ({
        ...prev,
        [show]: {
          ok: true,
          text: `Готово: ${result.events ?? 0} событий, обновлено ${result.refreshedAt ?? ''}`,
        },
      }));
    } catch {
      setResultByShow((prev) => ({
        ...prev,
        [show]: { ok: false, text: 'Ошибка сети при обновлении расписания.' },
      }));
    } finally {
      setBusyShow(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold">Обновление расписания из Google Таблиц</h1>
        <p className="mt-2 text-sm text-slate-700">
          1) Организатор добавляет даты в Google Таблицу. 2) Здесь нажимает кнопку «Обновить». 3) Афиша на сайте обновляется.
        </p>

        <div className="mt-6 rounded-xl border border-slate-300 bg-white p-4">
          <label className="block text-sm font-medium">Пароль синхронизации</label>
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Введите пароль"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div className="mt-6 space-y-4">
          {SHOWS.map((show) => {
            const result = resultByShow[show.slug];
            const busy = busyShow === show.slug;
            return (
              <section key={show.slug} className="rounded-xl border border-slate-300 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{show.label}</h2>
                  <button
                    type="button"
                    disabled={busy || !secret.trim()}
                    onClick={() => syncSchedule(show.slug)}
                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Обновляем...' : 'Обновить'}
                  </button>
                </div>
                {result && (
                  <p className={`mt-3 text-sm ${result.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.text}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
