'use client';

import Image from 'next/image';
import { useState } from 'react';

type Lang = 'ru' | 'he' | 'en';

type TeamActor = { name: string; role: string };

type Content = {
  title: string;
  seoSubtitle: string;
  heroSecondary: string;
  teaserVideoUrl: string;
  heroBadge: string;
  menuInvite: string;
  menuAbout: string;
  menuSchedule: string;
  menuMedia: string;
  menuTeam: string;
  sectionAbout: string;
  sectionFlyer: string;
  sectionPoster: string;
  sectionSchedule: string;
  sectionTeaser: string;
  sectionFragments: string;
  sectionPhotos: string;
  sectionTeam: string;
  sectionContact: string;
  sectionDownloads: string;
  flyerDownload: string;
  posterDownload: string;
  photosDownload: string;
  // новые поля для разных файлов по языкам:
  posterImage: string;
  posterPdf: string;
  flyerPdf: string;
  photosArchive: string;
  aboutText: string;
  contactText: string;
  contactWhatsappLabel: string;
  ageLabel: string;
  durationLabel: string;
  formatLabel: string;
  infoAgeValue: string;
  infoDurationValue: string;
  infoFormatValue: string;
  faqTitle: string;
  faqItems: { q: string; a: string }[];
  scheduleDateLabel: string;
  scheduleTimeLabel: string;
  schedulePlaceLabel: string;
  scheduleFormatLabel: string;
  scheduleLanguageLabel: string;
  scheduleRows: {
    date: string;
    time: string;
    place: string;
    format: string;
    language: string;
  }[];
  teamAuthorTitle: string;
  teamAuthorName: string;
  teamDirectorTitle: string;
  teamDirectorName: string;
  teamActorsTitle: string;
  teamActors: TeamActor[];
  photoDownloadLabel: string;
  carouselOpenLabel: string;
  carouselDownloadLabel: string;
  carouselPrevLabel: string;
  carouselNextLabel: string;
  carouselCloseLabel: string;
};

