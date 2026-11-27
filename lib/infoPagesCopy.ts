import type { Lang, ShowSlug } from '@/shows/types';

// Тексты страниц «Пригласить театр» и «Мастер-классы».
// Источники: лендинг (о спектаклях и условиях) и описания мастер-классов театра.
// Цена — по запросу; мастер-классы пока только на русском.

export type Fact = { label: string; value: string };

export type InviteCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  heading: string;
  lead: string[];
  showsHeading: string;
  shows: Record<ShowSlug, { note: string; facts: string }>;
  showLink: string;
  audiencesHeading: string;
  audiences: { title: string; text: string }[];
  workshopsHeading: string;
  workshopsText: string;
  workshopsLink: string;
  venueHeading: string;
  venue: string[];
  orderHeading: string;
  order: string[];
  price: string;
  whatsapp: string;
  whatsappMessage: string;
};

export type Workshop = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  facts: Fact[];
  quote?: { text: string; source: string };
  image?: { src: string; alt: string; width: number; height: number };
  image2?: { src: string; alt: string; width: number; height: number };
};

export type WorkshopsCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  heading: string;
  lead: string[];
  general: Fact[];
  workshops: Workshop[];
  combineNote: string;
  ctaHeading: string;
  ctaText: string;
  whatsapp: string;
  whatsappMessage: string;
  inviteLink: string;
};

export type NavCopy = { afisha: string; shows: string; workshops: string; invite: string; home: string };

export const NAV_COPY: Record<Lang, NavCopy> = {
  ru: { afisha: 'Афиша', shows: 'Спектакли', workshops: 'Мастер-классы', invite: 'Пригласить театр', home: 'Главная' },
  he: { afisha: 'לוח הצגות', shows: 'ההצגות שלנו', workshops: 'סדנאות', invite: 'להזמנת התיאטרון', home: 'דף הבית' },
  en: { afisha: 'What’s on', shows: 'Performances', workshops: 'Workshops', invite: 'Invite the theatre', home: 'Home' },
};

const IMAGES = {
  horse: { src: '/images/workshops/suitcase-horse.jpg', width: 603, height: 601 },
  granny: { src: '/images/workshops/suitcase-granny.jpg', width: 513, height: 1200 },
  shadow: { src: '/images/workshops/shadow-light.jpg', width: 416, height: 605 },
};

