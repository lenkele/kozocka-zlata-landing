import Link from 'next/link';
import { headers } from 'next/headers';

type ReturnLang = 'ru' | 'en' | 'he';

type ReturnContent = {
  title: string;
  lines: string[];
  button: string;
  dir?: 'rtl';
};

const RETURN_CONTENT: Record<ReturnLang, ReturnContent> = {
  ru: {
    title: 'Ошибка оплаты',
    lines: [
      'Что-то пошло не так.',
      'Пожалуйста, вернитесь на сайт и попробуйте снова.',
    ],
    button: 'Вернуться на сайт',
  },
  en: {
    title: 'Payment Error',
    lines: [
      'Something went wrong.',
      'Please return to the website and try again.',
    ],
    button: 'Back to website',
  },
  he: {
    title: 'שגיאת תשלום',
    lines: [
      'משהו השתבש.',
      'אנא חזרו לאתר ונסו שוב.',
    ],
    button: 'חזרה לאתר',
    dir: 'rtl',
  },
};

function normalizeLang(value: string | null): ReturnLang | null {
  if (value === 'ru' || value === 'en' || value === 'he') return value;
  return null;
}

function resolveSafeReturnPath(raw: string | undefined): string {
  if (!raw) return '/';
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/';
  return decoded;
}

function detectFallbackLangFromHeaders(acceptLanguage: string): ReturnLang {
  const browserLang = acceptLanguage.toLowerCase();
  if (browserLang.startsWith('he') || browserLang.startsWith('iw') || browserLang.includes(',he') || browserLang.includes(',iw')) return 'he';
  if (browserLang.startsWith('en') || browserLang.includes(',en')) return 'en';
  return 'ru';
}

type PaymentReturnPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function PaymentReturnPage({ searchParams }: PaymentReturnPageProps) {
  const params = searchParams ? await searchParams : {};
  const langParam = getQueryParam(params, 'lang');
  const returnParam = getQueryParam(params, 'return');
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') ?? '';
  const lang = normalizeLang(langParam ?? null) ?? detectFallbackLangFromHeaders(acceptLanguage);
  const returnPath = resolveSafeReturnPath(returnParam);

  const content = RETURN_CONTENT[lang];
  const rtl = content.dir === 'rtl';

  return (
    <main className="min-h-screen bg-[radial-gradient(80%_60%_at_50%_0%,rgba(220,38,38,0.14),rgba(2,6,23,0.96)_70%)] px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <section
          dir={rtl ? 'rtl' : 'ltr'}
          className="rounded-2xl border border-red-900/50 bg-slate-950/70 p-6 shadow-[0_18px_60px_-30px_rgba(220,38,38,0.45)] md:p-8"
        >
          <h1 className={`text-2xl font-semibold text-red-100 md:text-3xl ${rtl ? 'text-right' : ''}`}>
            {content.title}
          </h1>

          <div className={`mt-6 space-y-3 text-sm leading-7 text-slate-200 md:text-base ${rtl ? 'text-right' : ''}`}>
            {content.lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          <div className={`mt-8 ${rtl ? 'text-right' : ''}`}>
            <Link
              href={returnPath}
              className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
            >
              {content.button}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
