# Автоматизация расписания (CSV -> YAML)

## Где редактировать

Для «Козочки Златы» источник теперь здесь:

- `public/shows/zlata/data/schedule.csv`

## Как собрать YAML

```bash
npm run schedule:build:zlata
```

Команда перегенерирует:

- `public/shows/zlata/data/schedule.yaml`

## Формат CSV

Обязательные колонки:

- `id`
- `date_iso` (YYYY-MM-DD)
- `price_ils`
- `capacity` (опционально)
- `ru_time`, `ru_place`, `ru_format`, `ru_language`, `ru_date_text` (date_text можно пустым)
- `he_time`, `he_place`, `he_format`, `he_language`, `he_date_text` (date_text можно пустым)
- `en_time`, `en_place`, `en_format`, `en_language`, `en_date_text` (date_text можно пустым)

## Колонка capacity (кол-во мест)

- Если `capacity` заполнена положительным числом:
  - считаются оплаченные билеты по `event_id`,
  - когда мест не осталось, на сайте вместо кнопки показывается `Sold out`,
  - checkout возвращает ошибку `sold_out` и не создаёт оплату.
- Если `capacity` пустая:
  - мест считается бесконечно много,
  - кнопка работает по обычным правилам (дата/закрытый показ).