export const INVITE_COPY: Record<Lang, InviteCopy> = {
  ru: {
    metaTitle: 'Пригласить кукольный театр в детский сад, школу или матнас | Театр «Рыба Кива»',
    metaDescription:
      'Выездные кукольные спектакли с живой музыкой для детских садов, школ, матнасов, библиотек и домашних праздников в Израиле. На русском и иврите. Свет, звук, куклы и декорации привозим с собой. Цена по запросу.',
    kicker: 'Для организаторов',
    heading: 'Пригласить театр «Рыба Кива»',
    lead: [
      'Мы приезжаем с целым маленьким миром в паре чемоданов: куклами, декорациями, светом и музыкальными инструментами. Играем в камерных залах, детских садах, школах, студиях и даже дома.',
      'Наши спектакли интересно смотреть вместе — детям, подросткам и взрослым. Куклы, тени, проекции и живая музыка: скрипка, гитара, клавиши, калимба, укулеле.',
    ],
    showsHeading: 'Спектакли, которые можно пригласить',
    shows: {
      zlata: { note: 'Ханукальная история о любви и чуде', facts: 'С 4–5 лет · 45 минут · на русском и иврите' },
      marita: { note: 'Кукольный мюзикл с живой сефардской музыкой', facts: 'С 6 лет · 1 час 20 минут · на русском' },
      'gefilte-lid': { note: 'Как портной и ослик за карпом ходили', facts: 'С 5 лет · 1 час · на русском' },
    },
    showLink: 'О спектакле',
    audiencesHeading: 'Где мы играем',
    audiences: [
      {
        title: 'Детские сады и школы',
        text: 'Камерный спектакль прямо в группе или в классе. Для самых маленьких подходит «Козочка Злата» (с 4–5 лет), её можно заказать на иврите.',
      },
      {
        title: 'Матнасы, библиотеки и культурные центры',
        text: 'Семейные показы для района, праздничные программы, фестивали. Спектакль можно дополнить мастер-классом — отдельным длинным мероприятием.',
      },
      {
        title: 'Студии и праздники дома',
        text: 'Нам хватает небольшого зала или гостиной: спектакль привозим целиком и ставим там, где соберутся зрители.',
      },
    ],
    workshopsHeading: 'Мастер-классы',
    workshopsText:
      'Кроме спектаклей, мы проводим семейные театральные мастерские: дети вместе со взрослыми делают кукол, придумывают им характеры и разыгрывают маленький спектакль под живую музыку.',
    workshopsLink: 'Все мастер-классы',
    venueHeading: 'Что нужно от площадки',
    venue: [
      'Затемнение, розетка 220V и свободное место перед зрителями.',
      'Свет, звук, куклы и декорации мы привозим с собой.',
      'Для мастер-класса обычно нужны столы, материалы — наши.',
    ],
    orderHeading: 'Как пригласить',
    order: [
      'Напишите нам, для кого показ, где он состоится и сколько будет зрителей.',
      'Поможем выбрать спектакль или мастер-класс и договоримся о дате.',
      'Обсудим площадку и все технические детали заранее.',
    ],
    price: 'Стоимость — по запросу: она зависит от программы, места и количества зрителей.',
    whatsapp: 'Написать в WhatsApp',
    whatsappMessage: 'Здравствуйте! Хочу пригласить театр «Рыба Кива». Расскажите, пожалуйста, какие есть даты и условия.',
  },
  he: {
    metaTitle: 'הזמנת הצגת בובות לגן, לבית ספר או למתנ״ס | תיאטרון ״ריבא קיווא״',
    metaDescription:
      'הצגות בובות עם מוזיקה חיה לגני ילדים, לבתי ספר, למתנ״סים, לספריות ולאירועים בבית בישראל. בעברית וברוסית. תאורה, הגברה, בובות ותפאורה — עלינו. המחיר לפי בקשה.',
    kicker: 'למארגנים',
    heading: 'להזמין את תיאטרון ״ריבא קיווא״',
    lead: [
      'אנחנו מגיעים עם עולם קטן ושלם בתוך שתי מזוודות: בובות, תפאורה, תאורה וכלי נגינה. מופיעים באולמות קטנים, בגני ילדים, בבתי ספר, בסטודיו ואפילו אצלכם בבית.',
      'את ההצגות שלנו כיף לראות יחד — ילדים, בני נוער ומבוגרים. בובות, צלליות, הקרנות ומוזיקה חיה: כינור, גיטרה, קלידים, קלימבה ויוקולילי.',
    ],
    showsHeading: 'הצגות שאפשר להזמין',
    shows: {
      zlata: { note: 'סיפור חנוכה על אהבה ונס', facts: 'מגיל 4–5 · 45 דקות · בעברית וברוסית' },
      marita: { note: 'מחזמר בובות עם מוזיקה ספרדית חיה', facts: 'מגיל 6 · שעה ו־20 דקות · ברוסית' },
      'gefilte-lid': { note: 'איך החייט והחמור יצאו לחפש קרפיון', facts: 'מגיל 5 · שעה · ברוסית' },
    },
    showLink: 'על ההצגה',
    audiencesHeading: 'איפה אנחנו מופיעים',
    audiences: [
      {
        title: 'גני ילדים ובתי ספר',
        text: 'הצגה אינטימית ממש בגן או בכיתה. לקטנים ביותר מתאימה ״זלטה העז״ (מגיל 4–5), ואפשר להזמין אותה בעברית.',
      },
      {
        title: 'מתנ״סים, ספריות ומרכזי תרבות',
        text: 'הצגות משפחתיות לשכונה, תוכניות לחגים ופסטיבלים. אפשר להוסיף להצגה סדנה — אירוע ארוך ונפרד.',
      },
      {
        title: 'סטודיו ואירועים בבית',
        text: 'מספיק לנו אולם קטן או סלון: אנחנו מביאים את כל ההצגה ומקימים אותה במקום שבו יתאספו הצופים.',
      },
    ],
    workshopsHeading: 'סדנאות',
    workshopsText:
      'מלבד הצגות, אנחנו מעבירים סדנאות תיאטרון משפחתיות: ילדים יחד עם המבוגרים שלהם מכינים בובות, ממציאים להן דמויות ומעלים הצגה קטנה עם מוזיקה חיה. הסדנאות מתקיימות כרגע ברוסית.',
    workshopsLink: 'כל הסדנאות',
    venueHeading: 'מה צריך מהמקום',
    venue: [
      'אפשרות להחשיך את החלל, שקע חשמל של 220 וולט ומקום פנוי מול הקהל.',
      'את התאורה, ציוד הסאונד, הבובות והתפאורה אנחנו מביאים איתנו.',
      'לסדנה בדרך כלל צריך שולחנות; החומרים — עלינו.',
    ],
    orderHeading: 'איך מזמינים',
    order: [
      'כתבו לנו למי מיועדת ההצגה, היכן תתקיים וכמה צופים צפויים להגיע.',
      'נעזור לבחור הצגה או סדנה ונקבע תאריך.',
      'נדבר מראש על המקום ועל כל הפרטים הטכניים.',
    ],
    price: 'המחיר לפי בקשה: הוא תלוי בתוכנית, במקום ובמספר הצופים.',
    whatsapp: 'כתבו לנו ב־WhatsApp',
    whatsappMessage: 'שלום! נשמח להזמין את תיאטרון ״ריבא קיווא״. אילו תאריכים פנויים ומהם התנאים?',
  },
  en: {
    metaTitle: 'Book a Puppet Show for Kindergartens, Schools and Community Centres | Ryba Kiva Theatre',
    metaDescription:
      'Touring puppet shows with live music for kindergartens, schools, community centres, libraries and home celebrations in Israel. In Russian and Hebrew. We bring our own lights, sound, puppets and sets. Price on request.',
    kicker: 'For organisers',
    heading: 'Invite Ryba Kiva Theatre',
    lead: [
      'We arrive with a whole little world packed into two suitcases: puppets, sets, lights and musical instruments. We perform in intimate halls, kindergartens, schools, studios and even your home.',
      'Our performances are made to be enjoyed together by children, teenagers and adults. Puppets, shadows, projections and live music: violin, guitar, keyboards, kalimba and ukulele.',
    ],
    showsHeading: 'Performances you can book',
    shows: {
      zlata: { note: 'A Hanukkah story of love and a miracle', facts: 'Ages 4–5+ · 45 minutes · in Russian and Hebrew' },
      marita: { note: 'A puppet musical with live Sephardic music', facts: 'Ages 6+ · 1 hour 20 minutes · in Russian' },
      'gefilte-lid': { note: 'How a tailor and a donkey went looking for a carp', facts: 'Ages 5+ · 1 hour · in Russian' },
    },
    showLink: 'About the show',
    audiencesHeading: 'Where we perform',
    audiences: [
      {
        title: 'Kindergartens and schools',
        text: 'An intimate performance right in the classroom. For the youngest, Zlata the Goat (ages 4–5+) works best, and it can be booked in Hebrew.',
      },
      {
        title: 'Community centres, libraries and cultural centres',
        text: 'Family performances for the neighbourhood, holiday programmes and festivals. A performance can be paired with a workshop, which is a separate, longer event.',
      },
      {
        title: 'Studios and home celebrations',
        text: 'A small hall or a living room is enough: we bring the whole show and set it up wherever the audience gathers.',
      },
    ],
    workshopsHeading: 'Workshops',
    workshopsText:
      'Besides performances, we run family theatre workshops: children and their adults make puppets together, invent their characters and play a small show to live music. Workshops are currently held in Russian.',
    workshopsLink: 'All workshops',
    venueHeading: 'What we need from the venue',
    venue: [
      'A space that can be darkened, a 220V power socket and room in front of the audience.',
      'We bring our own lighting, sound equipment, puppets and sets.',
      'Workshops usually need tables; we bring all materials.',
    ],
    orderHeading: 'How to book',
    order: [
      'Tell us who the audience will be, where the event will take place and how many people you expect.',
      'We will help you choose a performance or workshop and find a date.',
      'We will discuss the venue and all technical details in advance.',
    ],
    price: 'Price on request: it depends on the programme, the venue and the size of the audience.',
    whatsapp: 'Message us on WhatsApp',
    whatsappMessage: 'Hello! I would like to invite Ryba Kiva Theatre. Please let me know what dates and conditions are available.',
  },
};

