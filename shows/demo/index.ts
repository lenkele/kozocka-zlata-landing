import { DEMO_CONTENT } from './content';
import { type CarouselPhoto, type GalleryPhoto, type Lang, type ShowConfig } from '../types';

const ASSET_BASE = '/shows/zlata';
const PHOTOS_BASE = `${ASSET_BASE}/photos`;
const IMAGES_BASE = `${ASSET_BASE}/images`;
const DATA_BASE = '/shows/demo/data';

const WHATSAPP_MESSAGES: Partial<Record<Lang, string>> = {
  ru: 'Здравствуйте! Хочу пригласить тестовый спектакль. Подскажите, пожалуйста, доступные даты.',
};

const CAROUSEL_PHOTOS: CarouselPhoto[] = [
  { src: `${PHOTOS_BASE}/kozocka-1.jpg`, alt: 'Тестовый кадр 1' },
  { src: `${PHOTOS_BASE}/kozocka-2.jpg`, alt: 'Тестовый кадр 2' },
  { src: `${PHOTOS_BASE}/kozocka-4.jpg`, alt: 'Тестовый кадр 3' },
];

const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: `${PHOTOS_BASE}/kozocka-1.jpg`, alt: 'Тестовый кадр 1' },
  { src: `${PHOTOS_BASE}/kozocka-2.jpg`, alt: 'Тестовый кадр 2' },
  { src: `${PHOTOS_BASE}/kozocka-4.jpg`, alt: 'Тестовый кадр 3' },
];

export const DEMO_SHOW: ShowConfig = {
  slug: 'demo',
  pageTitle: 'Тестовый спектакль - Рыба Кива',
  pageDescription: 'Тестовая страница для проверки интеграции расписания в админке.',
  backgroundStyle:
    "linear-gradient(180deg, rgba(151,170,184,0.70) 0%, rgba(64,86,105,0.85) 100%), " +
    `url('${IMAGES_BASE}/forest.png')`,
  scheduleFilePath: `${DATA_BASE}/schedule.yaml`,
  carouselPhotos: CAROUSEL_PHOTOS,
  galleryPhotos: GALLERY_PHOTOS,
  whatsappLinkBase: 'https://wa.me/972533219998?text=',
  whatsappMessages: WHATSAPP_MESSAGES,
  content: DEMO_CONTENT,
  availableLanguages: ['ru'],
};
