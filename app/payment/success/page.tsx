import Link from 'next/link';
import { headers } from 'next/headers';

import { isShowSlug } from '@/shows';
import { resolveSafeReturnUrl } from '@/lib/returnUrl';

type SuccessLang = 'ru' | 'en' | 'he';

type SuccessContent = {
  title: string;
  paragraphs: string[];
  button: string;
  dir?: 'rtl';
};

const SUCCESS_CONTENT: Record<SuccessLang, SuccessContent> = {
  ru: {
    title: 'Оплата прошла успешно',
    paragraphs: [
      'Спасибо за покупку билетов!',
      'Ваши электронные билеты и квитанция об оплате отправлены на указанный вами e-mail.\nЕсли письмо не отображается во входящих — пожалуйста, проверьте папку «Спам» или «Нежелательная почта».',
      'Если письмо не пришло в течение 5–10 минут, свяжитесь с нами через форму обратной связи на сайте.',
      'До встречи на спектакле!',
    ],
    button: 'Вернуться на сайт',
  },
  en: {
    title: 'Payment Successful',
    paragraphs: [
      'Thank you for purchasing your tickets!',
      'Your electronic tickets and payment receipt have been sent to the email address you provided.\nIf you don’t see the message in your inbox, please check your Spam or Junk folder.',
      'If you have not received the email within 5–10 minutes, please contact us using the contact form on our website.',
      'We look forward to seeing you at the performance!',
    ],
    button: 'Back to website',
  },
  he: {
    title: 'התשלום בוצע בהצלחה',
    paragraphs: [
      'תודה על רכישת הכרטיסים!',
      'הכרטיסים האלקטרוניים וקבלת התשלום נשלחו לכתובת הדוא"ל שהזנתם.\nאם אינכם רואים את ההודעה בתיבת הדואר הנכנס, אנא בדקו גם את תיקיית הספאם או הדואר הזבל.',
      'אם לא קיבלתם את המייל בתוך 5–10 דקות, אנא פנו אלינו באמצעות טופס יצירת הקשר באתר.',
      'נתראה בהצגה!',
    ],
    button: 'חזרה לאתר',
    dir: 'rtl',
  },
};

function normalizeLang(value: string | null): SuccessLang | null {
  if (value === 'ru' || value === 'en' || value === 'he') return value;
  return null;
}

function detectFallbackLangFromHeaders(acceptLanguage: string): SuccessLang {
  const browserLang = acceptLanguage.toLowerCase();
  if (browserLang.startsWith('he') || browserLang.startsWith('iw') || browserLang.includes(',he') || browserLang.includes(',iw')) return 'he';
  if (browserLang.startsWith('en') || browserLang.includes(',en')) return 'en';
  return 'ru';
}

type PaymentSuccessPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const params = searchParams ? await searchParams : {};
  const langParam = getQueryParam(params, 'lang');
  const showParam = getQueryParam(params, 'show');
  const returnParam = getQueryParam(params, 'return');
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') ?? '';
  const lang = normalizeLang(langParam ?? null) ?? detectFallbackLangFromHeaders(acceptLanguage);
  const showSlug = showParam && isShowSlug(showParam) ? showParam : undefined;
  const returnUrl = resolveSafeReturnUrl(returnParam, '/', { showSlug });

  const content = SUCCESS_CONTENT[lang];
  const rtl = content.dir === 'rtl';

  return (
    <main className="min-h-screen bg-[radial-gradient(80%_60%_at_50%_0%,rgba(234,88,12,0.15),rgba(2,6,23,0.96)_70%)] px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <section
          dir={rtl ? 'rtl' : 'ltr'}
          className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-[0_18px_60px_-30px_rgba(234,88,12,0.55)] md:p-8"
        >
          <h1 className={`text-2xl font-semibold text-amber-100 md:text-3xl ${rtl ? 'text-right' : ''}`}>
            {content.title}
          </h1>

          <div className={`mt-6 space-y-4 text-sm leading-7 text-slate-200 md:text-base ${rtl ? 'text-right' : ''}`}>
            {content.paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>

          <div className={`mt-8 ${rtl ? 'text-right' : ''}`}>
            <Link
              href={returnUrl}
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