export const WORKSHOPS_COPY: Record<Lang, WorkshopsCopy> = {
  ru: {
    metaTitle: 'Мастер-классы для детей и родителей: делаем кукол и играем спектакль | Театр «Рыба Кива»',
    metaDescription:
      'Семейные театральные мастерские театра «Рыба Кива» в Израиле: марионетки, тени и свет, ханукальный праздник с живой анимацией. Для детей вместе со взрослыми, на русском языке. Материалы наши, цена по запросу.',
    kicker: 'Театральные мастерские',
    heading: 'Мастер-классы театра «Рыба Кива»',
    lead: [
      'На наших мастер-классах дети не просто мастерят поделку. Вместе со взрослыми они делают кукол, придумывают им характеры, проживают историю и в конце играют маленький спектакль под живую музыку.',
      'Это полноценные длинные мероприятия, а не короткое занятие после спектакля.',
    ],
    general: [
      { label: 'Язык', value: 'русский' },
      { label: 'Материалы', value: 'наши' },
      { label: 'От площадки', value: 'обычно нужны столы' },
      { label: 'Стоимость', value: 'по запросу' },
    ],
    workshops: [
      {
        id: 'suitcase',
        kicker: 'Семейная театральная мастерская',
        title: '«В чемодане»',
        paragraphs: [
          'За полтора часа дети вместе со взрослыми делают персонажей-марионеток с подвижными руками, ногами, лапами и хвостами, придумывают им характеры, а потом разыгрывают спектакль на столе под живую музыку — скрипку и укулеле.',
          'Дети не выступают на сцене: они эмоционально проживают историю, и каждый раз, когда по сюжету наступает момент морального выбора и они его совершают, происходит настоящее маленькое чудо. В конце мы все вместе музицируем на наших инструментах.',
        ],
        facts: [
          { label: 'Возраст', value: 'дети 5–12 лет вместе со взрослыми' },
          { label: 'Длительность', value: 'около 1,5 часа' },
          { label: 'Группа', value: 'до 10–12 семей' },
          { label: 'Подходит для', value: 'библиотек, школ, студий, матнасов, фестивалей и домашних праздников' },
        ],
        quote: {
          text: 'Дети делали персонажей для спектакля с двигающимися руками, ногами, лапами и хвостами, а потом все вместе сыграли спектакль на столе под аккомпанемент скрипки и укулеле. Уже прошло несколько дней, а у меня осталось в душе ощущение волшебства и важности того, чем мы занимались.',
          source: 'из отзыва участницы',
        },
        image: { ...IMAGES.horse, alt: 'Кукла-лошадка, сделанная на мастер-классе «В чемодане»' },
        image2: { ...IMAGES.granny, alt: 'Кукла-бабушка с мастер-класса «В чемодане»' },
      },
      {
        id: 'shadow',
        kicker: 'Театральная мастерская',
        title: '«Птица-правда, тень и свет»',
        paragraphs: [
          'Темнота и свет, свет и тень, правда и ложь — из этого мы вместе со зрителями создаём красивый и таинственный спектакль. Только в темноте виден яркий луч света, поэтому темнота — главный соавтор нашей истории.',
          'Участники становятся не зрителями, а творцами: вместе мы придумываем, создаём и озвучиваем разные миры, которые оживают в спектакле с помощью света и тени. Ложь и правда, страх и смелость, тень и свет — в новой истории, сочинённой вместе со зрителями.',
        ],
        facts: [{ label: 'От площадки', value: 'возможность затемнить зал' }],
        image: { ...IMAGES.shadow, alt: 'Теневая сцена из мастерской «Птица-правда, тень и свет»' },
      },
      {
        id: 'hanukkah',
        kicker: 'Семейный праздник',
        title: 'Ханукальный праздник с живой анимацией',
        paragraphs: [
          'Праздник начинается с маленького спектакля в технике живой анимации — по мотивам сказки Исаака Башевиса-Зингера о самом первом шлемиле из местечка Хелм. Картинки и рисунки песком оживают на экране прямо на глазах у зрителей: проектор, видеокамера и экран — наши.',
          'Потом дети все вместе рисуют на большой скатерти угощение для пострадавшей семьи Шлемиля: нам важно, чтобы на празднике они не только сделали подарки себе, но и сделали что-то для других. Дальше — мастер-классы: свечи, витражный подсвечник или витражная ханукия, украшение ханукального пончика. В финале мы вместе разучиваем ханукальный напев.',
        ],
        facts: [
          { label: 'Для кого', value: 'семьи с детьми — родители участвуют вместе с детьми' },
          { label: 'От площадки', value: 'затемнение, столы и помощники, которые соберут группы и проследят за временем' },
        ],
      },
    ],
    combineNote: 'Мастер-класс можно заказать вместе со спектаклем, но это отдельное длинное мероприятие — заложите на него время.',
    ctaHeading: 'Заказать мастер-класс',
    ctaText: 'Напишите нам, для кого мастер-класс, где он пройдёт и сколько будет участников. Подберём формат и договоримся о дате.',
    whatsapp: 'Написать в WhatsApp',
    whatsappMessage: 'Здравствуйте! Хочу заказать мастер-класс театра «Рыба Кива». Расскажите, пожалуйста, о датах и условиях.',
    inviteLink: 'Пригласить спектакль',
  },
  he: {
    metaTitle: 'סדנאות בובות להורים וילדים | תיאטרון ״ריבא קיווא״',
    metaDescription:
      'סדנאות תיאטרון משפחתיות של ״ריבא קיווא״ בישראל: בובות מריונטה, צל ואור, חגיגת חנוכה עם אנימציה חיה. לילדים יחד עם המבוגרים שלהם, ברוסית. החומרים עלינו, המחיר לפי בקשה.',
    kicker: 'סדנאות תיאטרון',
    heading: 'הסדנאות של תיאטרון ״ריבא קיווא״',
    lead: [
      'בסדנאות שלנו הילדים לא רק מכינים יצירה. יחד עם המבוגרים שלהם הם מכינים בובות, ממציאים להן דמויות, חווים את הסיפור ובסוף מעלים הצגה קטנה עם מוזיקה חיה.',
      'אלה אירועים ארוכים ומלאים, ולא פעילות קצרה אחרי הצגה. הסדנאות מתקיימות כרגע ברוסית.',
    ],
    general: [
      { label: 'שפה', value: 'רוסית' },
      { label: 'חומרים', value: 'עלינו' },
      { label: 'מהמקום', value: 'בדרך כלל צריך שולחנות' },
      { label: 'מחיר', value: 'לפי בקשה' },
    ],
    workshops: [
      {
        id: 'suitcase',
        kicker: 'סדנת תיאטרון משפחתית',
        title: '״במזוודה״',
        paragraphs: [
          'במשך שעה וחצי הילדים יחד עם המבוגרים מכינים בובות מריונטה עם ידיים, רגליים, כפות וזנבות זזים, ממציאים להן דמויות ומעלים הצגה על השולחן עם מוזיקה חיה — כינור ויוקולילי.',
          'הילדים לא עולים לבמה: הם חווים את הסיפור, ובכל פעם שהעלילה מביאה אותם לרגע של בחירה מוסרית והם בוחרים — קורה נס קטן ואמיתי. בסוף כולנו מנגנים יחד על כלי הנגינה שלנו.',
        ],
        facts: [
          { label: 'גיל', value: 'ילדים בני 5–12 יחד עם המבוגרים שלהם' },
          { label: 'משך', value: 'כשעה וחצי' },
          { label: 'קבוצה', value: 'עד 10–12 משפחות' },
          { label: 'מתאים ל', value: 'ספריות, בתי ספר, סטודיו, מתנ״סים, פסטיבלים ואירועים בבית' },
        ],
        image: { ...IMAGES.horse, alt: 'בובת סוס שהוכנה בסדנה ״במזוודה״' },
        image2: { ...IMAGES.granny, alt: 'בובת סבתא מהסדנה ״במזוודה״' },
      },
      {
        id: 'shadow',
        kicker: 'סדנת תיאטרון',
        title: '״ציפור־האמת, צל ואור״',
        paragraphs: [
          'חושך ואור, אור וצל, אמת ושקר — מאלה אנחנו יוצרים יחד עם הקהל הצגה יפה ומסתורית. רק בחושך רואים קרן אור בהירה, ולכן החושך הוא השותף העיקרי לסיפור שלנו.',
          'המשתתפים הם לא צופים אלא יוצרים: יחד אנחנו ממציאים, בונים ומשמיעים עולמות שונים, שמתעוררים לחיים בהצגה בעזרת אור וצל.',
        ],
        facts: [{ label: 'מהמקום', value: 'אפשרות להחשיך את החלל' }],
        image: { ...IMAGES.shadow, alt: 'סצנת צלליות מהסדנה ״ציפור־האמת, צל ואור״' },
      },
      {
        id: 'hanukkah',
        kicker: 'חגיגה משפחתית',
        title: 'חגיגת חנוכה עם אנימציה חיה',
        paragraphs: [
          'החגיגה נפתחת בהצגה קטנה בטכניקת אנימציה חיה, בהשראת סיפורו של יצחק בשביס־זינגר על השלומיאל הראשון מחלם. ציורים ותמונות בחול מתעוררים לחיים על המסך מול עיני הקהל.',
          'אחר כך הילדים מציירים יחד על מפה גדולה ארוחה לחג בשביל משפחת השלומיאל, ואז ממשיכים לסדנאות: נרות, פמוט ויטראז׳ או חנוכיית ויטראז׳ וקישוט סופגנייה. בסוף לומדים יחד ניגון חנוכה.',
        ],
        facts: [
          { label: 'למי', value: 'משפחות עם ילדים — ההורים משתתפים יחד עם הילדים' },
          { label: 'מהמקום', value: 'החשכה, שולחנות ועוזרים שיארגנו את הקבוצות וישמרו על לוח הזמנים' },
        ],
      },
    ],
    combineNote: 'אפשר להזמין סדנה יחד עם הצגה, אבל זה אירוע נפרד וארוך — כדאי לתכנן לו זמן.',
    ctaHeading: 'להזמנת סדנה',
    ctaText: 'כתבו לנו למי מיועדת הסדנה, היכן תתקיים וכמה משתתפים יגיעו. נתאים את הפורמט ונקבע תאריך.',
    whatsapp: 'כתבו לנו ב־WhatsApp',
    whatsappMessage: 'שלום! נשמח להזמין סדנה של תיאטרון ״ריבא קיווא״. אילו תאריכים פנויים ומהם התנאים?',
    inviteLink: 'להזמנת הצגה',
  },
  en: {
    metaTitle: 'Puppet-Making Workshops for Children and Parents | Ryba Kiva Theatre',
    metaDescription:
      'Family theatre workshops by Ryba Kiva Theatre in Israel: marionettes, shadow and light, a Hanukkah celebration with live animation. For children together with their adults, held in Russian. We bring all materials; price on request.',
    kicker: 'Theatre workshops',
    heading: 'Ryba Kiva Theatre workshops',
    lead: [
      'In our workshops children do more than make a craft. Together with their adults they make puppets, invent their characters, live through a story and finally play a small show to live music.',
      'These are full, long events rather than a short activity after a performance. Workshops are currently held in Russian.',
    ],
    general: [
      { label: 'Language', value: 'Russian' },
      { label: 'Materials', value: 'we bring them' },
      { label: 'From the venue', value: 'usually tables' },
      { label: 'Price', value: 'on request' },
    ],
    workshops: [
      {
        id: 'suitcase',
        kicker: 'Family theatre workshop',
        title: '“In the Suitcase”',
        paragraphs: [
          'In an hour and a half, children and their adults make marionette characters with moving arms, legs, paws and tails, invent their personalities and then play a tabletop show to live music on violin and ukulele.',
          'Children do not perform on a stage: they live through the story, and every time the plot brings them to a moral choice and they make it, a small real miracle happens. At the end we all make music together on our instruments.',
        ],
        facts: [
          { label: 'Ages', value: 'children 5–12 together with their adults' },
          { label: 'Duration', value: 'about 1.5 hours' },
          { label: 'Group', value: 'up to 10–12 families' },
          { label: 'Good for', value: 'libraries, schools, studios, community centres, festivals and home celebrations' },
        ],
        image: { ...IMAGES.horse, alt: 'A horse puppet made at the “In the Suitcase” workshop' },
        image2: { ...IMAGES.granny, alt: 'A grandmother puppet from the “In the Suitcase” workshop' },
      },
      {
        id: 'shadow',
        kicker: 'Theatre workshop',
        title: '“Bird of Truth, Shadow and Light”',
        paragraphs: [
          'Darkness and light, light and shadow, truth and lies — from these we create a beautiful and mysterious show together with the audience. Only in the dark can you see a bright beam of light, so darkness is the main co-author of our story.',
          'Participants become creators rather than spectators: together we invent, build and voice different worlds that come alive in the show through light and shadow.',
        ],
        facts: [{ label: 'From the venue', value: 'a space that can be darkened' }],
        image: { ...IMAGES.shadow, alt: 'A shadow scene from the “Bird of Truth, Shadow and Light” workshop' },
      },
      {
        id: 'hanukkah',
        kicker: 'Family celebration',
        title: 'A Hanukkah celebration with live animation',
        paragraphs: [
          'The celebration opens with a small live-animation show inspired by Isaac Bashevis Singer’s tale of the very first schlemiel from Chelm. Pictures and sand drawings come alive on the screen in front of the audience.',
          'Then the children draw a holiday meal for the schlemiel’s family on a big paper tablecloth and move on to workshops: candles, a stained-glass candle holder or hanukkiah, and decorating a sufganiyah. At the end we learn a Hanukkah tune together.',
        ],
        facts: [
          { label: 'For', value: 'families with children — parents take part together with their children' },
          { label: 'From the venue', value: 'darkening, tables and helpers to organise the groups and keep time' },
        ],
      },
    ],
    combineNote: 'A workshop can be booked together with a performance, but it is a separate, long event — plan time for it.',
    ctaHeading: 'Book a workshop',
    ctaText: 'Tell us who the workshop is for, where it will take place and how many participants to expect. We will suggest a format and find a date.',
    whatsapp: 'Message us on WhatsApp',
    whatsappMessage: 'Hello! I would like to book a Ryba Kiva Theatre workshop. Please let me know what dates and conditions are available.',
    inviteLink: 'Book a performance',
  },
};
