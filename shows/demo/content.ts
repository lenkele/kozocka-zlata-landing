import { ZLATA_CONTENT } from '../zlata/content';
import { type Content, type Lang } from '../types';

const RU_BASE = ZLATA_CONTENT.ru as Content;

const RU_CONTENT: Content = {
  ...RU_BASE,
  title: 'Тестовый спектакль',
  seoSubtitle:
    'Тестовая страница спектакля для проверки работы админки расписания и выбора спектакля в форме.',
  heroBadge: 'Тестовый контент',
};

export const DEMO_CONTENT: Partial<Record<Lang, Content>> = {
  ru: RU_CONTENT,
};
