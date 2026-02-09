'use client';

import Image from 'next/image';
import yaml from 'js-yaml';
import React, { useEffect, useMemo, useState } from 'react';

import { type Lang, type ShowConfig } from '@/shows/types';

type ScheduleDisplayEntry = {
  id: string;
  date: string;
  dateIso: string;
  time: string;
  place: string;
  format: string;
  language: string;
};

type ScheduleYaml = {
  schedule: {
    id: string;
    date_iso: string;
    entries: Partial<
      Record<
        Lang,
        {
          time: string;
          place: string;
          format: string;
          language: string;
          date_text?: string;
        }
      >
    >;
  }[];
};

type CheckoutLabels = {
  buyButton: string;
  buyColumn: string;
  modalTitle: string;
  eventLabel: string;
  nameLabel: string;
  emailLabel: string;
  qtyLabel: string;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  unavailableLabel: string;
  closedShowLabel: string;
  createErrorLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
};

const CHECKOUT_LABELS: Record<Lang, CheckoutLabels> = {
  ru: {
    buyButton: 'Купить билет',
    buyColumn: 'Билеты',
    modalTitle: 'Оформление билета',
    eventLabel: 'Событие',
    nameLabel: 'Имя',
    emailLabel: 'Email',
    qtyLabel: 'Количество',
    submitLabel: 'Перейти к оплате',
    submittingLabel: 'Создаём оплату...',
    cancelLabel: 'Отмена',
    unavailableLabel: 'Недоступно',
    closedShowLabel: 'Для закрытых показов покупка недоступна',
    createErrorLabel: 'Не удалось создать оплату. Попробуйте ещё раз.',
    namePlaceholder: 'Ваше имя',
    emailPlaceholder: 'you@example.com',
  },
  he: {
    buyButton: 'קניית כרטיס',
    buyColumn: 'כרטיסים',
    modalTitle: 'רכישת כרטיס',
    eventLabel: 'אירוע',
    nameLabel: 'שם',
    emailLabel: 'אימייל',
    qtyLabel: 'כמות',
    submitLabel: 'מעבר לתשלום',
    submittingLabel: 'יוצרים תשלום...',
    cancelLabel: 'ביטול',
    unavailableLabel: 'לא זמין',
    closedShowLabel: 'אין רכישה למופעים סגורים',
    createErrorLabel: 'לא הצלחנו ליצור תשלום. נסו שוב.',
    namePlaceholder: 'השם שלך',
    emailPlaceholder: 'you@example.com',
  },
  en: {
    buyButton: 'Buy ticket',
    buyColumn: 'Tickets',
    modalTitle: 'Ticket checkout',
    eventLabel: 'Event',
    nameLabel: 'Name',
    emailLabel: 'Email',
    qtyLabel: 'Quantity',
    submitLabel: 'Proceed to payment',
    submittingLabel: 'Creating payment...',
    cancelLabel: 'Cancel',
    unavailableLabel: 'Unavailable',
    closedShowLabel: 'Ticket purchase is unavailable for closed shows',
    createErrorLabel: 'Could not create payment. Please try again.',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'you@example.com',
  },
};

function isClosedShow(format: string): boolean {
  const normalized = format.toLowerCase();
  return normalized.includes('закрыт') || normalized.includes('סגור') || normalized.includes('private');
}

