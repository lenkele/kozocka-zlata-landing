import { type Content, type Lang } from '../types';

const FILES_BASE = '/shows/zlata/files';

const RU_CONTENT: Content = {
  title: 'Козочка Злата',
  seoSubtitle:
    'Трогательный, весёлый и немножко грустный спектакль по мотивам сказки Исаака Башевиса-Зингера и еврейских притч.\nНа маленькой сцене оживают куклы, тени и домики с огоньками в окнах, звучат еврейские мелодии, скрипка, гитара и калимба.',
  heroSecondary:
    'С двумя чемоданами удивительных предметов театр приедет к вам в гости и привезёт настоящую волшебную Хануку в детский сад, школу, студию и даже квартиру.',
  teaserVideoUrl: 'https://www.youtube.com/embed/BKbsaDnkzJA',
  heroBadge: 'Ханукальная история о любви и чуде',
  theatreLabel: 'Театр «Рыба Кива»',
  menuInvite: 'Пригласить театр',
  menuAbout: 'О спектакле',
  menuSchedule: 'Афиша',
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
  posterImage: `${FILES_BASE}/poster-kozocka-zlata-ru.png`,
  posterPdf: `${FILES_BASE}/poster-kozocka-zlata-ru.pdf`,
  flyerPdf: `${FILES_BASE}/flyer-kozocka-zlata-ru.pdf`,
  photosArchive: `${FILES_BASE}/photos-kozocka-zlata-ru.zip`,
  aboutText: `В маленьком домишке,
Вечером у печки
Сны прядет детишкам
Мама на скамеечке...

О чем сны? Ну, это как обычно в еврейской сказочке:

Про облачко, про дождичек,
Про белую про козочку...

А еще про опасное приключение и настоящую любовь, про доверие, страх и смелость, и про чудо, которое вдруг происходит в самый тёмный зимний вечер.

Дети погружаются в сказку с хорошим концом, а философские обертоны спектакля будут интересны взрослым.`,
  contactText:
    'Чтобы пригласить спектакль к вам в гости, напишите нам в WhatsApp. Расскажите, для кого вы планируете показ, и мы подберём удобную дату и формат.',
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
  scheduleDateLabel: 'Дата',
  scheduleTimeLabel: 'Время',
  schedulePlaceLabel: 'Место',
  scheduleFormatLabel: 'Комментарий',
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
};

const HE_CONTENT: Content = {
  title: 'זלטה העז',
  seoSubtitle:
    'הצגה עדינה, שמחה וקצת עצובה על פי סיפורו של יצחק בשביס-זינגר ומשלים יהודיים.\nעל הבמה הקטנה מתעוררות לחיים בובות וצללים, בתים עם אורות בחלונות, ונשמעות מנגינות יהודיות, כינור, גיטרה וקלימבה.',
  heroSecondary:
    'עם שתי מזוודות מלאות חפצים מופלאים נגיע להתארח אצלכם ונביא חנוכה קסומה לגן הילדים, לבית הספר, לסטודיו ואפילו לדירה.',
  teaserVideoUrl: 'https://www.youtube.com/embed/bfUlrKhn6UI',
  heroBadge: 'סיפור חנוכה על אהבה וניסים',
  theatreLabel: 'תיאטרון ״ריבא קיווא״',
  menuInvite: 'להזמין את התיאטרון',
  menuAbout: 'על ההצגה',
  menuSchedule: 'כרזה',
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
  posterImage: `${FILES_BASE}/poster-kozocka-zlata-he.jpg`,
  posterPdf: `${FILES_BASE}/poster-kozocka-zlata-he.pdf`,
  flyerPdf: `${FILES_BASE}/flyer-kozocka-zlata-he.pdf`,
  photosArchive: `${FILES_BASE}/photos-kozocka-zlata-he.zip`,
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
      a: 'אפשר, כבר הופענו כך, אבל ההצגה הכי חזקה במרחב אינטימי כשהקהל נמצא עד כ-4 מטר מהמסך וניתן להושיב את הילדים קרוב.',
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
      q: 'האם אפשר להשאיר את הילדים לבד באולם?',
      a: 'בערך מגיל 9 זה אפשרי, אבל חשוב לנו שהמבוגרים גם יהיו נוכחים. חלק גדול מהניואנסים הרגשיים מופנה אליכם, כדי שההצגה תהיה חוויה משפחתית משותפת.',
    },
    {
      q: 'האם המבוגרים צריכים כרטיס?',
      a: 'כן, כל צופה צריך כרטיס.',
    },
  ],
  teamAuthorTitle: 'מחברת הפרויקט והתסריט',
  teamAuthorName: 'ילנה שמיס',
  teamDirectorTitle: 'במאית, מעצבת',
  teamDirectorName: 'סשה לוניאקובה',
  teamActorsTitle: 'השחקנים',
  teamActors: [
    { name: 'סשה סקוורצובה', role: 'כינור והפעלת בובות' },
    { name: 'איגור בֶלי', role: 'גיטרה ושירה' },
    { name: 'ילנה שמיס', role: 'שירה והפעלת בובות' },
  ],
  photoDownloadLabel: 'להוריד',
  carouselOpenLabel: 'להגדיל',
  carouselDownloadLabel: 'להוריד את התמונה',
  carouselPrevLabel: 'הקודם',
  carouselNextLabel: 'הבא',
  carouselCloseLabel: 'לסגור',
  scheduleDateLabel: 'תאריך',
  scheduleTimeLabel: 'שעה',
  schedulePlaceLabel: 'מקום',
  scheduleFormatLabel: 'הערה',
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
};

const EN_CONTENT: Content = {
  title: 'Little Goat Zlata',
  seoSubtitle:
    'A touching, joyful and slightly bittersweet performance based on a story by Isaac Bashevis Singer and Jewish parables.\nOn the small stage puppets, shadows and tiny houses with glowing windows come alive, accompanied by Jewish melodies, violin, guitar and kalimba.',
  heroSecondary:
    'With two suitcases of wondrous props the theatre will come to your venue and bring a truly magical Hanukkah to a kindergarten, school, studio or even an apartment.',
  teaserVideoUrl: 'https://www.youtube.com/embed/BKbsaDnkzJA',
  heroBadge: 'A Hanukkah story about love and miracles',
  theatreLabel: 'Ryba Kiva Theatre',
  menuInvite: 'Invite the theatre',
  menuAbout: 'About the show',
  menuSchedule: 'Shows',
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
  posterImage: `${FILES_BASE}/poster-kozocka-zlata-en.png`,
  posterPdf: `${FILES_BASE}/poster-kozocka-zlata-en.pdf`,
  flyerPdf: `${FILES_BASE}/flyer-kozocka-zlata-en.pdf`,
  photosArchive: `${FILES_BASE}/photos-kozocka-zlata-en.zip`,
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
  scheduleDateLabel: 'Date',
  scheduleTimeLabel: 'Time',
  schedulePlaceLabel: 'Venue',
  scheduleFormatLabel: 'Comment',
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
};

export const ZLATA_CONTENT: Record<Lang, Content> = {
  ru: RU_CONTENT,
  he: HE_CONTENT,
  en: EN_CONTENT,
};
