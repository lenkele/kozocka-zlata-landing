import { type Content, type Lang } from '../types';

const FILES_BASE = '/shows/gefilte-lid/files';

const POSTER_IMAGE = `${FILES_BASE}/poster-gefilte-lid-ru.jpg`;
// PDF-версии афиши пока нет — даём скачивать тот же JPG.
const POSTER_DOWNLOAD = `${FILES_BASE}/poster-gefilte-lid-ru.jpg`;
// Отдельного флаера нет — используем афишу как флаер.
const FLYER_DOWNLOAD = `${FILES_BASE}/poster-gefilte-lid-ru.jpg`;
const PHOTOS_ARCHIVE = `${FILES_BASE}/photos-gefilte-lid-ru.zip`;

const RU_CONTENT: Content = {
  title: 'Гефилте Лид',
  seoSubtitle:
    'Баржа летает в небе, уж ползает на спине, субботний карп спасает портного и ослика от волшебных маков: эти и другие удивительные события происходят в спектакле «Гефилте лид», или фаршированная песня от театра Рыба Кива.\nЭто весёлый, красивый и тёплый спектакль для всей семьи, где будут и куклы, и проекции, и живая музыка, и немного волшебства.',
  heroSecondary:
    'С двумя чемоданами удивительных предметов театр приедет к вам в гости и привезёт настоящее волшебство в детский сад, школу, студию и даже квартиру.\nЭто спектакль для всей семьи, интересный по-разному детям примерно с 5 лет, подросткам и родителям.',
  teaserVideoUrl: 'https://www.youtube.com/embed/FpH1vNgcemg',
  heroBadge: 'Весёлая история о том, как портной и ослик за карпом ходили',
  theatreLabel: 'Театр «Рыба Кива»',
  theatreSubtitle: 'Тёплый музыкальный спектакль для всей семьи',
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
  posterImage: POSTER_IMAGE,
  posterPdf: POSTER_DOWNLOAD,
  flyerPdf: FLYER_DOWNLOAD,
  photosArchive: PHOTOS_ARCHIVE,
  aboutText: '',
  contactText:
    'Чтобы пригласить спектакль к вам в гости, напишите нам в WhatsApp. Расскажите, для кого вы планируете показ, и мы подберём удобную дату и формат.',
  contactWhatsappLabel: 'Написать в WhatsApp',
  ageLabel: 'Возраст',
  durationLabel: 'Продолжительность',
  formatLabel: 'Формат',
  infoAgeValue: 'с 5 лет и старше',
  infoDurationValue: '1 час',
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
      q: 'Можно ли прийти с малышом, младше указанного возраста?',
      a: 'Мы рекомендуем спектакль детям с 5 лет. Вы можете привести ребёнка младше, но, пожалуйста, оставайтесь рядом и обращайте внимание на его состояние: чтобы ему не было страшно, скучно или слишком утомительно. В крайнем случае всегда можно ненадолго выйти из зала, чтобы не мешать другим зрителям.',
    },
    {
      q: 'Можно ли оставить ребенка одного на спектакле?',
      a: 'Начиная примерно с 9 лет ребёнка уже можно оставить на спектакле одного. Но для нас очень важно, чтобы большинство родителей тоже были в зале — и дело не в дисциплине. Многие смысловые и эмоциональные обертона спектакля обращены именно к взрослым, и когда рядом нет тех, кому их адресовать, нам по-настоящему грустно. Мы искренне верим, что спектакль станет общим переживанием и темой для последующих разговоров для всей вашей семьи.',
    },
    {
      q: 'Нужно ли взрослым покупать билет?',
      a: 'Да, билет нужен каждому зрителю.',
    },
    {
      q: 'Возврат билетов',
      a: 'Вы можете вернуть билет не позднее 7 дней до мероприятия (за вычетом 5% которые берет платежная система за транзакцию). Позже этого срока билет можно только перенести на любое другое из мероприятий театра, где будут свободные места.',
    },
    {
      q: 'Можно ли купить билет перед спектаклем за наличные?',
      a: 'Билет перед спектаклем за наличные можно купить всегда, когда есть свободные места. Однако, как правило, билеты, купленные заранее, стоят дешевле.',
    },
    {
      q: 'Можно ли получить скидку?',
      a: 'Если вы находитесь в сложном финансовом положении или у вас многодетная семья и вы покупаете много билетов, напишите нам в WhatsApp и мы что-нибудь придумаем.',
    },
  ],
  teamAuthorTitle: 'Авторы сценария и части песен',
  teamAuthorName: 'Игорь Белый и Евгения Славина',
  songsTitle: 'Сценография',
  songsName: 'Елена Шамис',
  teamDirectorTitle: 'Художник',
  teamDirectorName: 'Лена Шапиро',
  masterTitle: 'Куклы',
  masterName: 'Юлия Губкина',
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
  scheduleRows: [],
};

