import assert from 'node:assert/strict';
import test from 'node:test';
import { findKnownCity, placeWithCity, resolveCityNames } from '../lib/cities';
import { findMissingColumnGroup } from '../lib/schedule';

test('a known city typed in one language fills the other two', () => {
  assert.deepEqual(resolveCityNames('Хайфа', '', ''), { ru: 'Хайфа', en: 'Haifa', he: 'חיפה' });
  assert.deepEqual(resolveCityNames('', '', 'ירושלים'), { ru: 'Иерусалим', en: 'Jerusalem', he: 'ירושלים' });
  assert.deepEqual(resolveCityNames('', 'beer sheva', ''), { ru: 'Беэр-Шева', en: 'beer sheva', he: 'באר שבע' });
});

test('an explicitly typed translation is kept', () => {
  assert.deepEqual(resolveCityNames('Хайфа', 'Haifa city', ''), { ru: 'Хайфа', en: 'Haifa city', he: 'חיפה' });
});

test('an unknown city is not copied into other languages', () => {
  assert.deepEqual(resolveCityNames('Зихрон-Яаков', '', ''), { ru: 'Зихрон-Яаков', en: null, he: null });
  assert.deepEqual(resolveCityNames('', '', ''), { ru: null, en: null, he: null });
  assert.equal(findKnownCity(''), null);
});

test('city is prepended to the place only when the place does not mention it yet', () => {
  assert.equal(placeWithCity('Матнас Адар, Yerushalayim St 29', 'Хайфа'), 'Хайфа, Матнас Адар, Yerushalayim St 29');
  assert.equal(placeWithCity('Хайфа, Мерказ Хадарим', 'Хайфа'), 'Хайфа, Мерказ Хадарим');
  assert.equal(placeWithCity('Haifa, Merkaz Hadarim', 'Хайфа'), 'Haifa, Merkaz Hadarim');
  assert.equal(placeWithCity('Студия «Синяя лошадь»', undefined), 'Студия «Синяя лошадь»');
  assert.equal(placeWithCity('Студия «Синяя лошадь»', '  '), 'Студия «Синяя лошадь»');
});

test('missing optional Supabase columns are recognised in PostgREST errors', () => {
  const selectError = '{"code":"42703","details":null,"hint":null,"message":"column schedule_events.city_ru does not exist"}';
  const writeError = '{"code":"PGRST204","details":null,"hint":null,"message":"Could not find the \'comment_he\' column of \'schedule_events\' in the schema cache"}';
  assert.equal(findMissingColumnGroup(selectError, ['comments', 'city']), 'city');
  assert.equal(findMissingColumnGroup(writeError, ['comments', 'city']), 'comments');
  assert.equal(findMissingColumnGroup(selectError, ['comments']), null);
  assert.equal(findMissingColumnGroup('{"message":"permission denied"}', ['comments', 'city']), null);
});
