'use client';

import Image from 'next/image';
import yaml from 'js-yaml';
import { useEffect, useState } from 'react';

import { CONTENT, type Lang } from './content';

const WHATSAPP_MESSAGES: Record<Lang, string> = {
  ru: 'Здравствуйте! Хочу пригласить спектакль «Козочка Злата». Напишите, пожалуйста, какие есть даты и условия.',
  he: 'שלום! הייתי רוצה להזמין את ההצגה «זלטה העז». אשמח לדעת אילו תאריכים ותנאים זמינים.',
  en: 'Hello! I would like to invite “Little Goat Zlata”. Please let me know what dates and conditions are available.',
};

const BASE_WHATSAPP_URL = 'https://wa.me/972533219998?text=';
// TODO: замените номер на реальный телефон без плюса при необходимости

const CAROUSEL_PHOTOS = [
  { src: '/photos/kozocka-1.jpg', alt: 'И вдруг пошел снег...' },
  { src: '/photos/kozocka-2.jpg', alt: 'Сейчас таких местечек уже не осталось...' },
  { src: '/photos/kozocka-new-3.jpg', alt: 'Я нищим не подаю!' },
  { src: '/photos/kozocka-4.jpg', alt: 'Ты любишь меня, а я люблю тебя...' },
  { src: '/photos/kozocka-5.jpg', alt: 'Отправился в город верхом на осле, и взял с собой петуха и фонарь.' },
  { src: '/photos/kozocka-6.jpg', alt: 'А это кто еще пришел?' },
  { src: '/photos/kozocka-7.jpg', alt: 'Дальний путь.' },
];

const SCHEDULE_FILE_PATH = '/data/schedule.yaml';

type ScheduleDisplayEntry = {
  id: string;
  date: string;
  dateIso: string;
  time: string;
  place: string;
  format: string;
  language: string;
};

