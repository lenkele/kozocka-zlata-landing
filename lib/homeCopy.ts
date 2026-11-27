import type { Lang, ShowSlug } from '@/shows/types';

type ShowCopy = { eyebrow: string; title: string; description: string; meta: string };
type HomeCopy = {
  title: string; description: string; theatre: string; subtitle: string; heading: string; headingNote: string;
  afisha: string; showsLabel: string; invite: string; hero: string[];
  afishaHeading: string; emptySchedule: string; tickets: string; closed: string; unavailable: string; passed: string; freeEntry: string;
  repertoire: string; showsHeading: string; aboutShow: string; schedule: string; poster: string;
  inviteHeading: string; inviteIntro: string; inviteMore: string; inviteSteps: string[]; whatsapp: string; whatsappMessage: string;
  about: string; aboutHeading: string; aboutParagraphs: string[]; teamHeading: string;
  team: { name: string; role: string }[];
  footer: string; terms: string; privacy: string; logoAlt: string; teamAlt: string; performanceAlt: string;
  shows: Record<ShowSlug, ShowCopy>;
};

export const HOME_COPY: Record<Lang, HomeCopy> = {
  ru: {
    title: 'Театр «Рыба Кива» — кукольные спектакли для детей и взрослых в Израиле',
    description: 'Официальный сайт кукольного театра «Рыба Кива» в Израиле. Спектакли с живой музыкой на русском и иврите для детей от 4 лет и взрослых: «Козочка Злата» к Хануке, «Колдовство Мариты», «Гефилте Лид». Афиша, билеты, выездные спектакли для детсадов, школ и матнасов.',
    theatre: 'Театр «Рыба Кива»', subtitle: 'Кукольные спектакли с живой музыкой', heading: 'Рыба Кива вас ждёт',
    headingNote: 'Кукольный театр с живой музыкой для детей и взрослых в Израиле',
    afisha: 'Афиша', showsLabel: 'Спектакли', invite: 'Пригласить театр',
    hero: [
      'Мы приезжаем с целым маленьким миром в паре чемоданов: куклами, декорациями, светом и музыкальными инструментами.\nИграем в камерных залах, детских садах, школах, студиях и даже дома.',
      'Наши спектакли интересно смотреть вместе - детям, подросткам и взрослым.\nМы говорим, что это спектакли для взрослых в присутствии детей.',
      'Куклы, тени, проекции, песни, скрипка, гитара, клавиши, калимба, укулеле и многое другое. Сказки, в которых детям достаются приключения и чудеса, а взрослым - смех и печаль, спрятавшиеся между строк.',
    ],
    afishaHeading: 'Афиша',
    emptySchedule: 'Расписание пока не заполнено. Следите за обновлениями!', tickets: 'Билеты', closed: 'Закрытый показ', unavailable: 'Недоступно', passed: 'Спектакль прошёл', freeEntry: 'Вход свободный',
    repertoire: 'Репертуар', showsHeading: 'Спектакли театра', aboutShow: 'О спектакле', schedule: 'Расписание', poster: 'Афиша',
    inviteHeading: 'Хотите, чтобы «Рыба Кива» приехала к вам?', inviteMore: 'Подробнее для организаторов',
    inviteIntro: 'Просто напишите нам.\nМы поможем выбрать спектакль, договоримся о дате и обсудим площадку.',
    inviteSteps: ['Расскажите, для кого показ, где он состоится и сколько будет зрителей.', 'Нам нужны затемнение, розетка 220V и свободное место перед зрителями.', 'Свет, звук, куклы и декорации мы привозим с собой.'],
    whatsapp: 'Написать в WhatsApp', whatsappMessage: 'Здравствуйте! Хочу пригласить театр «Рыба Кива». Расскажите, пожалуйста, какие есть даты и условия.',
    about: 'О театре', aboutHeading: 'Театр для детей и взрослых',
    aboutParagraphs: ['«Рыба Кива» - независимый камерный кукольный театр. Каждый наш спектакль собирается вручную: из авторских кукол и декораций, теней, света, музыки и историй, которые хочется унести с собой.', 'Дети следят за приключением, смеются, немного пугаются и радуются счастливому финалу. А взрослые замечают другие смыслы - и потом всей семье бывает о чем поговорить по дороге домой.'],
    teamHeading: 'Кто делает театр или был с нами раньше',
    team: [
      { name: 'Елена Шамис', role: 'автор проекта и сценариев, сценография, вокал, работа с куклами' },
      { name: 'Саша Скворцова', role: 'скрипка, вокал, работа с реквизитом, работа с куклами' },
      { name: 'Михаил Стародубцев', role: 'Гитара, клавиши, вокал, технические и сценографические решения, музыкальные аранжировки, работа с куклами' },
      { name: 'Мария Гескина', role: 'Гитара, мелодика, вокал, музыкальные аранжировки, сценографические решения, работа с куклами' },
      { name: 'Игорь Белый', role: 'гитара, вокал' }, { name: 'Наташа Хенкина', role: 'работа с реквизитом и куклами' },
      { name: 'Лена Шапиро', role: 'работа с реквизитом' }, { name: 'Анна Рахимбердиева', role: 'работа с реквизитом' },
      { name: 'Саша Лунякова', role: 'режиссер, художник, бутафор' },
    ],
    footer: 'Кукольные спектакли для всей семьи', terms: 'Условия', privacy: 'Политика конфиденциальности',
    logoAlt: 'Логотип театра «Рыба Кива»', teamAlt: 'Команда театра «Рыба Кива»', performanceAlt: 'Спектакль театра «Рыба Кива»',
    shows: {
      zlata: { eyebrow: 'Ханукальная история о любви и чуде', title: 'Козочка Злата', description: 'Трогательный, веселый и немножко грустный спектакль по мотивам сказки Исаака Башевиса-Зингера и еврейских притч. История об опасном приключении, настоящей любви и чуде, которое происходит в самый темный зимний вечер.', meta: 'С 4-5 лет · 45 минут' },
      marita: { eyebrow: 'Кукольный мюзикл с живой музыкой', title: 'Колдовство Мариты', description: 'Старинная сефардская легенда о принцессе, бедном юноше, злой мачехе и любви, побеждающей смерть. Сказка и философия, смех и печаль, авторские куклы и живая сефардская музыка.', meta: 'С 6 лет · 1 час 20 минут' },
      'gefilte-lid': { eyebrow: 'Как портной и ослик за карпом ходили', title: 'Гефилте Лид', description: 'Веселый и трогательный спектакль о том, как портной и ослик отправились за самым красивым карпом. Куклы, тени, проекции, песни разных времен и немного настоящего волшебства.', meta: 'С 5 лет · 1 час' },
    },
  },
  he: {
    title: 'תיאטרון ״ריבא קיווא״ — הצגות בובות לילדים ולמבוגרים בישראל',
    description: 'האתר הרשמי של תיאטרון הבובות ״ריבא קיווא״ בישראל. הצגות עם מוזיקה חיה בעברית וברוסית לילדים מגיל 4 ולמבוגרים: ״זלטה העז״ לחנוכה, ״הקסם של מריטה״ ו״געפילטע ליד״. לוח הצגות, כרטיסים והזמנת הצגה לגנים, לבתי ספר ולמתנ״סים.',
    theatre: 'תיאטרון ״ריבא קיווא״', subtitle: 'הצגות בובות עם מוזיקה חיה', heading: 'ריבא קיווא מחכה לכם',
    headingNote: 'תיאטרון בובות עם מוזיקה חיה לילדים ולמבוגרים בישראל',
    afisha: 'לוח הצגות', showsLabel: 'ההצגות שלנו', invite: 'להזמנת התיאטרון',
    hero: [
      'אנחנו מגיעים עם עולם קטן ושלם בתוך שתי מזוודות: בובות, תפאורה, תאורה וכלי נגינה.\nמופיעים באולמות קטנים, בגני ילדים, בבתי ספר, בסטודיו ואפילו אצלכם בבית.',
      'את ההצגות שלנו כיף לראות יחד — ילדים, בני נוער ומבוגרים.\nאנחנו קוראים להן הצגות למבוגרים בנוכחות ילדים.',
      'בובות, צלליות, הקרנות, שירים, כינור, גיטרה, קלידים, קלימבה, יוקולילי ועוד. אגדות שבהן הילדים מוצאים הרפתקאות ונפלאות, והמבוגרים — צחוק ועצב שמסתתרים בין השורות.',
    ],
    afishaHeading: 'לוח הצגות',
    emptySchedule: 'לוח ההצגות יפורסם בקרוב. עקבו אחר העדכונים!', tickets: 'כרטיסים', closed: 'הצגה לקבוצה סגורה', unavailable: 'לא זמין', passed: 'ההצגה התקיימה', freeEntry: 'כניסה חופשית',
    repertoire: 'הרפרטואר', showsHeading: 'הצגות התיאטרון', aboutShow: 'על ההצגה', schedule: 'מועדי ההצגות', poster: 'כרזת ההצגה',
    inviteHeading: 'רוצים שריבא קיווא תגיע אליכם?', inviteMore: 'מידע למארגנים',
    inviteIntro: 'פשוט כתבו לנו.\nנעזור לבחור הצגה, נקבע תאריך ונדבר על המקום שבו תרצו לארח אותנו.',
    inviteSteps: ['ספרו לנו למי מיועדת ההצגה, היכן תתקיים וכמה צופים צפויים להגיע.', 'אנחנו צריכים אפשרות להחשיך את החלל, שקע חשמל של 220 וולט ומקום פנוי מול הקהל.', 'את התאורה, ציוד הסאונד, הבובות והתפאורה אנחנו מביאים איתנו.'],
    whatsapp: 'כתבו לנו ב־WhatsApp', whatsappMessage: 'שלום! נשמח להזמין את תיאטרון ״ריבא קיווא״. אילו תאריכים פנויים ומהם התנאים?',
    about: 'על התיאטרון', aboutHeading: 'תיאטרון לילדים ולמבוגרים',
    aboutParagraphs: ['״ריבא קיווא״ הוא תיאטרון בובות עצמאי ואינטימי. כל הצגה שלנו נוצרת בעבודת יד: בובות ותפאורה מקוריות, צלליות, אור, מוזיקה וסיפורים שנשארים איתכם גם אחרי ההצגה.', 'הילדים עוקבים אחר ההרפתקה, צוחקים, קצת נבהלים ושמחים בסוף הטוב. המבוגרים מגלים משמעויות נוספות — ולכל המשפחה יש על מה לדבר בדרך הביתה.'],
    teamHeading: 'האנשים שיוצרים את התיאטרון, היום ולאורך השנים',
    team: [
      { name: 'ילנה שמיס', role: 'יוצרת הפרויקט והתסריטים, עיצוב במה, שירה והפעלת בובות' },
      { name: 'סשה סקוורצובה', role: 'כינור, שירה, אביזרים והפעלת בובות' },
      { name: 'מיכאיל סטרודובצב', role: 'גיטרה, קלידים, שירה, פתרונות טכניים ועיצוב במה, עיבודים מוזיקליים והפעלת בובות' },
      { name: 'מריה גסקינה', role: 'גיטרה, מלודיקה, שירה, עיבודים מוזיקליים, עיצוב במה והפעלת בובות' },
      { name: 'איגור בֶלי', role: 'גיטרה ושירה' }, { name: 'נטשה חנקינה', role: 'אביזרים והפעלת בובות' },
      { name: 'לנה שפירו', role: 'אביזרים' }, { name: 'אנה רחימברדייבה', role: 'אביזרים' },
      { name: 'סשה לוניאקובה', role: 'בימוי, עיצוב ויצירת אביזרי במה' },
    ],
    footer: 'הצגות בובות לכל המשפחה', terms: 'תנאי שימוש', privacy: 'מדיניות פרטיות',
    logoAlt: 'סמל תיאטרון ריבא קיווא', teamAlt: 'צוות תיאטרון ריבא קיווא', performanceAlt: 'הצגה של תיאטרון ריבא קיווא',
    shows: {
      zlata: { eyebrow: 'סיפור חנוכה על אהבה ונס', title: 'זלטה העז', description: 'הצגה נוגעת ללב, משעשעת וקצת עצובה, בהשראת סיפורו של יצחק בשביס־זינגר ומשלים יהודיים. סיפור על הרפתקה מסוכנת, אהבה אמיתית ונס שמתרחש בערב החורף החשוך ביותר.', meta: 'מגיל 4–5 · 45 דקות' },
      marita: { eyebrow: 'מחזמר בובות עם מוזיקה חיה', title: 'הקסם של מריטה', description: 'אגדה ספרדית עתיקה על נסיכה, בחור עני, אם חורגת מרשעת ואהבה שמנצחת את המוות. אגדה ופילוסופיה, צחוק ועצב, בובות מקוריות ומוזיקה ספרדית חיה.', meta: 'מגיל 6 · שעה ו־20 דקות' },
      'gefilte-lid': { eyebrow: 'איך החייט והחמור יצאו לחפש קרפיון', title: 'געפילטע ליד', description: 'הצגה מצחיקה ונוגעת ללב על חייט וחמור שיוצאים לחפש את הקרפיון היפה ביותר. בובות, צלליות, הקרנות, שירים מתקופות שונות וקצת קסם אמיתי.', meta: 'מגיל 5 · שעה' },
    },
  },
  en: {
    title: 'Ryba Kiva Theatre — Puppet Shows for Children and Adults in Israel',
    description: 'Official website of Ryba Kiva, a puppet theatre with live music in Israel. Performances in Russian and Hebrew for children aged 4+ and adults: Zlata the Goat for Hanukkah, The Magic of Marita and Gefilte Lid. Schedule, tickets and bookings for kindergartens, schools and community centres.',
    theatre: 'Ryba Kiva Theatre', subtitle: 'Puppet performances with live music', heading: 'Ryba Kiva is waiting for you',
    headingNote: 'Puppet theatre with live music for children and adults in Israel',
    afisha: 'What’s on', showsLabel: 'Performances', invite: 'Invite the theatre',
    hero: [
      'We arrive with a whole little world packed into two suitcases: puppets, sets, lights and musical instruments.\nWe perform in intimate halls, kindergartens, schools, studios and even your home.',
      'Our performances are made to be enjoyed together by children, teenagers and adults.\nWe like to call them performances for adults in the company of children.',
      'Puppets, shadows, projections, songs, violin, guitar, keyboards, kalimba, ukulele and more. Stories where children find adventures and wonders, and adults discover laughter and sadness between the lines.',
    ],
    afishaHeading: 'What’s on',
    emptySchedule: 'The schedule is not available yet. Stay tuned!', tickets: 'Tickets', closed: 'Private performance', unavailable: 'Unavailable', passed: 'Past performance', freeEntry: 'Free entry',
    repertoire: 'Repertoire', showsHeading: 'Our performances', aboutShow: 'About the show', schedule: 'Schedule', poster: 'Poster',
    inviteHeading: 'Would you like Ryba Kiva to visit you?', inviteMore: 'More for organisers',
    inviteIntro: 'Just write to us.\nWe will help you choose a performance, find a date and discuss your venue.',
    inviteSteps: ['Tell us who the audience will be, where the performance will take place and how many people you expect.', 'We need a space that can be darkened, a 220V power socket and room in front of the audience.', 'We bring our own lighting, sound equipment, puppets and sets.'],
    whatsapp: 'Message us on WhatsApp', whatsappMessage: 'Hello! I would like to invite Ryba Kiva Theatre. Please let me know what dates and conditions are available.',
    about: 'About the theatre', aboutHeading: 'Theatre for children and adults',
    aboutParagraphs: ['Ryba Kiva is an independent, intimate puppet theatre. Each performance is handmade from original puppets and sets, shadows, light, music and stories you will want to take home.', 'Children follow the adventure, laugh, get a little frightened and rejoice in the happy ending. Adults discover other meanings, giving the whole family something to talk about on the way home.'],
    teamHeading: 'The people who make the theatre, now and over the years',
    team: [
      { name: 'Elena Shamis', role: 'project creator, scripts, stage design, vocals and puppetry' },
      { name: 'Sasha Skvortsova', role: 'violin, vocals, props and puppetry' },
      { name: 'Mikhail Starodubtsev', role: 'guitar, keyboards, vocals, technical and stage design, musical arrangements and puppetry' },
      { name: 'Maria Geskina', role: 'guitar, melodica, vocals, musical arrangements, stage design and puppetry' },
      { name: 'Igor Bely', role: 'guitar and vocals' }, { name: 'Natasha Khenkina', role: 'props and puppetry' },
      { name: 'Lena Shapiro', role: 'props' }, { name: 'Anna Rakhimberdieva', role: 'props' },
      { name: 'Sasha Lunyakova', role: 'direction, design and prop making' },
    ],
    footer: 'Puppet performances for the whole family', terms: 'Terms', privacy: 'Privacy Policy',
    logoAlt: 'Ryba Kiva Theatre logo', teamAlt: 'The Ryba Kiva Theatre team', performanceAlt: 'A Ryba Kiva Theatre performance',
    shows: {
      zlata: { eyebrow: 'A Hanukkah story of love and a miracle', title: 'Zlata the Goat', description: 'A touching, funny and slightly sad performance inspired by Isaac Bashevis Singer and Jewish parables. A story of a dangerous adventure, true love and a miracle on the darkest winter evening.', meta: 'Ages 4–5+ · 45 minutes' },
      marita: { eyebrow: 'A puppet musical with live music', title: 'The Magic of Marita', description: 'An old Sephardic legend about a princess, a poor young man, a wicked stepmother and love that conquers death. Fairy tale and philosophy, laughter and sorrow, original puppets and live Sephardic music.', meta: 'Ages 6+ · 1 hour 20 minutes' },
      'gefilte-lid': { eyebrow: 'How a tailor and a donkey went looking for a carp', title: 'Gefilte Lid', description: 'A funny and touching story about a tailor and a donkey who set out to find the most beautiful carp. Puppets, shadows, projections, songs from different eras and a little real magic.', meta: 'Ages 5+ · 1 hour' },
    },
  },
};
