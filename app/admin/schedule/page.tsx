'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { SHOWS, SHOW_SLUGS } from '@/shows';
import type { ShowSlug } from '@/shows/types';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

type EventRow = {
  show_slug: ShowSlug;
  event_id: string;
  date_iso: string;
  time: string;
  place_ru: string;
  place_en: string;
  place_he: string;
  waze_url: string | null;
  format_ru: string;
  language_ru: string;
  comment_ru?: string | null;
  comment_en?: string | null;
  comment_he?: string | null;
  price_ils: number | null;
  capacity: number | null;
  ticket_mode: 'self' | 'venue';
  ticket_url: string | null;
};

type TicketMode = 'self' | 'venue';
type ListShowFilter = 'all' | ShowSlug;
type DateFilter = 'current' | 'prev' | 'next' | 'all';

const SHOW_ITEMS = SHOW_SLUGS.map((slug) => ({
  slug,
  label: SHOWS[slug].content.ru?.title ?? slug,
})) as Array<{ slug: ShowSlug; label: string }>;

const TABLE_MIN_WIDTH = 1595;

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

function isPrivateFormat(formatRu: string): boolean {
  return formatRu.trim().toLowerCase() === 'закрытый показ';
}

export default function AdminSchedulePage() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [authMessage, setAuthMessage] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [selectedShow, setSelectedShow] = useState<ShowSlug>(SHOW_ITEMS[0]?.slug ?? 'zlata');
  const [listShowFilter, setListShowFilter] = useState<ListShowFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [listBusy, setListBusy] = useState(false);
  const [listMessage, setListMessage] = useState('');

  const [dateIso, setDateIso] = useState('');
  const [time, setTime] = useState('');
  const [placeRu, setPlaceRu] = useState('');
  const [placeEn, setPlaceEn] = useState('');
  const [placeHe, setPlaceHe] = useState('');
  const [wazeUrl, setWazeUrl] = useState('');
  const [formatRu, setFormatRu] = useState<(typeof FORMAT_OPTIONS)[number]>('Открытый показ');
  const [languageRu, setLanguageRu] = useState<(typeof LANGUAGE_OPTIONS)[number]>('Русский');
  const [commentRu, setCommentRu] = useState('');
  const [commentEn, setCommentEn] = useState('');
  const [commentHe, setCommentHe] = useState('');
  const [priceIls, setPriceIls] = useState('');
  const [capacity, setCapacity] = useState('');
  const [ticketMode, setTicketMode] = useState<TicketMode>('self');
  const [ticketUrl, setTicketUrl] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editShowSlug, setEditShowSlug] = useState<ShowSlug>(SHOW_ITEMS[0]?.slug ?? 'zlata');
  const [editEventId, setEditEventId] = useState('');
  const [editDateIso, setEditDateIso] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPlaceRu, setEditPlaceRu] = useState('');
  const [editPlaceEn, setEditPlaceEn] = useState('');
  const [editPlaceHe, setEditPlaceHe] = useState('');
  const [editWazeUrl, setEditWazeUrl] = useState('');
  const [editFormatRu, setEditFormatRu] = useState<(typeof FORMAT_OPTIONS)[number]>('Открытый показ');
  const [editLanguageRu, setEditLanguageRu] = useState<(typeof LANGUAGE_OPTIONS)[number]>('Русский');
  const [editCommentRu, setEditCommentRu] = useState('');
  const [editCommentEn, setEditCommentEn] = useState('');
  const [editCommentHe, setEditCommentHe] = useState('');
  const [editPriceIls, setEditPriceIls] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editTicketMode, setEditTicketMode] = useState<TicketMode>('self');
  const [editTicketUrl, setEditTicketUrl] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [deleteBusyKey, setDeleteBusyKey] = useState<string | null>(null);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const syncTableScroll = (source: 'top' | 'table') => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const top = topScrollRef.current;
    const table = tableScrollRef.current;
    if (top && table) {
      if (source === 'top') table.scrollLeft = top.scrollLeft;
      else top.scrollLeft = table.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  const derivedFormat = useMemo(() => FORMAT_MAP[formatRu], [formatRu]);
  const derivedLanguage = useMemo(() => LANGUAGE_MAP[languageRu], [languageRu]);
  const isPrivate = useMemo(() => isPrivateFormat(formatRu), [formatRu]);
  const editDerivedFormat = useMemo(() => FORMAT_MAP[editFormatRu], [editFormatRu]);
  const editDerivedLanguage = useMemo(() => LANGUAGE_MAP[editLanguageRu], [editLanguageRu]);
  const isEditPrivate = useMemo(() => isPrivateFormat(editFormatRu), [editFormatRu]);

  const refreshEvents = async () => {
    setListBusy(true);
    setListMessage('');
    try {
      const response = await fetch('/api/admin/schedule/events?show=all', { cache: 'no-store' });
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

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    const monthAllowed = (dateIso: string): boolean => {
      if (dateFilter === 'all') return true;
      const monthKey = dateIso.slice(0, 7);
      if (dateFilter === 'current') return monthKey === currentMonth;
      if (dateFilter === 'prev') return monthKey === prevMonth;
      return monthKey === nextMonth;
    };

    return events
      .filter((item) => listShowFilter === 'all' || item.show_slug === listShowFilter)
      .filter((item) => monthAllowed(item.date_iso))
      .sort((a, b) => {
        const aTs = Date.parse(`${a.date_iso}T${a.time}:00`);
        const bTs = Date.parse(`${b.date_iso}T${b.time}:00`);
        return bTs - aTs;
      });
  }, [events, listShowFilter, dateFilter]);

  const handleExportCsv = () => {
    const escapeCsv = (value: string): string => {
      if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const header = [
      'show_slug',
      'show_title',
      'event_id',
      'date_iso',
      'time',
      'place_ru',
      'waze_url',
      'format_ru',
      'language_ru',
      'comment_ru',
      'comment_en',
      'comment_he',
      'price_ils',
      'capacity',
      'ticket_mode',
      'ticket_url',
    ];

    const rows = filteredEvents.map((item) => [
      item.show_slug,
      SHOWS[item.show_slug].content.ru?.title ?? item.show_slug,
      item.event_id,
      item.date_iso,
      item.time,
      item.place_ru,
      item.waze_url ?? '',
      item.format_ru,
      item.language_ru,
      item.comment_ru ?? '',
      item.comment_en ?? '',
      item.comment_he ?? '',
      item.price_ils === null ? '' : String(item.price_ils),
      item.capacity === null ? '' : String(item.capacity),
      item.ticket_mode,
      item.ticket_url ?? '',
    ]);

    const csv = [header, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.href = url;
    link.download = `schedule-events-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      await refreshEvents();
    } catch {
      setAuthState('unauthenticated');
      setAuthMessage('Ошибка сети при проверке сессии.');
    }
  };

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setSaveMessage('');
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveBusy(true);
    setSaveMessage('');
    try {
      const effectiveTicketMode = isPrivate ? 'self' : ticketMode;
      const effectiveTicketUrl = isPrivate ? '' : ticketUrl;

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
          wazeUrl,
          formatRu,
          formatEn: derivedFormat.en,
          formatHe: derivedFormat.he,
          languageRu,
          languageEn: derivedLanguage.en,
          languageHe: derivedLanguage.he,
          commentRu,
          commentEn,
          commentHe,
          priceIls,
          capacity,
          ticketMode: effectiveTicketMode,
          ticketUrl: effectiveTicketUrl,
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
      setWazeUrl('');
      setCommentRu('');
      setCommentEn('');
      setCommentHe('');
      setPriceIls('');
      setCapacity('');
      setTicketMode('self');
      setTicketUrl('');
      setSaveMessage(`Событие сохранено: ${result.event?.event_id ?? ''}`);
      await refreshEvents();
    } catch {
      setSaveMessage('Ошибка сети при сохранении события.');
    } finally {
      setSaveBusy(false);
    }
  };

  const openEditModal = (item: EventRow) => {
    setEditShowSlug(item.show_slug);
    setEditEventId(item.event_id);
    setEditDateIso(item.date_iso);
    setEditTime(item.time);
    setEditPlaceRu(item.place_ru);
    setEditPlaceEn(item.place_en);
    setEditPlaceHe(item.place_he);
    setEditWazeUrl(item.waze_url ?? '');
    setEditFormatRu((item.format_ru as (typeof FORMAT_OPTIONS)[number]) ?? 'Открытый показ');
    setEditLanguageRu((item.language_ru as (typeof LANGUAGE_OPTIONS)[number]) ?? 'Русский');
    setEditCommentRu(item.comment_ru ?? '');
    setEditCommentEn(item.comment_en ?? '');
    setEditCommentHe(item.comment_he ?? '');
    setEditPriceIls(item.price_ils == null ? '' : String(item.price_ils));
    setEditCapacity(item.capacity == null ? '' : String(item.capacity));
    setEditTicketMode(item.ticket_mode);
    setEditTicketUrl(item.ticket_url ?? '');
    setEditMessage('');
    setEditOpen(true);
  };

  const closeEditModal = () => {
    if (editBusy) return;
    setEditOpen(false);
    setEditMessage('');
  };

  const handleEditSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setEditBusy(true);
    setEditMessage('');
    try {
      const effectiveTicketMode = isEditPrivate ? 'self' : editTicketMode;
      const effectiveTicketUrl = isEditPrivate ? '' : editTicketUrl;

      const response = await fetch('/api/admin/schedule/events', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          showSlug: editShowSlug,
          eventId: editEventId,
          dateIso: editDateIso,
          time: editTime,
          placeRu: editPlaceRu,
          placeEn: editPlaceEn,
          placeHe: editPlaceHe,
          wazeUrl: editWazeUrl,
          formatRu: editFormatRu,
          formatEn: editDerivedFormat.en,
          formatHe: editDerivedFormat.he,
          languageRu: editLanguageRu,
          languageEn: editDerivedLanguage.en,
          languageHe: editDerivedLanguage.he,
          commentRu: editCommentRu,
          commentEn: editCommentEn,
          commentHe: editCommentHe,
          priceIls: editPriceIls,
          capacity: editCapacity,
          ticketMode: effectiveTicketMode,
          ticketUrl: effectiveTicketUrl,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string };
      if (response.status === 401 || result.reason === 'unauthorized') {
        setAuthState('unauthenticated');
        setEditMessage('Сессия истекла. Войдите снова.');
        return;
      }
      if (!response.ok || !result.ok) {
        setEditMessage(`Ошибка сохранения: ${result.reason ?? 'update_failed'}.${result.message ? ` ${result.message}` : ''}`);
        return;
      }

      setEditOpen(false);
      setSaveMessage(`Событие обновлено: ${editEventId}`);
      await refreshEvents();
    } catch {
      setEditMessage('Ошибка сети при сохранении изменений.');
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async (item: EventRow) => {
    const showLabel = SHOWS[item.show_slug].content.ru?.title ?? item.show_slug;
    const ok = window.confirm(`Удалить событие "${showLabel}" (${item.date_iso} ${item.time}, ID: ${item.event_id})?`);
    if (!ok) return;

    const key = `${item.show_slug}:${item.event_id}`;
    setDeleteBusyKey(key);
    try {
      const response = await fetch(
        `/api/admin/schedule/events?showSlug=${encodeURIComponent(item.show_slug)}&eventId=${encodeURIComponent(item.event_id)}`,
        { method: 'DELETE' },
      );
      const result = (await response.json()) as { ok?: boolean; reason?: string; message?: string };
      if (response.status === 401 || result.reason === 'unauthorized') {
        setAuthState('unauthenticated');
        setSaveMessage('Сессия истекла. Войдите снова.');
        return;
      }
      if (!response.ok || !result.ok) {
        setSaveMessage(`Ошибка удаления: ${result.reason ?? 'delete_failed'}.${result.message ? ` ${result.message}` : ''}`);
        return;
      }
      setSaveMessage(`Событие удалено: ${item.event_id}`);
      await refreshEvents();
    } catch {
      setSaveMessage('Ошибка сети при удалении события.');
    } finally {
      setDeleteBusyKey(null);
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
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium">Место (RU)</span>
              <input value={placeRu} onChange={(e) => setPlaceRu(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Место (EN)</span>
              <input value={placeEn} onChange={(e) => setPlaceEn(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Место (HE)</span>
              <input value={placeHe} onChange={(e) => setPlaceHe(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <p className="text-xs text-slate-600">Достаточно заполнить хотя бы одно поле «Место». Остальные подтянутся автоматически.</p>

          <label className="block text-sm">
            <span className="font-medium">Ссылка на Вэйз (опционально)</span>
            <input
              type="url"
              value={wazeUrl}
              onChange={(e) => setWazeUrl(e.target.value)}
              placeholder="https://waze.com/..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="space-y-2 rounded-lg border border-slate-300 p-3">
            <p className="text-sm font-medium">Комментарий (опционально)</p>
            <p className="text-xs text-slate-600">Показывается на публичной странице вместо поля «Формат». Если пусто, используется формат показа.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block text-sm">
                <span className="font-medium">Комментарий (RU)</span>
                <input value={commentRu} onChange={(e) => setCommentRu(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Комментарий (EN)</span>
                <input value={commentEn} onChange={(e) => setCommentEn(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Комментарий (HE)</span>
                <input value={commentHe} onChange={(e) => setCommentHe(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </div>

          {!isPrivate && (
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
              <div className="grid gap-3 md:grid-cols-2">
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
          )}

          <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
            <p>Формат EN/HE: {derivedFormat.en} | {derivedFormat.he}</p>
            <p>Язык EN/HE: {derivedLanguage.en} | {derivedLanguage.he}</p>
          </div>

          <button type="submit" disabled={saveBusy} className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saveBusy ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {saveMessage && (
            <p
              className={`text-sm ${
                saveMessage.startsWith('Событие сохранено') ||
                saveMessage.startsWith('Событие обновлено') ||
                saveMessage.startsWith('Событие удалено')
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }`}
            >
              {saveMessage}
            </p>
          )}
        </form>

        <section className="rounded-xl border border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Все события</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={listShowFilter}
                onChange={(e) => setListShowFilter(e.target.value as ListShowFilter)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
              >
                <option value="all">Все спектакли</option>
                {SHOW_ITEMS.map((show) => (
                  <option key={show.slug} value={show.slug}>
                    {show.label}
                  </option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
              >
                <option value="current">Текущий месяц</option>
                <option value="prev">Прошлый месяц</option>
                <option value="next">Следующий месяц</option>
                <option value="all">Все даты</option>
              </select>
              <button type="button" onClick={handleExportCsv} className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
                Скачать CSV
              </button>
              <button type="button" onClick={() => refreshEvents()} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                Обновить список
              </button>
            </div>
          </div>
          {listBusy ? (
            <p className="mt-3 text-sm text-slate-600">Загрузка...</p>
          ) : listMessage ? (
            <p className="mt-3 text-sm text-red-700">{listMessage}</p>
          ) : filteredEvents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Пока нет событий.</p>
          ) : (
            <>
              <div className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span>Если часть таблицы не видна, прокрутите влево/вправо.</span>
                <span className="font-semibold text-slate-700">⇄ Горизонтальный скролл (сверху и снизу)</span>
              </div>
              <div className="mt-3 flex flex-col gap-0 overflow-hidden rounded-lg border border-slate-200">
                <div
                  ref={topScrollRef}
                  className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50"
                  style={{ height: 20 }}
                  onScroll={() => syncTableScroll('top')}
                >
                  <div className="h-px" style={{ minWidth: TABLE_MIN_WIDTH }} aria-hidden />
                </div>
                <div
                  ref={tableScrollRef}
                  className="relative overflow-x-auto overflow-y-auto"
                  onScroll={() => syncTableScroll('table')}
                >
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-slate-100 to-transparent" />
                  <table className="table-fixed text-sm" style={{ minWidth: TABLE_MIN_WIDTH }}>
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="sticky left-0 z-20 w-[170px] min-w-[170px] bg-slate-100 px-2 py-2">Спектакль</th>
                    <th className="sticky left-[170px] z-20 w-[170px] min-w-[170px] bg-slate-100 px-2 py-2">ID</th>
                    <th className="sticky left-[340px] z-20 w-[100px] min-w-[100px] bg-slate-100 px-2 py-2">Дата</th>
                    <th className="sticky left-[440px] z-20 w-[90px] min-w-[90px] bg-slate-100 px-2 py-2 border-r-4 border-slate-500 shadow-[8px_0_10px_-8px_rgba(15,23,42,0.55)]">
                      Время
                    </th>
                    <th className="w-[340px] min-w-[340px] max-w-[340px] px-2 py-2">Место (RU)</th>
                    <th className="w-[70px] min-w-[70px] px-2 py-2">Вэйз</th>
                    <th className="w-[120px] min-w-[120px] px-2 py-2">Формат</th>
                    <th className="w-[90px] min-w-[90px] px-2 py-2">Язык</th>
                    <th className="w-[80px] min-w-[80px] px-2 py-2">Цена</th>
                    <th className="w-[80px] min-w-[80px] px-2 py-2">Места</th>
                    <th className="w-[95px] min-w-[95px] px-2 py-2">Продажа</th>
                    <th className="w-[210px] min-w-[210px] px-2 py-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((item) => (
                    <tr key={`${item.show_slug}:${item.event_id}`} className="border-t border-slate-200">
                      <td className="sticky left-0 z-10 w-[170px] min-w-[170px] bg-white px-2 py-2">{SHOWS[item.show_slug].content.ru?.title ?? item.show_slug}</td>
                      <td className="sticky left-[170px] z-10 w-[170px] min-w-[170px] bg-white px-2 py-2">{item.event_id}</td>
                      <td className="sticky left-[340px] z-10 w-[100px] min-w-[100px] bg-white px-2 py-2">{item.date_iso}</td>
                      <td className="sticky left-[440px] z-10 w-[90px] min-w-[90px] bg-white px-2 py-2 border-r-4 border-slate-300 shadow-[8px_0_10px_-8px_rgba(15,23,42,0.35)]">
                        {item.time}
                      </td>
                      <td className="w-[340px] min-w-[340px] max-w-[340px] px-2 py-2">
                        <div className="whitespace-normal break-words">{item.place_ru}</div>
                      </td>
                      <td className="w-[70px] min-w-[70px] px-2 py-2">{item.waze_url ? 'Есть' : '—'}</td>
                      <td className="w-[120px] min-w-[120px] px-2 py-2">{item.format_ru}</td>
                      <td className="w-[90px] min-w-[90px] px-2 py-2">{item.language_ru}</td>
                      <td className="w-[80px] min-w-[80px] px-2 py-2">{typeof item.price_ils === 'number' ? `₪ ${item.price_ils}` : '—'}</td>
                      <td className="w-[80px] min-w-[80px] px-2 py-2">{item.capacity ?? '∞'}</td>
                      <td className="w-[95px] min-w-[95px] px-2 py-2">{item.ticket_mode === 'venue' ? 'Площадка' : 'Сайт'}</td>
                      <td className="w-[210px] min-w-[210px] px-2 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deleteBusyKey === `${item.show_slug}:${item.event_id}`}
                            className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {deleteBusyKey === `${item.show_slug}:${item.event_id}` ? 'Удаляем...' : 'Удалить'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-300 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Редактирование события</h3>
              <button type="button" onClick={closeEditModal} className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
                Закрыть
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <p className="text-xs text-slate-600">ID события: {editEventId}</p>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Спектакль</span>
                  <select
                    value={editShowSlug}
                    onChange={(e) => setEditShowSlug(e.target.value as ShowSlug)}
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
                  <input
                    type="date"
                    value={editDateIso}
                    onChange={(e) => setEditDateIso(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Время</span>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Формат (RU)</span>
                  <select
                    value={editFormatRu}
                    onChange={(e) => setEditFormatRu(e.target.value as (typeof FORMAT_OPTIONS)[number])}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {FORMAT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Язык (RU)</span>
                  <select
                    value={editLanguageRu}
                    onChange={(e) => setEditLanguageRu(e.target.value as (typeof LANGUAGE_OPTIONS)[number])}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="font-medium">Место (RU)</span>
                  <input value={editPlaceRu} onChange={(e) => setEditPlaceRu(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Место (EN)</span>
                  <input value={editPlaceEn} onChange={(e) => setEditPlaceEn(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Место (HE)</span>
                  <input value={editPlaceHe} onChange={(e) => setEditPlaceHe(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <p className="text-xs text-slate-600">Достаточно заполнить хотя бы одно поле «Место». Остальные подтянутся автоматически.</p>

              <label className="block text-sm">
                <span className="font-medium">Ссылка на Вэйз (опционально)</span>
                <input
                  type="url"
                  value={editWazeUrl}
                  onChange={(e) => setEditWazeUrl(e.target.value)}
                  placeholder="https://waze.com/..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="space-y-2 rounded-lg border border-slate-300 p-3">
                <p className="text-sm font-medium">Комментарий (опционально)</p>
                <p className="text-xs text-slate-600">Показывается на публичной странице вместо поля «Формат». Если пусто, используется формат показа.</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block text-sm">
                    <span className="font-medium">Комментарий (RU)</span>
                    <input value={editCommentRu} onChange={(e) => setEditCommentRu(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium">Комментарий (EN)</span>
                    <input value={editCommentEn} onChange={(e) => setEditCommentEn(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium">Комментарий (HE)</span>
                    <input value={editCommentHe} onChange={(e) => setEditCommentHe(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                </div>
              </div>

              {!isEditPrivate && (
                <div className="space-y-2 rounded-lg border border-slate-300 p-3">
                  <p className="text-sm font-medium">Продажа билетов</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="editTicketMode" checked={editTicketMode === 'self'} onChange={() => setEditTicketMode('self')} />
                    Мы продаём (через сайт)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="editTicketMode" checked={editTicketMode === 'venue'} onChange={() => setEditTicketMode('venue')} />
                    Площадка продаёт (внешняя ссылка)
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="font-medium">Стоимость (ILS)</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={editPriceIls}
                        onChange={(e) => setEditPriceIls(e.target.value)}
                        required
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Кол-во мест (опционально)</span>
                      <input
                        type="number"
                        min="1"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                  </div>
                  {editTicketMode === 'venue' && (
                    <label className="block text-sm">
                      <span className="font-medium">Ссылка на покупку у площадки</span>
                      <input
                        type="url"
                        value={editTicketUrl}
                        onChange={(e) => setEditTicketUrl(e.target.value)}
                        required
                        placeholder="https://..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
                <p>Формат EN/HE: {editDerivedFormat.en} | {editDerivedFormat.he}</p>
                <p>Язык EN/HE: {editDerivedLanguage.en} | {editDerivedLanguage.he}</p>
              </div>

              <div className="flex items-center gap-2">
                <button type="submit" disabled={editBusy} className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {editBusy ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button type="button" onClick={closeEditModal} className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-900">
                  Отмена
                </button>
              </div>
              {editMessage && <p className="text-sm text-red-700">{editMessage}</p>}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
