// Города, где театр обычно играет. Достаточно вписать город в админке на одном языке —
// остальные языки подставятся отсюда. Неизвестный город остаётся только на том языке, где его вписали.
export type CityNames = { ru: string; en: string; he: string };

export const KNOWN_CITIES: CityNames[] = [
  { ru: 'Иерусалим', en: 'Jerusalem', he: 'ירושלים' },
  { ru: 'Тель-Авив', en: 'Tel Aviv', he: 'תל אביב' },
  { ru: 'Хайфа', en: 'Haifa', he: 'חיפה' },
  { ru: 'Ашкелон', en: 'Ashkelon', he: 'אשקלון' },
  { ru: 'Ашдод', en: 'Ashdod', he: 'אשדוד' },
  { ru: 'Беэр-Шева', en: "Be'er Sheva", he: 'באר שבע' },
  { ru: 'Нетания', en: 'Netanya', he: 'נתניה' },
  { ru: 'Хадера', en: 'Hadera', he: 'חדרה' },
  { ru: 'Герцлия', en: 'Herzliya', he: 'הרצליה' },
  { ru: 'Кфар-Саба', en: 'Kfar Saba', he: 'כפר סבא' },
  { ru: 'Раанана', en: "Ra'anana", he: 'רעננה' },
  { ru: 'Петах-Тиква', en: 'Petah Tikva', he: 'פתח תקווה' },
  { ru: 'Ришон-ле-Цион', en: 'Rishon LeZion', he: 'ראשון לציון' },
  { ru: 'Реховот', en: 'Rehovot', he: 'רחובות' },
  { ru: 'Холон', en: 'Holon', he: 'חולון' },
  { ru: 'Бат-Ям', en: 'Bat Yam', he: 'בת ים' },
  { ru: 'Рамат-Ган', en: 'Ramat Gan', he: 'רמת גן' },
  { ru: 'Модиин', en: "Modi'in", he: 'מודיעין' },
  { ru: 'Маале-Адумим', en: "Ma'ale Adumim", he: 'מעלה אדומים' },
  { ru: 'Бейт-Шемеш', en: 'Beit Shemesh', he: 'בית שמש' },
  { ru: 'Кирьят-Гат', en: 'Kiryat Gat', he: 'קריית גת' },
  { ru: 'Кирьят-Ата', en: 'Kiryat Ata', he: 'קריית אתא' },
  { ru: 'Кирьят-Бялик', en: 'Kiryat Bialik', he: 'קריית ביאליק' },
  { ru: 'Кирьят-Моцкин', en: 'Kiryat Motzkin', he: 'קריית מוצקין' },
  { ru: 'Кирьят-Ям', en: 'Kiryat Yam', he: 'קריית ים' },
  { ru: 'Нешер', en: 'Nesher', he: 'נשר' },
  { ru: 'Акко', en: 'Acre', he: 'עכו' },
  { ru: 'Нагария', en: 'Nahariya', he: 'נהריה' },
  { ru: 'Кармиэль', en: 'Karmiel', he: 'כרמיאל' },
  { ru: 'Афула', en: 'Afula', he: 'עפולה' },
  { ru: 'Нацрат-Илит', en: 'Nof HaGalil', he: 'נוף הגליל' },
  { ru: 'Тверия', en: 'Tiberias', he: 'טבריה' },
  { ru: 'Цфат', en: 'Safed', he: 'צפת' },
  { ru: 'Ариэль', en: 'Ariel', he: 'אריאל' },
  { ru: 'Арад', en: 'Arad', he: 'ערד' },
  { ru: 'Димона', en: 'Dimona', he: 'דימונה' },
  { ru: 'Сдерот', en: 'Sderot', he: 'שדרות' },
  { ru: 'Эйлат', en: 'Eilat', he: 'אילת' },
];

function normalizeCity(value: string): string {
  return value.trim().toLowerCase().replace(/[\s\-־'׳"״]+/g, '');
}

export function findKnownCity(value: string): CityNames | null {
  const key = normalizeCity(value);
  if (!key) return null;
  return KNOWN_CITIES.find((city) => [city.ru, city.en, city.he].some((name) => normalizeCity(name) === key)) ?? null;
}

/** «Город, место» для афиши — если город ещё не упомянут в названии места. */
export function placeWithCity(place: string, city: string | null | undefined): string {
  const cityText = city?.trim();
  if (!cityText) return place;
  if (place.toLowerCase().includes(cityText.toLowerCase())) return place;
  const known = findKnownCity(cityText);
  if (known && [known.ru, known.en, known.he].some((name) => place.toLowerCase().includes(name.toLowerCase()))) return place;
  return place.trim() ? `${cityText}, ${place}` : cityText;
}

/** Заполняет пустые языки города из словаря. Неизвестный город на другие языки не копируется. */
export function resolveCityNames(ruRaw: string, enRaw: string, heRaw: string): { ru: string | null; en: string | null; he: string | null } {
  const ru = ruRaw.trim();
  const en = enRaw.trim();
  const he = heRaw.trim();
  const known = findKnownCity(ru) ?? findKnownCity(en) ?? findKnownCity(he);
  return {
    ru: ru || known?.ru || null,
    en: en || known?.en || null,
    he: he || known?.he || null,
  };
}
