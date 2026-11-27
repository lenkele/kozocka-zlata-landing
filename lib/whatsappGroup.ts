import type { Lang } from '@/shows/types';

// Тихая группа анонсов театра в WhatsApp: только объявления, без переписки.
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/BVFUpn2HaV2I3ax7xz5xnr';

export const WHATSAPP_GROUP_COPY: Record<Lang, { button: string; title: string; text: string; join: string; close: string }> = {
  ru: {
    button: 'Анонсы в WhatsApp',
    title: 'Тихая группа анонсов',
    text: 'Присоединяйтесь к тихой группе в WhatsApp, где публикуются только анонсы театра. Не пропустите спектакли, мастер-классы, певческие встречи и другие события, которые организует театр.',
    join: 'Присоединиться',
    close: 'Закрыть',
  },
  he: {
    button: 'עדכונים בוואטסאפ',
    title: 'קבוצת עדכונים שקטה',
    text: 'הצטרפו לקבוצת וואטסאפ שקטה, שבה מתפרסמות רק הודעות של התיאטרון. אל תפספסו הצגות, סדנאות, מפגשי שירה ואירועים נוספים שהתיאטרון מארגן.',
    join: 'להצטרפות',
    close: 'סגירה',
  },
  en: {
    button: 'WhatsApp news',
    title: 'Quiet announcements group',
    text: 'Join our quiet WhatsApp group where we post only theatre announcements. Don’t miss performances, workshops, singing gatherings and other events organised by the theatre.',
    join: 'Join',
    close: 'Close',
  },
};
