import { ZLATA_CONTENT } from './content';
import { type CarouselPhoto, type GalleryPhoto, type Lang, type ShowConfig } from '../types';

const ASSET_BASE = '/shows/zlata';
const PHOTOS_BASE = `${ASSET_BASE}/photos`;
const IMAGES_BASE = `${ASSET_BASE}/images`;
const DATA_BASE = `${ASSET_BASE}/data`;

const WHATSAPP_MESSAGES: Record<Lang, string> = {
  ru: 'Здравствуйте! Хочу пригласить спектакль «Козочка Злата». Напишите, пожалуйста, какие есть даты и условия.',
  he: 'שלום! הייתי רוצה להזמין את ההצגה «זלטה העז». אשמח לדעת אילו תאריכים ותנאים זמינים.',
  en: 'Hello! I would like to invite “Little Goat Zlata”. Please let me know what dates and conditions are available.',
};

const CAROUSEL_PHOTOS: CarouselPhoto[] = [
  { src: `${PHOTOS_BASE}/kozocka-1.jpg`, alt: 'И вдруг пошел снег...' },
  { src: `${PHOTOS_BASE}/kozocka-2.jpg`, alt: 'Сейчас таких местечек уже не осталось...' },
  { src: `${PHOTOS_BASE}/kozocka-new-3.jpg`, alt: 'Я нищим не подаю!' },
  { src: `${PHOTOS_BASE}/kozocka-4.jpg`, alt: 'Ты любишь меня, а я люблю тебя...' },
  {
    src: `${PHOTOS_BASE}/kozocka-5.jpg`,
    alt: 'Отправился в город верхом на осле, и взял с собой петуха и фонарь.',
  },
  { src: `${PHOTOS_BASE}/kozocka-6.jpg`, alt: 'А это кто еще пришел?' },
  { src: `${PHOTOS_BASE}/kozocka-7.jpg`, alt: 'Дальний путь.' },
];

const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: `${PHOTOS_BASE}/kozocka-1.jpg`, alt: 'Кадр спектакля «Козочка Злата» 1' },
  { src: `${PHOTOS_BASE}/kozocka-2.jpg`, alt: 'Кадр спектакля «Козочка Злата» 2' },
  { src: `${PHOTOS_BASE}/kozocka-4.jpg`, alt: 'Кадр спектакля «Козочка Злата» 4' },
  { src: `${PHOTOS_BASE}/kozocka-5.jpg`, alt: 'Кадр спектакля «Козочка Злата» 5' },
  { src: `${PHOTOS_BASE}/kozocka-6.jpg`, alt: 'Кадр спектакля «Козочка Злата» 6' },
  { src: `${PHOTOS_BASE}/kozocka-7.jpg`, alt: 'Кадр спектакля «Козочка Злата» 7' },
];

export const ZLATA_SHOW: ShowConfig = {
  slug: 'zlata',
  backgroundStyle:
    "linear-gradient(180deg, rgba(151,170,184,0.70) 0%, rgba(64,86,105,0.85) 100%), " +
    `url('${IMAGES_BASE}/forest.png')`,
  scheduleFilePath: `${DATA_BASE}/schedule.yaml`,
  carouselPhotos: CAROUSEL_PHOTOS,
  galleryPhotos: GALLERY_PHOTOS,
  whatsappLinkBase: 'https://wa.me/972533219998?text=',
  whatsappMessages: WHATSAPP_MESSAGES,
  content: ZLATA_CONTENT,
};

