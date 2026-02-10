# Google Sheets -> Афиша (по кнопке)

## Что получится для организатора

1. Открыть Google Таблицу спектакля.
2. Добавить/изменить даты.
3. Открыть страницу `/admin/schedule`.
4. Ввести пароль синхронизации и нажать `Обновить`.
5. Афиша на сайте обновляется сразу.

## Настройка (один раз)

В Vercel -> `Project Settings -> Environment Variables`:

- `SCHEDULE_SYNC_SECRET` — пароль для страницы `/admin/schedule`.
- `SCHEDULE_CSV_URL_ZLATA` — CSV-ссылка листа для Златы.
- `SCHEDULE_CSV_URL_MARITA` — CSV-ссылка листа для Мариты.

Формат CSV-ссылки Google Sheets:

`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/export?format=csv&gid=<SHEET_GID>`

## Важное по таблице

Колонки в CSV должны совпадать с форматом:

- `id,date_iso,price_ils,capacity,ru_time,ru_place,ru_format,ru_language,ru_date_text,he_time,he_place,he_format,he_language,he_date_text,en_time,en_place,en_format,en_language,en_date_text`

`capacity`:

- пусто = бесконечные места;
- число > 0 = лимит мест, при нуле остатка показывается `Sold out`.
