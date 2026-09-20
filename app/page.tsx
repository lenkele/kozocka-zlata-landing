import Image from 'next/image';
import Link from 'next/link';

import { SHOWS, SHOW_SLUGS } from '@/shows';
import type { ShowConfig, ShowSlug } from '@/shows/types';

const WHATSAPP_INVITE_URL =
  'https://wa.me/972533219998?text=' +
  encodeURIComponent('Здравствуйте! Хочу пригласить театр «Рыба Кива». Расскажите, пожалуйста, какие есть даты и условия.');

type ShowHomeCopy = {
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
};

const SHOW_HOME_COPY: Record<ShowSlug, ShowHomeCopy> = {
  zlata: {
    eyebrow: 'Ханукальная история о любви и чуде',
    title: 'Козочка Злата',
    description:
      'Трогательный, веселый и немножко грустный спектакль по мотивам сказки Исаака Башевиса-Зингера и еврейских притч. История об опасном приключении, настоящей любви и чуде, которое происходит в самый темный зимний вечер.',
    meta: 'С 4-5 лет · 45 минут',
  },
  marita: {
    eyebrow: 'Кукольный мюзикл с живой музыкой',
    title: 'Колдовство Мариты',
    description:
      'Старинная сефардская легенда о принцессе, бедном юноше, злой мачехе и любви, побеждающей смерть. Сказка и философия, смех и печаль, авторские куклы и живая сефардская музыка.',
    meta: 'С 6 лет · 1 час 20 минут',
  },
  'gefilte-lid': {
    eyebrow: 'Как портной и ослик за карпом ходили',
    title: 'Гефилте Лид',
    description:
      'Веселый и трогательный спектакль о том, как портной и ослик отправились за самым красивым карпом. Куклы, тени, проекции, песни разных времен и немного настоящего волшебства.',
    meta: 'С 5 лет · 1 час',
  },
};

const FEATURED_ROWS = [
  {
    month: 'октябрь',
    time: 'вторник, 18:00',
    showSlug: 'marita' as ShowSlug,
    showTitle: 'Колдовство Мариты',
    meta: 'с 4-5 лет · 45 минут',
    city: 'Тель-Авив',
    venue: 'площадка уточняется',
  },
  {
    month: 'октябрь',
    time: 'суббота, 11:30',
    showSlug: 'marita' as ShowSlug,
    showTitle: 'Колдовство Мариты',
    meta: 'С 5 лет · 1 час',
    city: 'Хайфа',
    venue: 'площадка уточняется',
  },
  {
    month: 'октябрь',
    time: 'суббота, 17:00',
    showSlug: 'marita' as ShowSlug,
    showTitle: 'Колдовство Мариты',
    meta: 'С 6 лет · 1 час 20 минут',
    city: 'Иерусалим',
    venue: 'площадка уточняется',
  },
];

function getShowPoster(show: ShowConfig): string {
  return show.content.ru?.posterImage ?? show.content.en?.posterImage ?? show.galleryPhotos[0]?.src ?? '/favicon.png';
}