const CONTENT: Record<Lang, Content> = {
  ru: {
    title: 'Козочка Злата',
    seoSubtitle:
      'Трогательный, весёлый и немножко грустный спектакль по мотивам сказки Исаака Башевиса-Зингера и еврейских притч.\nНа маленькой сцене оживают куклы, тени и домики с огоньками в окнах, звучат еврейские мелодии, скрипка, гитара и калимба.',
    heroSecondary:
      'С двумя чемоданами удивительных предметов театр приедет к вам в гости и привезёт настоящую волшебную Хануку в детский сад, школу, студию и даже квартиру.',
    teaserVideoUrl: 'https://www.youtube.com/embed/BKbsaDnkzJA',
    heroBadge: 'Ханукальная история о любви и чуде',
    menuInvite: 'Пригласить театр',
    menuAbout: 'О спектакле',
    menuSchedule: 'Расписание',
    menuMedia: 'Видео и фото',
    menuTeam: 'Команда',
    sectionAbout: 'Подробнее о спектакле',
    sectionFlyer: 'Флаер',
    sectionPoster: 'Афиша',
    sectionSchedule: 'Расписание спектаклей',
    sectionTeaser: 'Видео-тизер',
    sectionFragments: 'Видео с фрагментами',
    sectionPhotos: 'Фотографии',
    sectionTeam: 'Команда спектакля',
    sectionContact: 'Контакты',
    sectionDownloads: 'Скачать материалы',
    flyerDownload: 'Скачать флаер',
    posterDownload: 'Скачать афишу',
    photosDownload: 'Скачать фото-пакет',
    // русские файлы
    posterImage: '/files/poster-kozocka-zlata-ru.png',
    posterPdf: '/files/poster-kozocka-zlata-ru.pdf',
    flyerPdf: '/files/flyer-kozocka-zlata-ru.pdf',
    photosArchive: '/files/photos-kozocka-zlata-ru.zip',
    aboutText: `В маленьком домишке,
Вечером у печки
Сны прядет детишкам
Мама на скамеечке...

О чем сны? Ну, это как обычно в еврейской сказочке:

Про облачко, про дождичек,
Про белую про козочку...

А еще про опасное приключение и настоящую любовь, про доверие, страх и смелость, и про чудо, которое вдруг происходит в самый тёмный зимний вечер.

Дети погружаются в сказку с хорошим концом, а философские обертона спектакля будут интересны взрослым.`,
    contactText:
      'Чтобы пригласить спектакль в вашу организацию, написать нам проще всего в WhatsApp или на почту. Расскажите, для кого вы планируете показ, и мы подберём удобную дату и формат.',
    contactWhatsappLabel: 'Написать в WhatsApp',
    ageLabel: 'Возраст',
    durationLabel: 'Продолжительность',
    formatLabel: 'Формат',
    infoAgeValue: '4–5 до 10–12 лет и взрослые',
    infoDurationValue: '45 минут',
    infoFormatValue: 'Для взрослых в присутствии детей 🙂',
    faqTitle: 'Частые вопросы',
    faqItems: [
      {
        q: 'Что нужно, чтобы пригласить спектакль к себе?',
        a: 'Для показа спектакля нужен небольшой зал, студия или школьный класс с возможностью затемнения. Напишите нам в вотсапп и мы согласуем детали.',
      },
      {
        q: 'Можно ли показывать спектакль в большом театральном зале?',
        a: 'Теоретически спектакль можно играть и на большой сцене, у нас был такой опыт. Но лучше всего он звучит в камерной атмосфере, когда зрители расположены прямо напротив центра сцены, с размахом не более 4 метров. Идеально, если детей можно посадить ближе и ярусно — например, на подушки или коврики.',
      },
      {
        q: 'Нужно ли для приезда спектакля специальное оборудование?',
        a: 'Нужны затемнение, розетка 220V и свободное пространство перед зрителями. Всё остальное — свет, звук, куклы и декорации — мы привозим с собой.',
      },
      {
        q: 'Можно ли прийти с малышом, младше 4 лет?',
        a: 'Мы рекомендуем спектакль детям от 4–5 лет, а оптимально — с 6 лет. Вы можете привести ребёнка младше, но, пожалуйста, оставайтесь рядом и обращайте внимание на его состояние: чтобы ему не было страшно, скучно или слишком утомительно. В крайнем случае всегда можно ненадолго выйти из зала, чтобы не мешать другим зрителям.',
      },
      {
        q: 'Можно ли оставить ребенка одного на спектакле?',
        a: 'Начиная примерно с 9 лет ребёнка уже можно оставить на спектакле одного. Но для нас очень важно, чтобы большинство родителей тоже были в зале — и дело не в дисциплине. Многие смысловые и эмоциональные обертона спектакля обращены именно к взрослым, и когда рядом нет тех, кому их адресовать, нам по-настоящему грустно. Мы искренне верим, что «Козочка Злата» станет общим переживанием и темой для последующих разговоров для всей вашей семьи.',
      },
      {
        q: 'Нужно ли взрослым покупать билет?',
        a: 'Да, билет нужен каждому зрителю.',
      },
    ],
    scheduleDateLabel: 'Дата',
    scheduleTimeLabel: 'Время',
    schedulePlaceLabel: 'Место',
    scheduleFormatLabel: 'Формат',
    scheduleLanguageLabel: 'Язык',
    scheduleRows: [
      {
        date: '28 ноября',
        time: '09:00',
        place: 'Иерусалим, школа',
        format: 'Закрытый показ',
        language: 'Иврит',
      },
      {
        date: '09 декабря',
        time: '18:00',
        place: 'Иерусалим, Матнас Гило',
        format: 'Закрытый показ',
        language: 'Русский',
      },
      {
        date: '11 декабря',
        time: '17:00',
        place: 'Нагария',
        format: 'Открытый показ',
        language: 'Русский',
      },
      {
        date: '18 декабря',
        time: '18:00',
        place: 'Хайфа, фестиваль «В Чемодане»',
        format: 'Открытый показ',
        language: 'Иврит',
      },
      {
        date: '19 декабря',
        time: '11:00',
        place: 'Хайфа, Матнас Адар',
        format: 'Открытый показ',
        language: 'Русский',
      },
      {
        date: '21 декабря',
        time: '17:00',
        place: 'Хайфа',
        format: 'Открытый показ',
        language: 'Иврит',
      },
    ],
    teamAuthorTitle: 'Автор проекта и сценария',
    teamAuthorName: 'Елена Шамис',
    teamDirectorTitle: 'Режиссёр, художник и бутафор',
    teamDirectorName: 'Саша Лунякова',
    teamActorsTitle: 'Актёры',
    teamActors: [
      { name: 'Саша Скворцова', role: 'скрипка, работа с куклами' },
      { name: 'Игорь Белый', role: 'гитара, вокал' },
      { name: 'Елена Шамис', role: 'вокал, работа с куклами' },
    ],
    photoDownloadLabel: 'Скачать',
    carouselOpenLabel: 'Открыть крупнее',
    carouselDownloadLabel: 'Скачать фото',
    carouselPrevLabel: 'Предыдущее фото',
    carouselNextLabel: 'Следующее фото',
    carouselCloseLabel: 'Закрыть',
  },
  he: {
    title: 'עזונת זלטה',
    seoSubtitle:
      'הצגה עדינה, שמחה וקצת עצובה על פי סיפורו של יצחק בשביס-זינגר ומשלים יהודיים.\nעל הבמה הקטנה מתעוררות לחיים בובות וצללים, בתים עם אורות בחלונות, ונשמעות מנגינות יהודיות, כינור, גיטרה וקלימבה.',
    heroSecondary:
      'עם שתי מזוודות מלאות חפצים מופלאים נגיע להתארח אצלכם ונביא חנוכה קסומה באמת לגן הילדים, לבית הספר, לסטודיו ואפילו לדירה.',
    teaserVideoUrl: 'https://www.youtube.com/embed/bfUlrKhn6UI',
    heroBadge: 'סיפור חנוכה על אהבה וניסים',
    menuInvite: 'להזמין את התיאטרון',
    menuAbout: 'על ההצגה',
    menuSchedule: 'לוח הופעות',
    menuMedia: 'וידאו ותמונות',
    menuTeam: 'היוצרים',
    sectionAbout: 'על ההצגה',
    sectionFlyer: 'פלייר',
    sectionPoster: 'פוסטר',
    sectionSchedule: 'לוח הופעות',
    sectionTeaser: 'וידאו טיזר',
    sectionFragments: 'קטעי וידאו',
    sectionPhotos: 'תמונות',
    sectionTeam: 'על היוצרים',
    sectionContact: 'יצירת קשר',
    sectionDownloads: 'חומרים להורדה',
    flyerDownload: 'הורדת פלייר',
    posterDownload: 'הורדת פוסטר',
    photosDownload: 'הורדת חבילת תמונות',
    // ивритские файлы
    posterImage: '/files/poster-kozocka-zlata-he.png',
    posterPdf: '/files/poster-kozocka-zlata-he.pdf',
    flyerPdf: '/files/flyer-kozocka-zlata-he.pdf',
    photosArchive: '/files/photos-kozocka-zlata-he.zip',
    aboutText: `בבית קטן,
בערב ליד התנור
אמא יושבת על הספסל
וטווה חלומות לילדים...

על מה חולמים? כמו בכל אגדה יהודית:

על ענן קטן ועל גשם,
על עז לבנה...

ועל הרפתקה מסוכנת ואהבה אמיתית, על אמון, פחד ואומץ, ועל נס שמופיע לפתע בערב החורפי הכי חשוך.

הילדים נשאבים אל האגדה עם סוף טוב, והניואנסים הפילוסופיים מרתקים גם את המבוגרים.`,
    contactText:
      'כדי להזמין את ההצגה לארגון או לקהילה שלכם, אפשר לכתוב לנו ב-WhatsApp או במייל. ספרו לנו על הקהל שלכם ונשמח להתאים תאריך ומבנה.',
    contactWhatsappLabel: 'לכתוב ב-WhatsApp',
    ageLabel: 'גיל',
    durationLabel: 'משך',
    formatLabel: 'פורמט',
    infoAgeValue: 'לילדים מגיל 4–5 ועד מבוגרים',
    infoDurationValue: '45 דקות',
    infoFormatValue: 'למבוגרים בנוכחות ילדים 🙂',
    faqTitle: 'שאלות נפוצות',
    faqItems: [
      {
        q: 'מה צריך כדי להזמין את ההצגה אליכם?',
        a: 'נדרש חלל קטן — אולם, סטודיו או כיתה שניתן להחשיך. כתבו לנו ב-WhatsApp ונעבור יחד על הפרטים.',
      },
      {
        q: 'האם אפשר להציג באולם תיאטרון גדול?',
        a: 'אפשר, כבר הופענו כך, אבל ההצגה הכי חזקה במרחב אינטימי כשהקהל נמצא עד כ-4 מטר מהמסך וניתן להושיב את הילדים קרוב ובשכבות.',
      },
      {
        q: 'האם נדרש ציוד מיוחד בשביל ההצגה?',
        a: 'צריך חושך חלקי, שקע 220V ומרחב פנוי מול הקהל. תאורה, סאונד, בובות ותפאורה — אנחנו מביאים.',
      },
      {
        q: 'האם אפשר להגיע עם פעוט צעיר מגיל 4?',
        a: 'המלצה רשמית היא מגיל 4–5 והכי נעים מגיל 6. אם מביאים ילד צעיר יותר, הישארו לידו וודאו שנוח לו — ותמיד אפשר לצאת לרגע כדי לא להפריע לאחרים.',
      },
      {
        q: 'אפשר להשאיר את הילדים לבד באולם?',
        a: 'בערך מגיל 9 זה אפשרי, אבל חשוב לנו שהמבוגרים גם יהיו נוכחים. חלק גדול מהניואנסים הרגשיים מופנה אליכם, כדי שההצגה תהיה חוויה משפחתית משותפת.',
      },
      {
        q: 'האם המבוגרים צריכים כרטיס?',
        a: 'כן, כל צופה צריך כרטיס.',
      },
    ],
    scheduleDateLabel: 'תאריך',
    scheduleTimeLabel: 'שעה',
    schedulePlaceLabel: 'מקום',
    scheduleFormatLabel: 'פורמט',
    scheduleLanguageLabel: 'שפה',
    scheduleRows: [
      {
        date: '28 בנובמבר',
        time: '09:00',
        place: 'ירושלים, בית ספר',
        format: 'מופע סגור',
        language: 'עברית',
      },
      {
        date: '9 בדצמבר',
        time: '18:00',
        place: 'ירושלים, מתנ"ס גילה',
        format: 'מופע סגור',
        language: 'רוסית',
      },
      {
        date: '11 בדצמבר',
        time: '17:00',
        place: 'נהריה',
        format: 'מופע פתוח',
        language: 'רוסית',
      },
      {
        date: '18 בדצמבר',
        time: '18:00',
        place: 'חיפה, פסטיבל "במזוודה"',
        format: 'מופע פתוח',
        language: 'עברית',
      },
      {
        date: '19 בדצמבר',
        time: '11:00',
        place: 'חיפה, מתנ"ס הדר',
        format: 'מופע פתוח',
        language: 'רוסית',
      },
      {
        date: '21 בדצמבר',
        time: '17:00',
        place: 'חיפה',
        format: 'מופע פתוח',
        language: 'עברית',
      },
    ],
    teamAuthorTitle: 'מחברת הפרויקט והתסריט',
    teamAuthorName: 'ילנה שמיס',
    teamDirectorTitle: 'במאית, מעצבת ובונת אביזרים',
    teamDirectorName: 'סשה לוניאקובה',
    teamActorsTitle: 'השחקנים',
    teamActors: [
      { name: 'סשה סקבורצובה', role: 'כינור והפעלת בובות' },
      { name: 'איגור ביילי', role: 'גיטרה ושירה' },
      { name: 'ילנה שמיס', role: 'שירה והפעלת בובות' },
    ],
    photoDownloadLabel: 'להוריד',
    carouselOpenLabel: 'להגדיל',
    carouselDownloadLabel: 'להוריד את התמונה',
    carouselPrevLabel: 'הקודם',
    carouselNextLabel: 'הבא',
    carouselCloseLabel: 'לסגור',
  },
  en: {
    title: 'Little Goat Zlata',
    seoSubtitle:
      'A touching, joyful and slightly bittersweet performance based on a story by Isaac Bashevis Singer and Jewish parables.\nOn the small stage puppets, shadows and tiny houses with glowing windows come alive, accompanied by Jewish melodies, violin, guitar and kalimba.',
    heroSecondary:
      'With two suitcases of wondrous props the theatre will come to your venue and bring a truly magical Hanukkah to a kindergarten, school, studio or even an apartment.',
    teaserVideoUrl: 'https://www.youtube.com/embed/BKbsaDnkzJA',
    heroBadge: 'A Hanukkah story about love and miracles',
    menuInvite: 'Invite the theatre',
    menuAbout: 'About the show',
    menuSchedule: 'Schedule',
    menuMedia: 'Video & photos',
    menuTeam: 'Team',
    sectionAbout: 'About the show',
    sectionFlyer: 'Flyer',
    sectionPoster: 'Poster',
    sectionSchedule: 'Performance schedule',
    sectionTeaser: 'Teaser video',
    sectionFragments: 'Video fragments',
    sectionPhotos: 'Photos',
    sectionTeam: 'About the team',
    sectionContact: 'Contact',
    sectionDownloads: 'Downloads',
    flyerDownload: 'Download flyer',
    posterDownload: 'Download poster',
    photosDownload: 'Download photo pack',
    // английские файлы
    posterImage: '/files/poster-kozocka-zlata-en.png',
    posterPdf: '/files/poster-kozocka-zlata-en.pdf',
    flyerPdf: '/files/flyer-kozocka-zlata-en.pdf',
    photosArchive: '/files/photos-kozocka-zlata-en.zip',
    aboutText: `In a tiny house,
On an evening by the stove
A mother sits on a small bench
Spinning dreams for the children...

What are those dreams about? As in every Jewish fairytale:

About a cloud and a drizzle,
About a little white goat...

And about a dangerous adventure and true love, about trust, fear and courage, and about a miracle that suddenly happens on the darkest winter evening.

Children dive into the fairytale with a happy ending, while its philosophical overtones stay with adults as well.`,
    contactText:
      'To invite the show to your organisation, please write to us on WhatsApp or by e-mail. Tell us about your audience and we will suggest dates and format.',
    contactWhatsappLabel: 'Write on WhatsApp',
    ageLabel: 'Age',
    durationLabel: 'Duration',
    formatLabel: 'Format',
    infoAgeValue: 'Ages 4–5 to 10–12 and adults',
    infoDurationValue: '45 minutes',
    infoFormatValue: 'For adults in the presence of children 🙂',
    faqTitle: 'FAQ',
    faqItems: [
      {
        q: 'What do we need to host the show?',
        a: 'A small hall, studio or classroom that can be darkened. Send us a WhatsApp message and we will coordinate the details.',
      },
      {
        q: 'Can you perform in a large theatre hall?',
        a: 'It is possible — we have done it — but the show feels best in an intimate setting with the audience no farther than about four metres from the screen and kids seated close on cushions or risers.',
      },
      {
        q: 'Do you require any special equipment?',
        a: 'We only need partial darkness, a 220V socket and free space in front of the audience. Lighting, sound, puppets and set travel with us.',
      },
      {
        q: 'Can we bring younger children under four?',
        a: 'We recommend the show from ages 4–5, ideally from 6. You may bring a younger child, just stay nearby and watch if the experience feels comfortable, and step out briefly if needed.',
      },
      {
        q: 'Can children attend without parents?',
        a: 'From about age nine they can, but we truly love when adults are in the room: many emotional nuances are addressed to you, so the show becomes a shared family experience.',
      },
      {
        q: 'Do adults need a ticket?',
        a: 'Yes, every audience member needs a ticket.',
      },
    ],
    scheduleDateLabel: 'Date',
    scheduleTimeLabel: 'Time',
    schedulePlaceLabel: 'Venue',
    scheduleFormatLabel: 'Format',
    scheduleLanguageLabel: 'Language',
    scheduleRows: [
      {
        date: '28 November',
        time: '09:00',
        place: 'Jerusalem, school',
        format: 'Private performance',
        language: 'Hebrew',
      },
      {
        date: '9 December',
        time: '18:00',
        place: 'Jerusalem, Matnas Gilo',
        format: 'Private performance',
        language: 'Russian',
      },
      {
        date: '11 December',
        time: '17:00',
        place: 'Nahariya',
        format: 'Public performance',
        language: 'Russian',
      },
      {
        date: '18 December',
        time: '18:00',
        place: 'Haifa, “In the Suitcase” festival',
        format: 'Public performance',
        language: 'Hebrew',
      },
      {
        date: '19 December',
        time: '11:00',
        place: 'Haifa, Matnas Hadar',
        format: 'Public performance',
        language: 'Russian',
      },
      {
        date: '21 December',
        time: '17:00',
        place: 'Haifa',
        format: 'Public performance',
        language: 'Hebrew',
      },
    ],
    teamAuthorTitle: 'Project & script author',
    teamAuthorName: 'Elena Shamis',
    teamDirectorTitle: 'Director, designer & prop maker',
    teamDirectorName: 'Sasha Lunyakova',
    teamActorsTitle: 'Cast',
    teamActors: [
      { name: 'Sasha Skvortsova', role: 'violin, puppetry' },
      { name: 'Igor Bely', role: 'guitar, vocals' },
      { name: 'Elena Shamis', role: 'vocals, puppetry' },
    ],
    photoDownloadLabel: 'Download',
    carouselOpenLabel: 'View larger',
    carouselDownloadLabel: 'Download photo',
    carouselPrevLabel: 'Previous photo',
    carouselNextLabel: 'Next photo',
    carouselCloseLabel: 'Close',
  },
};

