import { GEFILTE_LID_CONTENT } from './content';
import { type Lang, type ShowConfig } from '../types';

const ASSET_BASE = '/shows/gefilte-lid';
const IMAGES_BASE = `${ASSET_BASE}/images`;

const WHATSAPP_MESSAGES: Partial<Record<Lang, string>> = {
  ru: 'Здравствуйте! Хочу пригласить спектакль «Гефилте Лид». Напишите, пожалуйста, какие есть даты и условия.',
  en: 'Hello! I would like to invite "Gefilte Lid". Please let me know what dates and conditions are available.',
};

export const GEFILTE_LID_SHOW: ShowConfig = {
  slug: 'gefilte-lid',
  pageTitle: '"Гефилте Лид" — тёплый музыкальный спектакль от театра "Рыба Кива"',
  pageDescription:
    'Весёлый, красивый и тёплый спектакль для всей семьи о портном и ослике от театра "Рыба Кива". С куклами, проекциями, живой музыкой и щепоткой волшебства.',
  // Цвет и прозрачность подобраны под кремово-зелёную гамму афиши:
  // тёплый оливково-песочный налёт поверх бежевых обоев с цветочками.
  backgroundStyle:
    `linear-gradient(rgba(155,142,92,0.55), rgba(155,142,92,0.55)), url('${IMAGES_BASE}/back_1.png')`,
  scheduleFilePath: `${ASSET_BASE}/data/schedule.yaml`,
  // Список фото собирается автоматически из public/shows/gefilte-lid/photos/
  // на сервере при рендере страницы — см. app/[show]/page.tsx.
  carouselPhotos: [],
  galleryPhotos: [],
  autoDiscoverPhotos: true,
  whatsappLinkBase: 'https://wa.me/972533219998?text=',
  whatsappMessages: WHATSAPP_MESSAGES,
  content: GEFILTE_LID_CONTENT,
  availableLanguages: ['ru', 'en'],
  buttonColors: {
    bg: 'bg-[#6B8E3F]', // травяная зелень с афиши
    hover: 'hover:bg-[#577830]',
    text: 'text-white',
  },
  textColor: 'text-[#3A2820]', // тёмно-коричневый, как контур рисунка на афише
  cardBg: 'bg-[#F4ECD6]/95', // кремовая бумага афиши
  darkCardBg: 'bg-[rgba(50,75,40,0.94)]', // глубокая лесная зелень из рамки
  headerBg: 'bg-[#2D4622]', // тёмная зелень для хедера
  headingColor: 'text-[#5A3A22]', // тёплая «карандашная» коричневая для заголовков на светлых карточках
};
