'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { WHATSAPP_GROUP_COPY, WHATSAPP_GROUP_URL } from '@/lib/whatsappGroup';
import type { Lang } from '@/shows/types';

/** Кнопка в верхнем меню: открывает окно с пояснением и ссылкой на группу анонсов. */
export default function WhatsAppGroupButton({ lang, className, style }: { lang: Lang; className: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const copy = WHATSAPP_GROUP_COPY[lang];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={style} aria-haspopup="dialog">
        {copy.button}
      </button>
      {/* Портал: у шапки есть backdrop-blur, внутри него fixed-окно обрезалось бы рамками шапки. */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-group-title"
            dir={lang === 'he' ? 'rtl' : 'ltr'}
            lang={lang}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl border border-amber-100/20 bg-[#1f1810] p-6 text-start text-[#f4ecdd] shadow-2xl"
          >
            <h2 id="whatsapp-group-title" className="text-xl font-semibold text-amber-100">
              {copy.title}
            </h2>
            <WhatsAppGroupText lang={lang} />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <WhatsAppJoinLink lang={lang} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-amber-100/30 px-5 py-2.5 text-sm text-amber-100/90 transition hover:bg-white/10"
              >
                {copy.close}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export function WhatsAppGroupText({ lang }: { lang: Lang }) {
  return <p className="text-sm leading-6 md:text-base md:leading-7">{WHATSAPP_GROUP_COPY[lang].text}</p>;
}

export function WhatsAppJoinLink({ lang }: { lang: Lang }) {
  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-[#0b2e17] transition hover:bg-[#3ee07a]"
    >
      {WHATSAPP_GROUP_COPY[lang].join}
    </a>
  );
}