const whatsappLink =
  'https://wa.me/972533219998?text=' +
  encodeURIComponent(
    'Здравствуйте! Хочу пригласить спектакль «Козочка Злата». Напишите, пожалуйста, какие есть даты и условия.'
  );
// TODO: вставьте сюда реальный телефон в формате 972.... без плюса

const CAROUSEL_PHOTOS = [
  { src: '/photos/kozocka-1.jpg', alt: 'Кадр спектакля «Козочка Злата» 1' },
  { src: '/photos/kozocka-2.jpg', alt: 'Кадр спектакля «Козочка Злата» 2' },
  { src: '/photos/kozocka-3.jpg', alt: 'Кадр спектакля «Козочка Злата» 3' },
  { src: '/photos/kozocka-4.jpg', alt: 'Кадр спектакля «Козочка Злата» 4' },
];

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ru');
  const t = CONTENT[lang];

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(151,170,184,0.70) 0%, rgba(64,86,105,0.85) 100%), url('/images/forest.png')",
      }}
    >
      {/* полупрозрачный "ледяной" слой уже смешан с лесом выше */}
      <div className="min-h-screen text-[var(--text-color, #fdf4e3)]">
        <header className="sticky top-0 z-20 bg-[rgba(32,20,12,0.96)]/95 backdrop-blur-sm border-b border-[rgba(255,255,255,0.1)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80 whitespace-nowrap">
                Театр «Рыба Кива»
              </div>
              <div className="inline-flex items-center bg-[rgba(0,0,0,0.3)] rounded-full px-3 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-amber-100/85 whitespace-nowrap ml-2">
                <span>{t.heroBadge}</span>
              </div>
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              <a href="#about" className="hover:text-amber-200 transition">
                {t.menuAbout}
              </a>
              <a href="#schedule" className="hover:text-amber-200 transition">
                {t.menuSchedule}
              </a>
              <a href="#media" className="hover:text-amber-200 transition">
                {t.menuMedia}
              </a>
              <a href="#team" className="hover:text-amber-200 transition">
                {t.menuTeam}
              </a>
            </nav>
            <div className="flex items-center gap-3">
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
              <div className="space-y-4 text-sm md:text-base leading-relaxed text-amber-50/90 whitespace-pre-line">
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
                    <th className="px-4 py-3 text-left">{t.scheduleDateLabel}</th>
                    <th className="px-4 py-3 text-left">{t.scheduleTimeLabel}</th>
                    <th className="px-4 py-3 text-left">{t.schedulePlaceLabel}</th>
                    <th className="px-4 py-3 text-left">{t.scheduleFormatLabel}</th>
                    <th className="px-4 py-3 text-left">{t.scheduleLanguageLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/10 text-amber-50/90">
                  {t.scheduleRows.map((row) => (
                    <tr key={`${row.date}-${row.time}-${row.place}`}>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">{row.time}</td>
                      <td className="px-4 py-3">{row.place}</td>
                      <td className="px-4 py-3">{row.format}</td>
                      <td className="px-4 py-3">{row.language}</td>
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
              {[1, 2, 3, 4, 5, 6].map((n) => (
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
            <div className="space-y-5 text-sm md:text-base text-amber-50/90 leading-relaxed bg-[rgba(0,0,0,0.35)] border border-amber-100/15 rounded-2xl p-5">
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
}: {
  photos: { src: string; alt: string }[];
  labels: {
    open: string;
    download: string;
    prev: string;
    next: string;
    close: string;
  };
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
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-amber-50 rounded-full w-9 h-9 flex items-center justify-center transition"
            aria-label={labels.prev}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-amber-50 rounded-full w-9 h-9 flex items-center justify-center transition"
            aria-label={labels.next}
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={openZoom}
          className="text-xs md:text-sm text-amber-100/80 underline-offset-4 hover:underline self-start"
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
            className="absolute top-6 right-6 text-4xl text-amber-50 hover:text-amber-300 transition"
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
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-amber-50 rounded-full w-14 h-14 flex items-center justify-center text-3xl transition"
                aria-label={labels.prev}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-amber-50 rounded-full w-14 h-14 flex items-center justify-center text-3xl transition"
                aria-label={labels.next}
              >
                ›
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