const EN_CONTENT: Content = {
  title: 'Gefilte Lid',
  seoSubtitle:
    'A barge flies through the sky, a snake crawls on its back, a Shabbat carp rescues a tailor and a donkey from enchanted poppies: these and other wondrous events happen in “Gefilte Lid” — the stuffed song — by Ryba Kiva theatre.\nIt is a cheerful, beautiful and warm show for the whole family, with puppets, projections, live music and a little bit of magic.',
  heroSecondary:
    'With two suitcases of wondrous props the theatre will come to your venue and bring real magic to a kindergarten, school, studio or even an apartment.\nIt is a show for the whole family — children from about five, teenagers and parents all find something for themselves.',
  teaserVideoUrl: 'https://www.youtube.com/embed/FpH1vNgcemg',
  heroBadge: 'A cheerful tale of a tailor and a donkey who went after a carp',
  theatreLabel: 'Ryba Kiva Theatre',
  theatreSubtitle: 'A warm musical show for the whole family',
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
  posterImage: POSTER_IMAGE,
  posterPdf: POSTER_DOWNLOAD,
  flyerPdf: FLYER_DOWNLOAD,
  photosArchive: PHOTOS_ARCHIVE,
  aboutText: '',
  contactText:
    'To invite the show to your venue, write to us on WhatsApp. Tell us who the audience will be and we will suggest a convenient date and format.',
  contactWhatsappLabel: 'Write on WhatsApp',
  ageLabel: 'Age',
  durationLabel: 'Duration',
  formatLabel: 'Format',
  infoAgeValue: 'Ages 5 and up',
  infoDurationValue: '1 hour',
  infoFormatValue: 'For adults in the presence of children 🙂',
  faqTitle: 'FAQ',
  faqItems: [
    {
      q: 'What do we need to host the show?',
      a: 'You need a small hall, studio or classroom that can be darkened. Message us on WhatsApp and we will coordinate the details.',
    },
    {
      q: 'Can you perform in a large theatre hall?',
      a: 'In theory the show can be played on a large stage—we have done it—but it sounds best in an intimate setting with the audience directly opposite the centre of the stage, within about four metres. Ideally children sit closer and in tiers—on cushions or mats, for example.',
    },
    {
      q: 'Do you require any special equipment?',
      a: 'We need dimming, a 220V socket and free space in front of the audience. Everything else—light, sound, puppets and set—we bring with us.',
    },
    {
      q: 'Can we bring a child younger than the recommended age?',
      a: 'We recommend the show from age five. You may bring a younger child, but please stay nearby and watch how they feel so it is not too scary, boring or tiring. You can always step out briefly so as not to disturb other audience members.',
    },
    {
      q: 'Can I leave my child alone at the show?',
      a: 'From about age nine a child can stay alone, but it matters to us that most parents are in the room too—and not for discipline. Many layers of meaning are addressed to adults, and when there is no one to speak to, we are genuinely sad. We believe the show should be a shared experience and a topic for conversation for your whole family.',
    },
    {
      q: 'Do adults need a ticket?',
      a: 'Yes, every audience member needs a ticket.',
    },
    {
      q: 'Ticket refunds',
      a: 'You can return a ticket no later than 7 days before the event (minus a 5% payment-system transaction fee). After that, a ticket can only be moved to any other performance by the theatre where seats are available.',
    },
    {
      q: 'Can I buy a ticket for cash before the show?',
      a: 'You can always buy a ticket for cash before the show when seats are available. However, tickets bought in advance are usually cheaper.',
    },
    {
      q: 'Can I get a discount?',
      a: 'If you are in a difficult financial situation or you have a large family and are buying many tickets, write to us on WhatsApp and we will see what we can do.',
    },
  ],
  teamAuthorTitle: 'Script & part of songs by',
  teamAuthorName: 'Igor Bely and Evgeniya Slavina',
  songsTitle: 'Set design',
  songsName: 'Elena Shamis',
  teamDirectorTitle: 'Artist',
  teamDirectorName: 'Lena Shapiro',
  masterTitle: 'Puppets',
  masterName: 'Yulia Gubkina',
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
  scheduleRows: [],
};

export const GEFILTE_LID_CONTENT: Partial<Record<Lang, Content>> = {
  ru: RU_CONTENT,
  en: EN_CONTENT,
};