type SchedulePerLang = Record<Lang, ScheduleDisplayEntry[]>;

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

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ru');
  const t = CONTENT[lang];
  const isRTL = lang === 'he';
  const badgeSpacingClass = isRTL ? 'mr-2' : 'ml-2';
  const textDirectionClass = isRTL ? 'text-right' : '';
  const scheduleAlignClass = isRTL ? 'text-right' : 'text-left';
  const whatsappLink =
    BASE_WHATSAPP_URL + encodeURIComponent(WHATSAPP_MESSAGES[lang] ?? WHATSAPP_MESSAGES.ru);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen overflow-x-hidden bg-fixed bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(151,170,184,0.70) 0%, rgba(64,86,105,0.85) 100%), url('/images/forest.png')",
      }}
    >
      {/* полупрозрачный "ледяной" слой уже смешан с лесом выше */}
      <div className={`min-h-screen text-[var(--text-color, #fdf4e3)] ${textDirectionClass}`}>
        <header className="sticky top-0 z-20 bg-[rgba(32,20,12,0.96)]/95 backdrop-blur-sm border-b border-[rgba(255,255,255,0.1)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80 whitespace-nowrap">
                {t.theatreLabel}
              </div>
              <div
                className={`inline-flex items-center bg-[rgba(0,0,0,0.3)] rounded-full px-3 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-amber-100/85 whitespace-nowrap ${badgeSpacingClass}`}
              >
                <span>{t.heroBadge}</span>
              </div>
            </div>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1 text-xs md:text-sm bg-[rgba(0,0,0,0.35)] rounded-full px-2 py-1">
                <LangButton current={lang} target="ru" onClick={setLang}>
                  Рус
                </LangButton>
                <LangButton current={lang} target="he" onClick={setLang}>
                  עִבְ׳
                </LangButton>
                <LangButton
                  current={lang}
                  target="en"
                  onClick={setLang}
                  disabled
                  title="English version coming soon"
                >
                  Eng
                </LangButton>
              </div>
              <a
                href={whatsappLink}
                className="inline-flex rounded-full bg-amber-600 hover:bg-amber-500 text-xs md:text-sm font-medium px-4 py-2 shadow-md shadow-black/40 transition"
              >
                {t.menuInvite}
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 pb-24 pt-10 md:pt-12 space-y-16">
          {/* HERO */}
          <section className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 items-start">
            <div className="space-y-5">

              <div className="flex items-start gap-4">
                {/* Ханукия */}
                <HanukkiahIcon className="w-12 h-12 md:w-16 md:h-16 text-amber-300 flex-shrink-0" />
                <div>
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-amber-100 drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">
                    {t.title}
                  </h1>
                </div>
              </div>

              {/* SEO-подзаголовок – можно дописывать и расширять текст */}
              <p className="text-sm md:text-base text-amber-100/80 leading-relaxed bg-[rgba(0,0,0,0.35)] rounded-xl px-4 py-3 border border-amber-100/10">
                {t.seoSubtitle.split('\n').map((line, idx, arr) => (
                  <span key={idx}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
              <p className="text-sm md:text-base text-amber-100/80 leading-relaxed bg-[rgba(0,0,0,0.35)] rounded-xl px-4 py-3 border border-amber-100/10">
                {t.heroSecondary}
              </p>

              <div className="flex flex-wrap items-center gap-4" />

              <div className="grid grid-cols-3 gap-4 text-xs md:text-sm text-amber-100/90">
                <InfoBadge label={t.ageLabel} value={t.infoAgeValue} />
                <InfoBadge label={t.durationLabel} value={t.infoDurationValue} />
                <InfoBadge label={t.formatLabel} value={t.infoFormatValue} />
              </div>
            </div>

            {/* Афиша справа */}
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl overflow-hidden border border-amber-100/20 shadow-[0_18px_45px_rgba(0,0,0,0.75)] bg-[rgba(0,0,0,0.4)]">
                <Image
                  src={t.posterImage}
                  alt="Афиша спектакля «Козочка Злата»"
                  width={640}
                  height={960}
                  className="w-full max-w-xs md:max-w-sm object-cover"
                />
              </div>
              <a
                href={t.posterPdf}
                className="text-xs md:text-sm underline-offset-4 hover:underline text-amber-100/90"
                download
              >
                {t.posterDownload}
              </a>
            </div>
          </section>

          {/* О СПЕКТАКЛЕ */}
          <section id="about" className="space-y-6">
            <SectionTitle>{t.sectionAbout}</SectionTitle>
            <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8">
              <div className={`space-y-4 text-sm md:text-base leading-relaxed text-amber-50/90 whitespace-pre-line ${textDirectionClass}`}>
                {t.aboutText}
              </div>
              <aside className="space-y-4 text-xs md:text-sm">
                <PhotoCarousel
                  photos={CAROUSEL_PHOTOS}
                  labels={{
                    open: t.carouselOpenLabel,
                    download: t.carouselDownloadLabel,
                    prev: t.carouselPrevLabel,
                    next: t.carouselNextLabel,
                    close: t.carouselCloseLabel,
                  }}
                  rtl={isRTL}
                />
              </aside>
            </div>
          </section>

          {/* ВИДЕО-ТИЗЕР */}
          <section className="space-y-6">
            <SectionTitle>{t.sectionTeaser}</SectionTitle>
            <div className="aspect-video rounded-2xl overflow-hidden border border-amber-100/20 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
              <iframe
                src={t.teaserVideoUrl}
                title="Тизер спектакля «Козочка Злата»"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>

          {/* РАСПИСАНИЕ */}
          <section id="schedule" className="space-y-6">
            <SectionTitle>{t.sectionSchedule}</SectionTitle>
            <p className="text-sm md:text-base text-amber-50/85">
              {/* TODO: заполняйте расписание вручную или из CMS позже */}
              {/* Ниже пример расписания. Для актуальных дат просто обновляйте таблицу в коде или подключите Google-таблицу/CMS позже. */}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-amber-100/15 bg-[rgba(0,0,0,0.4)]">
              <table className="min-w-full text-sm md:text-base">
                <thead className="bg-[rgba(0,0,0,0.6)] text-amber-100/90">
                  <tr>
                    <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleDateLabel}</th>
                    <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleTimeLabel}</th>
                    <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.schedulePlaceLabel}</th>
                    <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleFormatLabel}</th>
                    <th className={`px-4 py-3 ${scheduleAlignClass}`}>{t.scheduleLanguageLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/10 text-amber-50/90">
                  {t.scheduleRows.map((row) => (
                    <tr key={`${row.date}-${row.time}-${row.place}`}>
                      <td className={`px-4 py-3 ${scheduleAlignClass}`}>{row.date}</td>
                      <td className={`px-4 py-3 ${scheduleAlignClass}`}>{row.time}</td>
                      <td className={`px-4 py-3 ${scheduleAlignClass}`}>{row.place}</td>
                      <td className={`px-4 py-3 ${scheduleAlignClass}`}>{row.format}</td>
                      <td className={`px-4 py-3 ${scheduleAlignClass}`}>{row.language}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ВИДЕО И ФОТО */}
          <section id="media" className="space-y-6">
            {/* <SectionTitle small>{t.sectionFragments}</SectionTitle>
            <div className="grid md:grid-cols-3 gap-4">
              {['VIDEO_ID_1', 'VIDEO_ID_2', 'VIDEO_ID_3'].map((id) => (
                <div
                  key={id}
                  className="aspect-video rounded-2xl overflow-hidden border border-amber-100/15 bg-black/70"
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    title="Фрагмент спектакля"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div> */}

            <SectionTitle small>{t.sectionPhotos}</SectionTitle>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* TODO: положите реальные фото в /public/photos/... */}
              {[1, 2, 4, 5, 6, 7].map((n) => (
                <a
                  key={n}
                  href={`/photos/kozocka-${n}.jpg`}
                  download
                  className="group relative rounded-2xl border border-amber-100/20 bg-black/60"
                >
                  <div className="relative h-48 sm:h-56 md:h-60 overflow-hidden rounded-2xl">
                    <Image
                      src={`/photos/kozocka-${n}.jpg`}
                      alt={`Кадр спектакля «Козочка Злата» ${n}`}
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-end p-3">
                    <span className="text-[10px] bg-[rgba(0,0,0,0.6)] px-2 py-1 rounded-full text-amber-50/95">
                      {t.photoDownloadLabel}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* КОМАНДА */}
          <section id="team" className="space-y-6">
            <SectionTitle>{t.sectionTeam}</SectionTitle>
            <div className={`space-y-5 text-sm md:text-base text-amber-50/90 leading-relaxed bg-[rgba(0,0,0,0.35)] border border-amber-100/15 rounded-2xl p-5 ${textDirectionClass}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">
                  {t.teamAuthorTitle}
                </p>
                <p className="text-lg text-amber-50 mt-1">{t.teamAuthorName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">
                  {t.teamDirectorTitle}
                </p>
                <p className="text-lg text-amber-50 mt-1">{t.teamDirectorName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">
                  {t.teamActorsTitle}
                </p>
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

          {/* FAQ */}
          <section className="space-y-6">
            <SectionTitle>{t.faqTitle}</SectionTitle>
            <div className="space-y-3">
              {t.faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group bg-[rgba(0,0,0,0.4)] border border-amber-100/15 rounded-2xl px-4 py-3"
                >
                  <summary className="cursor-pointer text-sm md:text-base font-medium text-amber-100 list-none flex items-center justify-between gap-3">
                    <span>{item.q}</span>
                    <span className="text-xs opacity-60 group-open:rotate-90 transition">
                      ❯
                    </span>
                  </summary>
                  <p className="mt-2 text-xs md:text-sm text-amber-50/90 leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* КОНТАКТЫ */}
          <section id="contact" className="space-y-6">
            <SectionTitle>{t.sectionContact}</SectionTitle>
            <p className="text-sm md:text-base text-amber-50/90 leading-relaxed">
              {t.contactText}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={whatsappLink}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm md:text-base font-semibold shadow-lg shadow-black/50 transition"
              >
                {t.contactWhatsappLabel}
              </a>
            </div>
          </section>
        </main>

      </div>
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

function SectionTitle({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <h2
      className={`${
        small ? 'text-xl' : 'text-2xl'
      } md:text-2xl font-semibold tracking-tight text-amber-100`}
    >
      {children}
    </h2>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[rgba(0,0,0,0.4)] border border-amber-100/15 rounded-2xl px-3 py-2">
      <div className="text-[0.65rem] uppercase tracking-[0.18em] text-amber-100/70 mb-1">
        {label}
      </div>
      <div className="text-xs md:text-sm text-amber-50/90">{value}</div>
    </div>
  );
}

function PhotoCarousel({
  photos,
  labels,
  rtl,
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
}) {
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
      <div className="bg-[rgba(0,0,0,0.45)] border border-amber-100/20 rounded-2xl px-4 py-4 flex flex-col gap-3">
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
            <span
              key={idx}
              className={`h-1.5 w-4 rounded-full ${
                idx === current ? 'bg-amber-400' : 'bg-amber-100/30'
              }`}
            />
          ))}
        </div>
      </div>
      {isZoomed && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <button
            type="button"
            onClick={closeZoom}
            className={`absolute top-6 ${rtl ? 'left-6' : 'right-6'} text-4xl text-amber-50 hover:text-amber-300 transition`}
            aria-label={labels.close}
          >
            ×
          </button>
          <div className="relative w-full max-w-6xl">
            <div
              className="relative w-full"
              style={{ height: 'min(88vh, 95vw)', minHeight: '60vh' }}
            >
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
              <a
                href={photos[current].src}
                download
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 hover:bg-amber-500 text-sm font-semibold px-4 py-2 text-black"
              >
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
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <g>
        <path d="M30 8h4v8h-4zM14 10h4v8h-4zM22 9h4v8h-4zM38 9h4v8h-4zM46 10h4v8h-4zM10 18c0-1.1.9-2 2-2h40a2 2 0 0 1 0 4H12a2 2 0 0 1-2-2z" />
        <path d="M18 22a2 2 0 0 1 2 2c0 7.2 4.8 13.2 12 14.7V48h-8a2 2 0 0 0-2 2v4h24v-4a2 2 0 0 0-2-2h-8V38.7C39.2 37.2 44 31.2 44 24a2 2 0 0 1 4 0c0 8.7-5.7 16-14 17.9V52h6a2 2 0 0 1 2 2v4H22v-4a2 2 0 0 1 2-2h6V41.9C21.7 40 16 32.7 16 24a2 2 0 0 1 2-2z" />
      </g>
    </svg>
  );
}