export default function RootPage() {
  const shows = SHOW_SLUGS.map((slug) => SHOWS[slug]);

  return (
    <main
      className="min-h-screen text-[#f4ecdd]"
      style={{
        fontFamily: "'PT Sans', Arial, Helvetica, sans-serif",
        backgroundColor: '#d9c59b',
        backgroundImage:
          "linear-gradient(rgba(47,36,24,.24), rgba(47,36,24,.34)), url('/images/background1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-4 bg-[#2f2418] px-5 py-3 shadow-[0_6px_24px_rgba(40,28,14,.35)] md:px-7">
        <Link href="/" className="flex flex-col gap-0.5">
          <span className="text-[15px] font-black uppercase tracking-[0.18em] text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            Театр «Рыба Кива»
          </span>
          <span className="text-xs font-bold text-[#d8a24a]">Кукольные спектакли с живой музыкой</span>
        </Link>

        <div className="hidden flex-1 md:block" />

        <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <a
            href="#afisha"
            className="rounded-full bg-[#e8a33d] px-5 py-2.5 text-sm font-black text-[#2f2418] transition hover:bg-[#f6b957]"
            style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
          >
            Афиша
          </a>
          <a
            href="#shows"
            className="rounded-full bg-[#1f1810] px-5 py-2.5 text-sm font-bold text-[#f2c46b] transition hover:text-[#ffd98a]"
            style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
          >
            Спектакли
          </a>
          <a
            href="#invite"
            className="rounded-full bg-[#c9812a] px-5 py-2.5 text-sm font-black text-[#fff6e4] transition hover:bg-[#dd9339]"
            style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
          >
            Пригласить театр
          </a>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.15fr_.85fr] md:px-7 md:py-16">
        <div>
          <div className="mb-7 flex items-center gap-4 sm:gap-5 md:gap-6">
            <Image
              src="/images/ryba-kiva-logo.jpg"
              alt="Логотип театра «Рыба Кива»"
              width={180}
              height={180}
              priority
              className="h-24 w-24 shrink-0 object-contain mix-blend-multiply md:h-28 md:w-28"
            />
            <h1
              className="min-w-0 text-[34px] font-black leading-[1.05] text-[#fdf1d4] [text-wrap:balance] sm:text-[40px] md:text-[46px]"
              style={{ fontFamily: 'Nunito, Arial, sans-serif', textShadow: '0 3px 18px rgba(47,36,24,.45)' }}
            >
              Рыба Кива вас ждёт
            </h1>
          </div>

          <div className="space-y-4">
            <TextPanel>
              Мы приезжаем с целым маленьким миром в паре чемоданов: куклами, декорациями, светом и музыкальными инструментами.
              <br />
              Играем в камерных залах, детских садах, школах, студиях и даже дома.
            </TextPanel>
            <TextPanel>
              Наши спектакли интересно смотреть вместе - детям, подросткам и взрослым.
              <br />
              Мы говорим, что это спектакли для взрослых в присутствии детей.
            </TextPanel>
            <TextPanel>
              Куклы, тени, проекции, песни, скрипка, гитара, клавиши, калимба, укулеле и многое другое. Сказки, в которых детям достаются приключения и
              чудеса, а взрослым - смех и печаль, спрятавшиеся между строк.
            </TextPanel>
          </div>
        </div>

        <div className="relative mx-auto h-[500px] w-full max-w-[480px] sm:h-[600px] md:h-[690px] md:max-w-none">
          <div className="absolute left-1 top-2 z-0 w-[61%] -rotate-[4deg] rounded-[4px] bg-[#fff8ea] p-2.5 shadow-[0_22px_44px_rgba(47,36,24,.42)] sm:left-4 sm:top-4 sm:w-[58%] md:left-0 md:top-2 md:w-[64%]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-[2px]">
              <Image
                src="/images/theatre-team.JPG"
                alt="Команда театра «Рыба Кива»"
                fill
                priority
                sizes="(min-width: 768px) 24vw, 58vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="absolute bottom-2 right-0 z-10 w-[88%] rotate-[3deg] rounded-[4px] bg-[#fff8ea] p-2.5 shadow-[0_24px_48px_rgba(47,36,24,.5)] sm:bottom-4 sm:w-[84%] md:-right-3 md:bottom-6 md:w-[86%]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2px]">
              <Image
                src="/images/theatre-performance.jpg"
                alt="Спектакль театра «Рыба Кива»"
                fill
                priority
                sizes="(min-width: 768px) 34vw, 84vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="afisha" className="mx-auto max-w-6xl px-5 pb-2 pt-6 md:px-7">
        <SectionKicker>Афиша</SectionKicker>
        <SectionTitle>Ближайшие показы</SectionTitle>
        <p className="mb-7 max-w-3xl text-lg leading-7 text-[#3f3020]">
          Открытые показы, на которые можно купить билет. Если в вашем городе нас пока нет - напишите, и мы приедем.
        </p>

        <div className="overflow-hidden rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418cc]">
          {FEATURED_ROWS.map((row, index) => (
            <div
              key={`${row.showSlug}-${index}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 md:px-7"
              style={{ borderBottom: index === FEATURED_ROWS.length - 1 ? undefined : '1px solid rgba(242,196,107,.14)' }}
            >
              <div className="w-36">
                <div className="text-[22px] font-black text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                  {row.month}
                </div>
                <div className="text-[15px] text-[#c6b699]">{row.time}</div>
              </div>
              <div className="min-w-44 flex-1">
                <Link href={`/${row.showSlug}`} className="text-xl font-black text-[#fdf1d4] hover:text-[#ffd98a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                  {row.showTitle}
                </Link>
                <div className="text-[15px] text-[#c6b699]">{row.meta}</div>
              </div>
              <div className="min-w-32 flex-1 text-[16.5px]">
                {row.city}
                <div className="text-[15px] text-[#c6b699]">{row.venue}</div>
              </div>
              <Link
                href={`/${row.showSlug}#schedule`}
                className="ml-auto whitespace-nowrap rounded-full bg-[#e8a33d] px-5 py-2.5 text-sm font-black text-[#2f2418] transition hover:bg-[#f6b957]"
                style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
              >
                Билеты
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="shows" className="mx-auto max-w-6xl px-5 py-14 md:px-7">
        <SectionKicker>Репертуар</SectionKicker>
        <SectionTitle>Спектакли театра</SectionTitle>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {shows.map((show) => {
            const copy = SHOW_HOME_COPY[show.slug];
            return (
              <article key={show.slug} className="flex min-h-full gap-4 rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418c7] p-4 transition hover:border-[#f2c46b73] hover:bg-[#2f2418eb]">
                <Link href={`/${show.slug}`} className="relative block h-28 w-[4.6rem] shrink-0 overflow-hidden rounded-md bg-[#5f5d5c] sm:h-32 sm:w-20">
                  <Image src={getShowPoster(show)} alt={`Афиша «${copy.title}»`} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#d8a24a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    {copy.eyebrow}
                  </div>
                  <Link href={`/${show.slug}`} className="text-2xl font-black leading-tight text-[#fdf1d4] hover:text-[#ffd98a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    {copy.title}
                  </Link>
                  <p className="text-[15.5px] leading-6 text-[#eadfc9]">{copy.description}</p>
                  <div className="mt-auto text-[15px] text-[#c6b699]">{copy.meta}</div>
                  <div className="flex flex-wrap gap-3 pt-1 text-[15.5px] font-black" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
                    <Link href={`/${show.slug}`} className="text-[#f2c46b] hover:text-[#ffd98a]">
                      О спектакле →
                    </Link>
                    <Link href={`/${show.slug}#schedule`} className="text-[#f2c46b] hover:text-[#ffd98a]">
                      Расписание →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="invite" className="mx-auto max-w-6xl px-5 py-6 md:px-7">
        <div className="rounded-[22px] border border-[#f2c46b2e] bg-[#2f2418cc] px-5 py-8 md:px-10 md:py-10">
          <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-[#d8a24a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            Пригласить театр
          </div>
          <h2 className="mb-3 text-3xl font-black text-[#fdf1d4] md:text-[38px]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            Хотите, чтобы «Рыба Кива» приехала к вам?
          </h2>
          <p className="mb-8 max-w-3xl text-lg leading-7 text-[#eadfc9]">
            Просто напишите нам.
            <br />
            Мы поможем выбрать спектакль, договоримся о дате и обсудим площадку.
          </p>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <InviteStep number="1">Расскажите, для кого показ, где он состоится и сколько будет зрителей.</InviteStep>
            <InviteStep number="2">Нам нужны затемнение, розетка 220V и свободное место перед зрителями.</InviteStep>
            <InviteStep number="3">Свет, звук, куклы и декорации мы привозим с собой.</InviteStep>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={WHATSAPP_INVITE_URL}
              className="rounded-full bg-[#e8a33d] px-6 py-3.5 text-[17px] font-black text-[#2f2418] transition hover:bg-[#f6b957]"
              style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
            >
              Написать в WhatsApp
            </a>
            <a
              href="mailto:info@ryba-kiva.com"
              className="rounded-full border border-[#f2c46b73] px-6 py-3.5 text-[17px] font-black text-[#f2c46b] transition hover:bg-[#f2c46b1f] hover:text-[#ffd98a]"
              style={{ fontFamily: 'Nunito, Arial, sans-serif' }}
            >
              info@ryba-kiva.com
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-6xl gap-7 px-5 py-14 md:grid-cols-2 md:px-7">
        <div>
          <SectionKicker>О театре</SectionKicker>
          <SectionTitle>Театр для детей и взрослых</SectionTitle>
          <div className="mt-5 space-y-4 text-lg leading-7 text-[#3f3020]">
            <p>
              «Рыба Кива» - независимый камерный кукольный театр. Каждый наш спектакль собирается вручную: из авторских кукол и декораций, теней, света,
              музыки и историй, которые хочется унести с собой.
            </p>
            <p>
              Дети следят за приключением, смеются, немного пугаются и радуются счастливому финалу. А взрослые замечают другие смыслы - и потом всей семье
              бывает о чем поговорить по дороге домой.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-[#f2c46b2e] bg-[#2f2418c7] px-6 py-6 md:px-7">
          <div className="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#d8a24a]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
            Кто делает театр или был с нами раньше
          </div>
          <div className="grid gap-3.5 text-[17px] leading-6">
            <TeamMember name="Елена Шамис" role="автор проекта и сценариев, сценография, вокал, работа с куклами" />
            <TeamMember name="Саша Скворцова" role="скрипка, вокал, работа с реквизитом, работа с куклами" />
            <TeamMember
              name="Михаил Стародубцев"
              role="Гитара, клавиши, вокал, технические и сценографические решения, музыкальные аранжировки, работа с куклами"
            />
            <TeamMember
              name="Мария Гескина"
              role="Гитара, мелодика, вокал, музыкальные аранжировки, сценографические решения, работа с куклами"
            />
            <TeamMember name="Игорь Белый" role="гитара, вокал" />
            <TeamMember name="Наташа Хенкина" role="работа с реквизитом и куклами" />
            <TeamMember name="Лена Шапиро" role="работа с реквизитом" />
            <TeamMember name="Анна Рахимбердиева" role="работа с реквизитом" />
            <TeamMember name="Саша Лунякова" role="режиссер, художник, бутафор" />
          </div>
        </div>
      </section>

      <footer className="mt-8 bg-[#2f2418] px-5 py-9 md:px-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 text-[15px] font-black uppercase tracking-[0.18em] text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
              Театр «Рыба Кива»
            </div>
            <div className="text-base text-[#c6b699]">
              Кукольные спектакли для всей семьи ·{' '}
              <a href="mailto:info@ryba-kiva.com" className="text-[#f2c46b] hover:text-[#ffd98a]">
                info@ryba-kiva.com
              </a>
            </div>
          </div>
          <nav className="flex flex-wrap gap-4 text-[15px] text-[#c6b699]">
            <a href="#afisha" className="hover:text-[#ffd98a]">
              Афиша
            </a>
            <a href="#shows" className="hover:text-[#ffd98a]">
              Спектакли
            </a>
            <a href="#about" className="hover:text-[#ffd98a]">
              Театр
            </a>
            <Link href="/terms" className="hover:text-[#ffd98a]">
              Условия
            </Link>
            <Link href="/privacy" className="hover:text-[#ffd98a]">
              Политика конфиденциальности
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function TextPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#2f2418b8] px-5 py-5 text-[18.5px] leading-8 text-[#f4ecdd] md:px-6">{children}</div>;
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.2em] text-[#4c3a22]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 text-4xl font-black text-[#fdf1d4] md:text-[42px]"
      style={{ fontFamily: 'Nunito, Arial, sans-serif', textShadow: '0 2px 14px rgba(47,36,24,.4)' }}
    >
      {children}
    </h2>
  );
}

function InviteStep({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-white/10 px-5 py-5">
      <div className="mb-2 text-[22px] font-black text-[#f2c46b]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
        {number}
      </div>
      <div className="text-[16.5px] leading-6">{children}</div>
    </div>
  );
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <div>
      <strong className="font-black text-[#fdf1d4]" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
        {name}
      </strong>
      <div className="text-[15.5px] text-[#c6b699]">{role}</div>
    </div>
  );
}
