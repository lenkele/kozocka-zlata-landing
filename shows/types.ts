export type Lang = 'ru' | 'he' | 'en';

export type TeamActor = { name: string; role: string };

export type Content = {
  title: string;
  seoSubtitle: string;
  heroSecondary: string;
  teaserVideoUrl: string;
  heroBadge: string;
  theatreLabel: string;
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
  teamAuthorTitle: string;
  teamAuthorName: string;
  songsTitle?: string;
  songsName?: string;
  teamDirectorTitle: string;
  teamDirectorName: string;
  masterTitle?: string;
  masterName?: string;
  teamActorsTitle: string;
  teamActors: TeamActor[];
  photoDownloadLabel: string;
  carouselOpenLabel: string;
  carouselDownloadLabel: string;
  carouselPrevLabel: string;
  carouselNextLabel: string;
  carouselCloseLabel: string;
  scheduleDateLabel: string;
  scheduleTimeLabel: string;
  schedulePlaceLabel: string;
  scheduleFormatLabel: string;
  scheduleLanguageLabel: string;
  scheduleRows: {
    id?: string;
    date: string;
    time: string;
    place: string;
    format: string;
    language: string;
  }[];
};

export type ShowSlug = 'zlata' | 'marita';

export type CarouselPhoto = { src: string; alt: string };

export type GalleryPhoto = { src: string; alt?: string };

export type ShowConfig = {
  slug: ShowSlug;
  backgroundStyle: string;
  scheduleFilePath: string;
  carouselPhotos: CarouselPhoto[];
  galleryPhotos: GalleryPhoto[];
  whatsappLinkBase: string;
  whatsappMessages: Partial<Record<Lang, string>>;
  content: Partial<Record<Lang, Content>>;
  availableLanguages?: Lang[]; // Если не указано, доступны все языки
  buttonColors?: {
    bg: string;
    hover: string;
    text: string;
  };
  textColor?: string; // Цвет основного текста (по умолчанию светлый)
  cardBg?: string; // Цвет фона карточек
  headerBg?: string; // Цвет хедера
  headingColor?: string; // Цвет заголовков на карточках
};

