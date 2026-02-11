'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { isShowSlug } from '@/shows';

type TicketView = {
  orderId: string;
  showSlug: string;
  eventId: string | null;
  buyerName: string | null;
  buyerEmail: string;
  qty: number;
  amount: number | null;
  currency: string | null;
  status: string;
  paidAt: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
  showTitle: { ru: string; en: string; he: string };
  eventDateTime: { ru: string; en: string; he: string };
  eventPlace: { ru: string; en: string; he: string };
  directionsUrl: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
}

export default function TicketValidateClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id')?.trim() ?? '';
  const ticketCode = searchParams.get('ticket')?.trim() ?? '';
  const showFromQuery = searchParams.get('show')?.trim() ?? '';

  const showPath = useMemo(() => {
    if (isShowSlug(showFromQuery)) return `/${showFromQuery}`;
    return '/zlata';
  }, [showFromQuery]);

  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ticket, setTicket] = useState<TicketView | null>(null);

  const loadTicket = async () => {
    if (!orderId || !ticketCode) {
      setErrorMessage('Некорректная ссылка билета.');
      setAuthChecked(true);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const sessionResponse = await fetch('/api/admin/schedule/session', { cache: 'no-store' });
      const session = (await sessionResponse.json()) as { ok?: boolean; authenticated?: boolean };
      const isAuthed = Boolean(session.ok && session.authenticated);
      setAuthenticated(isAuthed);
      setAuthChecked(true);

      if (!isAuthed) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/admin/ticket/validate?order_id=${encodeURIComponent(orderId)}&ticket=${encodeURIComponent(ticketCode)}`,
        { cache: 'no-store' }
      );
      const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string; ticket?: TicketView };

      if (!response.ok || !result.ok || !result.ticket) {
        setErrorMessage(`Не удалось загрузить билет.${result.reason ? ` ${result.reason}` : ''}`);
        return;
      }

      setTicket(result.ticket);
    } catch {
      setErrorMessage('Ошибка сети при загрузке билета.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked) {
      void loadTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    try {
      const response = await fetch('/api/admin/schedule/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const result = (await response.json()) as { ok?: boolean; reason?: string };
      if (!response.ok || !result.ok) {
        router.replace(showPath);
        return;
      }

      setAuthenticated(true);
      setPassword('');
      await loadTicket();
    } catch {
      setAuthError('Ошибка сети при входе.');
    }
  };

  const handleRedeem = async () => {
    if (!ticket) return;

    setRedeemLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/ticket/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId: ticket.orderId,
          ticketCode,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        alreadyRedeemed?: boolean;
        ticket?: TicketView;
      };

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok || !result.ok || !result.ticket) {
        setErrorMessage(`Не удалось погасить билет.${result.reason ? ` ${result.reason}` : ''}`);
        return;
      }

      setTicket(result.ticket);
      setSuccessMessage(result.alreadyRedeemed ? 'Билет уже был погашен ранее.' : 'Билет успешно погашен.');
    } catch {
      setErrorMessage('Ошибка сети при погашении билета.');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Валидация билета</h1>

        {loading && <p className="text-sm text-slate-600">Загрузка...</p>}
        {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}
        {successMessage && <p className="text-sm text-emerald-700">{successMessage}</p>}

        {ticket && (
          <section className="rounded-xl border border-slate-300 bg-white p-4 space-y-3">
            <p className="text-lg font-semibold">
              {ticket.showTitle.ru} | {ticket.showTitle.en} | <span dir="rtl">{ticket.showTitle.he}</span>
            </p>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <p><span className="font-medium">Код билета:</span> {ticketCode}</p>
              <p><span className="font-medium">Заказ:</span> {ticket.orderId}</p>
              <p><span className="font-medium">Дата и время:</span> {ticket.eventDateTime.ru}</p>
              <p><span className="font-medium">Место:</span> {ticket.eventPlace.ru}</p>
              <p><span className="font-medium">Покупатель:</span> {ticket.buyerName || '—'}</p>
              <p><span className="font-medium">Email:</span> {ticket.buyerEmail}</p>
              <p><span className="font-medium">Кол-во:</span> {ticket.qty}</p>
              <p><span className="font-medium">Сумма:</span> {ticket.amount ?? '—'} {ticket.currency || 'ILS'}</p>
              <p><span className="font-medium">Статус оплаты:</span> {ticket.status}</p>
              <p><span className="font-medium">Оплачен:</span> {formatDateTime(ticket.paidAt)}</p>
              <p><span className="font-medium">Погашен:</span> {formatDateTime(ticket.redeemedAt)}</p>
              <p><span className="font-medium">Кем погашен:</span> {ticket.redeemedBy || '—'}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleRedeem}
                disabled={redeemLoading || ticket.status !== 'paid' || Boolean(ticket.redeemedAt)}
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {redeemLoading ? 'Погашаем...' : ticket.redeemedAt ? 'Уже погашен' : 'Погасить билет'}
              </button>
              <button
                type="button"
                onClick={() => router.replace(showPath)}
                className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white"
              >
                На страницу спектакля
              </button>
            </div>
          </section>
        )}
      </div>

      {!authenticated && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-5">
            <h2 className="text-xl font-semibold">Доступ только для администратора</h2>
            <p className="mt-2 text-sm text-slate-300">Чтобы открыть данные билета, войдите под админ-логином.</p>

            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span>Логин</span>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span>Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                />
              </label>

              {authError && <p className="text-sm text-red-400">{authError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white">
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => router.replace(showPath)}
                  className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Я не админ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