export default function ShowLandingClient({ show }: { show: ShowConfig }) {
  // Определяем доступные языки для спектакля (по умолчанию все)
  const availableLanguages: Lang[] = show.availableLanguages ?? ['ru', 'he', 'en'];
  const defaultLang = availableLanguages.includes('ru') ? 'ru' : availableLanguages[0];

  const [lang, setLang] = useState<Lang>(defaultLang);
  const [scheduleData, setScheduleData] = useState<ScheduleDisplayEntry[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<ScheduleDisplayEntry | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [ticketQty, setTicketQty] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Используем контент для текущего языка или fallback на дефолтный
  const t = show.content[lang] ?? show.content[defaultLang]!;
  const checkoutT = CHECKOUT_LABELS[lang] ?? CHECKOUT_LABELS.ru;

  // Цвета кнопок (по умолчанию янтарные)
  const buttonBg = show.buttonColors?.bg ?? 'bg-amber-600';
  const buttonHover = show.buttonColors?.hover ?? 'hover:bg-amber-500';
  const buttonText = show.buttonColors?.text ?? 'text-white';
  const textColor = show.textColor ?? 'text-amber-50';
  const cardBg = show.cardBg ?? 'bg-[rgba(0,0,0,0.35)]';
  const darkCardBg = show.darkCardBg ?? 'bg-[rgba(0,0,0,0.35)]';
  const headerBg = show.headerBg ?? 'bg-[rgba(32,20,12,0.96)]';
  const headingColor = show.headingColor ?? 'text-amber-100';

  const whatsappLink = useMemo(() => {
    const message = show.whatsappMessages[lang] ?? show.whatsappMessages[defaultLang];
    return show.whatsappLinkBase + encodeURIComponent(message ?? '');
  }, [lang, defaultLang, show.whatsappLinkBase, show.whatsappMessages]);

  const changeLang = (newLang: Lang) => {
    // Проверяем, что язык доступен для этого спектакля
    if (!availableLanguages.includes(newLang)) return;
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLang', newLang);
    }
  };

  const isRTL = lang === 'he';
  const badgeSpacingClass = isRTL ? 'mr-2' : 'ml-2';
  const textDirectionClass = isRTL ? 'text-right' : '';
  const scheduleAlignClass = isRTL ? 'text-right' : 'text-left';

  useEffect(() => {
    const preferred = detectBrowserLanguage();
    // Устанавливаем предпочитаемый язык только если он доступен
    if (availableLanguages.includes(preferred)) {
      setLang(preferred);
    }
  }, [availableLanguages]);

  useEffect(() => {
    let isMounted = true;
    setScheduleLoading(true);

    const loadSchedule = async () => {
      try {
        const response = await fetch(show.scheduleFilePath);
        if (!response.ok) throw new Error('Failed to load schedule');
        const text = await response.text();
        const parsed = yaml.load(text) as ScheduleYaml;
        const schedule = parseScheduleData(parsed, lang);

        if (isMounted) {
          setScheduleData(schedule);
          setScheduleLoading(false);
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        if (isMounted) {
          setScheduleData([]);
          setScheduleLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [lang, show.scheduleFilePath]);

  const fallbackScheduleData: ScheduleDisplayEntry[] = t.scheduleRows.map((row, index) => ({
    id: row.id ?? `fallback-${index}`,
    date: row.date,
    dateIso: '',
    time: row.time,
    place: row.place,
    format: row.format,
    language: row.language,
  }));
  const displaySchedule: ScheduleDisplayEntry[] = scheduleData.length > 0 ? scheduleData : fallbackScheduleData;
  const galleryPhotos = show.galleryPhotos.length > 0 ? show.galleryPhotos : show.carouselPhotos;

  const scrollToSchedule = () => {
    const scheduleSection = document.getElementById('schedule');
    if (scheduleSection) {
      scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const closeCheckout = () => {
    setSelectedRow(null);
    setCheckoutLoading(false);
    setCheckoutError(null);
  };

  const openCheckout = (row: ScheduleDisplayEntry) => {
    if (isClosedShow(row.format)) {
      return;
    }
    setSelectedRow(row);
    setCheckoutError(null);
  };

  const submitCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRow || checkoutLoading) return;

    const safeName = buyerName.trim();
    const safeEmail = buyerEmail.trim();
    if (!safeName || !safeEmail) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const eventId = selectedRow.id || `${selectedRow.dateIso}-${selectedRow.time}`;
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          showSlug: show.slug,
          eventId,
          qty: ticketQty,
          lang,
          buyer: {
            name: safeName,
            email: safeEmail,
          },
        }),
      });

      const result = (await response.json()) as { ok?: boolean; paymentUrl?: string };
      if (!response.ok || !result.ok || !result.paymentUrl) {
        throw new Error('checkout_create_failed');
      }

      window.location.href = result.paymentUrl;
    } catch (error) {
      console.error('Checkout create failed:', error);
      setCheckoutError(checkoutT.createErrorLabel);
      setCheckoutLoading(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-fixed bg-cover bg-center" style={{ backgroundImage: show.backgroundStyle }}>
      <div className={`min-h-screen ${textColor} ${textDirectionClass}`}>
        <header className={`sticky top-0 z-50 ${headerBg} backdrop-blur-sm border-b border-[rgba(255,255,255,0.1)]`}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 md:gap-4">
            <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''} flex-shrink min-w-0`}>
              <div className="flex flex-col gap-0.5">
                <div className="text-[0.65rem] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-amber-200/80 whitespace-nowrap">{t.theatreLabel}</div>
                {t.theatreSubtitle && (
                  <div className="text-[0.55rem] md:text-[0.6rem] tracking-wide text-amber-200/80">{t.theatreSubtitle}</div>
                )}
              </div>
              <div
                className={`inline-flex items-center bg-[rgba(0,0,0,0.3)] rounded-full px-2 md:px-3 py-1 text-[0.5rem] md:text-[0.55rem] uppercase tracking-[0.15em] md:tracking-[0.18em] text-amber-100/85 whitespace-nowrap ${badgeSpacingClass}`}
              >
                <span>{t.heroBadge}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} flex-shrink-0`}>
              {availableLanguages.length > 1 && (
                <div className="flex items-center gap-1 text-xs md:text-sm bg-[rgba(0,0,0,0.35)] rounded-full px-2 py-1">
                  {availableLanguages.includes('ru') && (
                    <LangButton current={lang} target="ru" onClick={changeLang}>
                      Рус
                    </LangButton>
                  )}
                  {availableLanguages.includes('he') && (
                    <LangButton current={lang} target="he" onClick={changeLang}>
                      עִבְ׳
                    </LangButton>
                  )}
                  {availableLanguages.includes('en') && (
                    <LangButton current={lang} target="en" onClick={changeLang} disabled title="English version coming soon">
                      Eng
                    </LangButton>
                  )}
                </div>
              )}
              <button
                onClick={scrollToSchedule}
                className={`inline-flex rounded-full ${buttonBg} ${buttonHover} ${buttonText} text-xs md:text-sm font-medium px-3 md:px-4 py-2 shadow-md shadow-black/40 transition whitespace-nowrap cursor-pointer`}
              >
                {t.menuSchedule}
              </button>
              <a href={whatsappLink} className={`inline-flex rounded-full ${buttonBg} ${buttonHover} ${buttonText} text-xs md:text-sm font-medium px-3 md:px-4 py-2 shadow-md shadow-black/40 transition whitespace-nowrap`}>
                {t.menuInvite}
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 pb-24 pt-10 md:pt-12 space-y-16 overflow-x-hidden">
          <section className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 items-start">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                {show.slug === 'zlata' && <HanukkiahIcon className="w-12 h-12 md:w-16 md:h-16 text-amber-300 flex-shrink-0" />}
                <div>
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-amber-100 drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">{t.title}</h1>
                </div>
              </div>

              <p className={`text-sm md:text-base text-amber-100/80 leading-relaxed ${darkCardBg} rounded-xl px-4 py-3 border border-amber-100/10`}>
                {t.seoSubtitle.split('\n').map((line, idx, arr) => (
                  <span key={idx}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
              <p className={`text-sm md:text-base text-amber-100/80 leading-relaxed ${darkCardBg} rounded-xl px-4 py-3 border border-amber-100/10`}>
                {t.heroSecondary.split('\n').map((line, idx, arr) => (
                  <span key={idx}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>

              <div className="grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm text-amber-100/90">
                <InfoBadge label={t.ageLabel} value={t.infoAgeValue} cardBg={darkCardBg} />
                <InfoBadge label={t.durationLabel} value={t.infoDurationValue} cardBg={darkCardBg} />
                <InfoBadge label={t.formatLabel} value={t.infoFormatValue} cardBg={darkCardBg} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className={`rounded-2xl overflow-hidden border border-amber-100/20 shadow-[0_18px_45px_rgba(0,0,0,0.75)] ${darkCardBg}`}>
                <Image src={t.posterImage} alt={`Афиша спектакля «${t.title}»`} width={640} height={960} className="w-full max-w-xs md:max-w-sm object-cover" />
              </div>
              <a href={t.posterPdf} className="text-xs md:text-sm underline-offset-4 hover:underline text-amber-100/90" download>
                {t.posterDownload}
              </a>
            </div>
          </section>

          <section id="about">
            <div className={`space-y-6 ${cardBg} rounded-2xl px-6 py-6 border border-[rgba(0,0,0,0.08)]`}>
              <SectionTitle color={headingColor}>{t.sectionAbout}</SectionTitle>
              <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8">
                <div className={`space-y-4 text-sm md:text-base leading-relaxed whitespace-pre-line ${textDirectionClass}`}>{t.aboutText}</div>
              <aside className="space-y-4 text-xs md:text-sm">
                <PhotoCarousel
                  photos={show.carouselPhotos}
                  labels={{
                    open: t.carouselOpenLabel,
                    download: t.carouselDownloadLabel,
                    prev: t.carouselPrevLabel,
                    next: t.carouselNextLabel,
                    close: t.carouselCloseLabel,
                  }}
                  rtl={isRTL}
                  buttonColors={show.buttonColors}
                  darkCardBg={darkCardBg}
                />
              </aside>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <SectionTitle>{t.sectionTeaser}</SectionTitle>
            <div className="aspect-video rounded-2xl overflow-hidden border border-amber-100/20 bg-black/70 shadow-[0_18px_45px_rgба(0,0,0,0.8)]">
              <iframe
                src={t.teaserVideoUrl}
                title={`Тизер спектакля «${t.title}»`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>

          <section id="schedule" className="space-y-6">
            <SectionTitle>{t.sectionSchedule}</SectionTitle>
            {scheduleLoading ? (
              <p className="text-sm md:text-base text-amber-50/85 text-center py-8">
                {lang === 'ru' && 'Загрузка расписания...'}
                {lang === 'he' && 'טוען לוח הופעות...'}
                {lang === 'en' && 'Loading schedule...'}
              </p>
            ) : displaySchedule.length > 0 ? (
              <div className={`overflow-x-auto rounded-2xl border border-amber-100/15 ${darkCardBg}`}>
                <table className="min-w-full text-sm md:text-base">
                  <thead className="bg-[rgba(0,0,0,0.6)] text-amber-100/90">
                    <tr>
                      <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleDateLabel}</th>
                      <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleTimeLabel}</th>
                      <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.schedulePlaceLabel}</th>
                      <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleFormatLabel}</th>
                      <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleLanguageLabel}</th>
                      <th className={`px-4 py-3 ${scheduleAlignClass}`}>{checkoutT.buyColumn}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/10 text-amber-50/90">
                    {displaySchedule.map((row) => (
                      <tr key={row.id || `${row.date}-${row.time}-${row.place}`}>
                        <td className={`px-4 py-3 ${scheduleAlignClass}`}>{parseLinksInText(row.date)}</td>
                        <td className={`px-4 py-3 ${scheduleAlignClass}`}>{parseLinksInText(row.time)}</td>
                        <td className={`px-4 py-3 ${scheduleAlignClass}`}>{parseLinksInText(row.place)}</td>
                        <td className={`px-4 py-3 ${scheduleAlignClass}`}>{parseLinksInText(row.format)}</td>
                        <td className={`px-4 py-3 ${scheduleAlignClass}`}>{parseLinksInText(row.language)}</td>
                        <td className={`px-4 py-3 ${scheduleAlignClass}`}>
                          {isClosedShow(row.format) ? (
                            <span className="text-xs md:text-sm text-amber-100/60">{checkoutT.unavailableLabel}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openCheckout(row)}
                              className={`inline-flex rounded-full ${buttonBg} ${buttonHover} ${buttonText} text-xs md:text-sm font-medium px-3 py-2 shadow-md shadow-black/40 transition whitespace-nowrap cursor-pointer`}
                            >
                              {checkoutT.buyButton}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm md:text-base text-amber-50/85 text-center py-8">
                {lang === 'ru' && 'Расписание пока не заполнено. Следите за обновлениями!'}
                {lang === 'he' && 'לוח הופעות עדיין לא מלא. עקבו אחרי עדכונים!'}
                {lang === 'en' && 'Schedule not yet available. Stay tuned!'}
              </p>
            )}
          </section>

          <section id="media" className="space-y-6">
            <SectionTitle small>{t.sectionPhotos}</SectionTitle>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galleryPhotos.map((photo) => (
                <a key={photo.src} href={photo.src} download className="group relative rounded-2xl border border-amber-100/20 bg-black/60">
                  <div className="relative h-48 sm:h-56 md:h-60 overflow-hidden rounded-2xl">
                    <Image
                      src={photo.src}
                      alt={photo.alt ?? `Кадр спектакля «${t.title}»`}
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover transition	duration-500 group-hover:scale-105 group-hover:brightness-110"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-end p-3">
                    <span className="text-[10px] bg-[rgba(0,0,0,0.6)] px-2 py-1 rounded-full text-amber-50/95">{t.photoDownloadLabel}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section id="team" className="space-y-6">
            <SectionTitle>{t.sectionTeam}</SectionTitle>
            <div className={`space-y-5 text-sm md:text-base text-amber-50/90 leading-relaxed ${darkCardBg} border border-amber-100/15 rounded-2xl p-5 ${textDirectionClass}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">{t.teamAuthorTitle}</p>
                <p className="text-lg text-amber-50 mt-1">{t.teamAuthorName}</p>
              </div>
              {t.songsTitle && t.songsName && (
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">{t.songsTitle}</p>
                  <p className="text-lg text-amber-50 mt-1">{t.songsName}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">{t.teamDirectorTitle}</p>
                <p className="text-lg text-amber-50 mt-1">{t.teamDirectorName}</p>
              </div>
              {t.masterTitle && t.masterName && (
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">{t.masterTitle}</p>
                  <p className="text-lg text-amber-50 mt-1">{t.masterName}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">{t.teamActorsTitle}</p>
                <ul className="mt-2 space-y-1 text-amber-50">
                  {t.teamActors.map((actor) => (
                    <li key={actor.name}>
                      {actor.name} — {actor.role}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <SectionTitle>{t.faqTitle}</SectionTitle>
            <div className="space-y-3">
              {t.faqItems.map((item) => (
                <details key={item.q} className={`group ${darkCardBg} border border-amber-100/15 rounded-2xl px-4 py-3`}>
                  <summary className="cursor-pointer text-sm md:text-base font-medium text-amber-100 list-none flex items-center justify-between gap-3">
                    <span>{item.q}</span>
                    <span className="text-xs opacity-60 group-open:rotate-90 transition">❯</span>
                  </summary>
                  <p className="mt-2 text-xs md:text-sm text-amber-50/90 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="contact">
            <div className={`space-y-6 ${cardBg} rounded-2xl px-6 py-6 border border-[rgba(0,0,0,0.08)]`}>
              <SectionTitle color={headingColor}>{t.sectionContact}</SectionTitle>
              <p className="text-sm md:text-base leading-relaxed">{t.contactText}</p>
              <div className="flex flex-wrap gap-4">
                <a href={whatsappLink} className="inline-flex items-center justify-center rounded-full	bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm md:text-base font-semibold shadow-lg shadow-black/50 transition">
                  {t.contactWhatsappLabel}
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
      {selectedRow && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className={`w-full max-w-md ${darkCardBg} border border-amber-100/20 rounded-2xl p-5 space-y-4`}>
            <h3 className="text-xl font-semibold text-amber-100">{checkoutT.modalTitle}</h3>
            <div className="text-xs md:text-sm text-amber-100/80 space-y-1">
              <p>
                {checkoutT.eventLabel}: {selectedRow.date} {selectedRow.time}
              </p>
              <p>{selectedRow.place}</p>
            </div>

            {isClosedShow(selectedRow.format) ? (
              <p className="text-sm text-amber-100/80">{checkoutT.closedShowLabel}</p>
            ) : (
              <form className="space-y-3" onSubmit={submitCheckout}>
                <label className="block space-y-1">
                  <span className="text-xs text-amber-100/80">{checkoutT.nameLabel}</span>
                  <input
                    required
                    value={buyerName}
                    onChange={(event) => setBuyerName(event.target.value)}
                    placeholder={checkoutT.namePlaceholder}
                    className="w-full rounded-xl bg-black/40 border border-amber-100/20 px-3 py-2 text-amber-50 placeholder:text-amber-50/40 outline-none focus:border-amber-300/60"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-amber-100/80">{checkoutT.emailLabel}</span>
                  <input
                    required
                    type="email"
                    value={buyerEmail}
                    onChange={(event) => setBuyerEmail(event.target.value)}
                    placeholder={checkoutT.emailPlaceholder}
                    className="w-full rounded-xl bg-black/40 border border-amber-100/20 px-3 py-2 text-amber-50 placeholder:text-amber-50/40 outline-none focus:border-amber-300/60"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-amber-100/80">{checkoutT.qtyLabel}</span>
                  <input
                    required
                    min={1}
                    max={10}
                    type="number"
                    value={ticketQty}
                    onChange={(event) => setTicketQty(Math.max(1, Number.parseInt(event.target.value || '1', 10)))}
                    className="w-full rounded-xl bg-black/40 border border-amber-100/20 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/60"
                  />
                </label>
                {checkoutError && <p className="text-xs text-red-300">{checkoutError}</p>}
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={closeCheckout}
                    className="inline-flex rounded-full bg-black/40 hover:bg-black/60 text-amber-50 text-xs md:text-sm font-medium px-4 py-2 transition"
                  >
                    {checkoutT.cancelLabel}
                  </button>
                  <button
                    disabled={checkoutLoading}
                    type="submit"
                    className={`inline-flex rounded-full ${buttonBg} ${buttonHover} ${buttonText} text-xs md:text-sm font-medium px-4 py-2 shadow-md shadow-black/40 transition disabled:opacity-60`}
                  >
                    {checkoutLoading ? checkoutT.submittingLabel : checkoutT.submitLabel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LangButton({
  current,
  target,
  onClick,
  children,
  disabled,
  title,
}: {
  current: Lang;
  target: Lang;
  onClick: (l: Lang) => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const active = current === target;
  const handleClick = () => {
    if (!disabled) {
      onClick(target);
    }
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={title}
      className={`px-2 py-0.5 rounded-full transition text-xs md:text-[0.8rem] ${
        disabled
          ? 'text-amber-100/40 cursor-not-allowed'
          : active
            ? 'bg-amber-500 text-black font-semibold'
            : 'text-amber-100/80 hover:bg-[rgba(255,255,255,0.08)]'
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children, small, color }: { children: React.ReactNode; small?: boolean; color?: string }) {
  const textColor = color ?? 'text-amber-100';
  return (
    <h2 className={`${small ? 'text-xl' : 'text-2xl'} md:text-2xl font-semibold tracking-tight ${textColor}`}>
      {children}
    </h2>
  );
}

function InfoBadge({ label, value, cardBg }: { label: string; value: string; cardBg?: string }) {
  const bg = cardBg ?? 'bg-[rgba(0,0,0,0.4)]';
  return (
    <div className={`${bg} border border-amber-100/15 rounded-2xl px-2 md:px-3 py-2`}>
      <div className="text-[0.6rem] md:text-[0.65rem] uppercase tracking-[0.08em] md:tracking-[0.18em] text-amber-100/70 mb-1">{label}</div>
      <div className="text-xs md:text-sm text-amber-50/90">{value}</div>
    </div>
  );
}

function PhotoCarousel({
  photos,
  labels,
  rtl,
  buttonColors,
  darkCardBg,
}: {
  photos: { src: string; alt: string }[];
  labels: {
    open: string;
    download: string;
    prev: string;
    next: string;
    close: string;
  };
  rtl?: boolean;
  buttonColors?: {
    bg: string;
    hover: string;
    text: string;
  };
  darkCardBg?: string;
}) {
  const buttonBg = buttonColors?.bg ?? 'bg-amber-600';
  const buttonHover = buttonColors?.hover ?? 'hover:bg-amber-500';
  const buttonText = buttonColors?.text ?? 'text-white';
  const bg = darkCardBg ?? 'bg-[rgba(0,0,0,0.45)]';
  const [current, setCurrent] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  if (photos.length === 0) {
    return null;
  }

  const move = (delta: number) => {
    setCurrent((prev) => (prev + delta + photos.length) % photos.length);
  };

  const prev = () => move(-1);
  const next = () => move(1);
  const openZoom = () => setIsZoomed(true);
  const closeZoom = () => setIsZoomed(false);

  return (
    <>
      <div className={`${bg} border border-[rgba(0,0,0,0.15)] rounded-2xl px-4 py-4 flex flex-col gap-3`}>
        <div className="relative overflow-hidden rounded-2xl border border-amber-100/20 min-h-[18rem] bg-black/50 flex items-center justify-center">
          <Image
            src={photos[current].src}
            alt={photos[current].alt}
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className="object-contain cursor-zoom-in"
            onClick={openZoom}
          />
          <button
            type="button"
            onClick={prev}
            className={`absolute ${rtl ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-amber-50 rounded-full w-9 h-9 flex items-center justify-center transition`}
            aria-label={labels.prev}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className={`absolute ${rtl ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-amber-50 rounded-full w-9 h-9 flex items-center justify-center transition`}
            aria-label={labels.next}
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={openZoom}
          className={`text-xs md:text-sm text-amber-100/80 underline-offset-4 hover:underline ${rtl ? 'self-end' : 'self-start'}`}
        >
          {labels.open}
        </button>
        <div className="flex items-center justify-center gap-1">
          {photos.map((_, idx) => (
            <span key={idx} className={`h-1.5 w-4 rounded-full ${idx === current ? 'bg-amber-400' : 'bg-amber-100/30'}`} />
          ))}
        </div>
      </div>
      {isZoomed && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <button
            type="button"
            onClick={closeZoom}
            className={`absolute top-6 ${rtl ? 'left-6' : 'right-6'} text-4xl text-amber-50 hover:text-amber-300 transition z-10`}
            aria-label={labels.close}
          >
            ×
          </button>
          <div className="relative w-full max-w-6xl">
            <div className="relative w-full" style={{ height: 'min(88vh, 95vw)', minHeight: '60vh' }}>
              <Image
                src={photos[current].src}
                alt={photos[current].alt}
                fill
                sizes="(min-width: 768px) 70vw, 100vw"
                className="object-contain rounded-2xl border border-amber-100/30"
              />
              <button
                type="button"
                onClick={prev}
                className={`absolute ${rtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-amber-50 rounded-full w-14 h-14 flex items-center justify-center text-3xl transition`}
                aria-label={labels.prev}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                className={`absolute ${rtl ? 'left-6' : 'right-6'} top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-amber-50 rounded-full w-14 h-14 flex items-center justify-center text-3xl transition`}
                aria-label={labels.next}
              >
                ›
              </button>
            </div>
            <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 ${rtl ? 'flex-row-reverse text-right' : ''}`}>
              <span className="text-sm text-amber-100/80">{photos[current].alt}</span>
              <a href={photos[current].src} download className={`inline-flex items-center gap-2 rounded-full ${buttonBg} ${buttonHover} ${buttonText} text-sm font-semibold px-4 py-2`}>
                {labels.download}
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HanukkiahIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="currentColor">
      <g>
        <path d="M30 8h4v8h-4zM14 10h4v8h-4zM22 9h4v8h-4zM38 9h4v8h-4zM46 10h4v8h-4zM10 18c0-1.1.9-2 2-2h40a2 2 0 0 1 0 4H12a2 2 0 0 1-2-2z" />
        <path d="M18 22a2 2 0 0 1 2 2c0 7.2 4.8 13.2 12 14.7V48h-8a2 2 0 0 0-2 2v4h24v-4a2 2 0 0 0-2-2h-8V38.7C39.2 37.2 44 31.2 44 24a2 2 0 0 1 4 0c0 8.7-5.7 16-14 17.9V52h6a2 2 0 0 1 2 2v4H22v-4a2 2 0 0 1 2-2h6V41.9C21.7 40 16 32.7 16 24a2 2 0 0 1 2-2z" />
      </g>
    </svg>
  );
}

function detectBrowserLanguage(): Lang {
  if (typeof window === 'undefined') return 'ru';
  const savedLang = localStorage.getItem('preferredLang') as Lang | null;
  if (savedLang && ['ru', 'he', 'en'].includes(savedLang)) {
    return savedLang;
  }
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('he') || browserLang.startsWith('iw')) {
    return 'he';
  }
  if (browserLang.startsWith('ru')) {
    return 'ru';
  }
  return 'ru';
}

function parseScheduleData(yamlData: ScheduleYaml, lang: Lang): ScheduleDisplayEntry[] {
  if (!yamlData?.schedule || !Array.isArray(yamlData.schedule)) {
    return [];
  }

  return yamlData.schedule
    .map((event) => {
      const entry = event.entries[lang];
      if (!entry) return null;

      return {
        id: event.id,
        dateIso: event.date_iso,
        date: entry.date_text || formatDate(event.date_iso, lang),
        time: entry.time,
        place: entry.place,
        format: entry.format,
        language: entry.language,
      };
    })
    .filter((item): item is ScheduleDisplayEntry => item !== null)
    .sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime());
}

function formatDate(dateIso: string, lang: Lang): string {
  const date = new Date(dateIso);

  const monthNames: Record<Lang, string[]> = {
    ru: [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ],
    he: [
      'בינואר',
      'בפברואר',
      'במרץ',
      'באפריל',
      'במאי',
      'ביוני',
      'ביולי',
      'באוגוסט',
      'בספטמבר',
      'באוקטובר',
      'בנובמבר',
      'בדצמבר',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  };

  const day = date.getDate();
  const month = monthNames[lang][date.getMonth()];

  return `${day} ${month}`;
}

function parseLinksInText(text: string): React.ReactNode {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const linkText = match[1];
    const url = match[2];
    parts.push(
      <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300 transition">
        {linkText}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
