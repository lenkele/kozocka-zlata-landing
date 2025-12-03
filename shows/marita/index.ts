import { MARITA_CONTENT } from './content';
import { type CarouselPhoto, type GalleryPhoto, type Lang, type ShowConfig } from '../types';

const ASSET_BASE = '/shows/marita';
const PHOTOS_BASE = `${ASSET_BASE}/photos`;
const IMAGES_BASE = `${ASSET_BASE}/images`;
const DATA_BASE = `${ASSET_BASE}/data`;

const WHATSAPP_MESSAGES: Partial<Record<Lang, string>> = {
  ru: 'Здравствуйте! Хочу пригласить спектакль «Козочка Злата». Напишите, пожалуйста, какие есть даты и условия.',
};

const CAROUSEL_PHOTOS: CarouselPhoto[] = [
  { src: `${PHOTOS_BASE}/1.jpg`, alt: 'Кадр спектакля 1' },
  { src: `${PHOTOS_BASE}/2.jpg`, alt: 'Кадр спектакля 2' },
  { src: `${PHOTOS_BASE}/3.jpg`, alt: 'Кадр спектакля 3' },
  { src: `${PHOTOS_BASE}/4.jpg`, alt: 'Кадр спектакля 4' },
  { src: `${PHOTOS_BASE}/5.jpg`, alt: 'Кадр спектакля 5' },
  { src: `${PHOTOS_BASE}/7.jpg`, alt: 'Кадр спектакля 7' },
  { src: `${PHOTOS_BASE}/8.jpg`, alt: 'Кадр спектакля 8' },
  { src: `${PHOTOS_BASE}/9.jpg`, alt: 'Кадр спектакля 9' },
  { src: `${PHOTOS_BASE}/10.jpg`, alt: 'Кадр спектакля 10' },
  { src: `${PHOTOS_BASE}/11.jpg`, alt: 'Кадр спектакля 11' },
  { src: `${PHOTOS_BASE}/12.jpg`, alt: 'Кадр спектакля 12' },
  { src: `${PHOTOS_BASE}/14.jpg`, alt: 'Кадр спектакля 14' },
  { src: `${PHOTOS_BASE}/15.jpg`, alt: 'Кадр спектакля 15' },
  { src: `${PHOTOS_BASE}/16.jpg`, alt: 'Кадр спектакля 16' },
  { src: `${PHOTOS_BASE}/17.jpg`, alt: 'Кадр спектакля 17' },
  { src: `${PHOTOS_BASE}/18.jpg`, alt: 'Кадр спектакля 18' },
  { src: `${PHOTOS_BASE}/19.jpg`, alt: 'Кадр спектакля 19' },
  { src: `${PHOTOS_BASE}/20.jpg`, alt: 'Кадр спектакля 20' },
  { src: `${PHOTOS_BASE}/21.jpg`, alt: 'Кадр спектакля 21' },
  { src: `${PHOTOS_BASE}/22.jpg`, alt: 'Кадр спектакля 22' },
  { src: `${PHOTOS_BASE}/23.jpg`, alt: 'Кадр спектакля 23' },
  { src: `${PHOTOS_BASE}/24.jpg`, alt: 'Кадр спектакля 24' },
  { src: `${PHOTOS_BASE}/25.jpg`, alt: 'Кадр спектакля 25' },
];

const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: `${PHOTOS_BASE}/1.jpg`, alt: 'Кадр спектакля 1' },
  { src: `${PHOTOS_BASE}/4.jpg`, alt: 'Кадр спектакля 3' },
  { src: `${PHOTOS_BASE}/7.jpg`, alt: 'Кадр спектакля 7' },
  { src: `${PHOTOS_BASE}/12.jpg`, alt: 'Кадр спектакля 12' },
  { src: `${PHOTOS_BASE}/8.jpg`, alt: 'Кадр спектакля 8' },
  { src: `${PHOTOS_BASE}/23.jpg`, alt: 'Кадр спектакля 23' },
];

export const MARITA_SHOW: ShowConfig = {
  slug: 'marita',
  backgroundStyle:
    `linear-gradient(rgba(220,206,230,0.92), rgba(220,206,230,0.92)), url('${IMAGES_BASE}/forest.png')`,
  scheduleFilePath: `${DATA_BASE}/schedule.yaml`,
  carouselPhotos: CAROUSEL_PHOTOS,
  galleryPhotos: GALLERY_PHOTOS,
  whatsappLinkBase: 'https://wa.me/972533219998?text=',
  whatsappMessages: WHATSAPP_MESSAGES,
  content: MARITA_CONTENT,
  availableLanguages: ['ru'], // Только русский язык для этого спектакля
  buttonColors: {
    bg: 'bg-[#C33B4E]',
    hover: 'hover:bg-[#A53042]',
    text: 'text-white',
  },
  textColor: 'text-[#3A2A4A]', // Тёмный текст по макету
  cardBg: 'bg-[#F6EEF9]/95', // Цвет карточек
  headerBg: 'bg-[#2C1E30]', // Цвет хедера
  headingColor: 'text-[#4A3C57]', // Цвет заголовков
};

