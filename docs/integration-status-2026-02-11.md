# Integration Status (Actual)

Дата: 2026-02-11

Этот файл фиксирует текущее рабочее состояние интеграций в проекте.

## 1) Что уже работает

### Платежи (Allpay)
- Создание checkout: `POST /api/checkout/create`
- Callback: `POST /api/payment/allpay-callback`
- Проверка подписи callback включена.
- Заказ в БД переводится в `paid`.
- Повторная обработка callback не дублирует письмо/билет.
- Для закрытых показов и недоступных режимов продаж checkout блокируется на сервере.

### Страницы результата оплаты
- Успех: `/payment/success`
- Ошибка/возврат: `/payment/return`
- Локализация RU/EN/HE.
- Кнопка возврата ведет на исходную страницу шоу (через `returnTo`).

### Email и билеты
- Отправка писем через Resend.
- Форматы письма: HTML + plain text.
- Вложение PDF-билета.
- Тексты/поля в письме и билете: RU/EN/HE.
- В билете исправлены RTL/LTR сценарии (иврит + латиница + цифры).
- При наличии Waze-ссылки добавляется отдельная строка "Как добраться / How to get there / איך מגיעים".

### Расписание (Supabase)
- Админка: `/admin/schedule`
- Авторизация админа по `ADMIN_SCHEDULE_LOGIN` + `ADMIN_SCHEDULE_PASSWORD` (cookie session).
- Создание событий в таблицу `public.schedule_events`.
- Поля события:
  - show, date, time
  - place_ru/place_en/place_he
  - format_ru / language_ru (+ авто EN/HE)
  - waze_url (опционально)
  - ticket_mode (`self`/`venue`)
  - ticket_url (для `venue`)
  - price_ils, capacity (для `self`)
- Для `Закрытый показ` блок продажи скрывается в админке.
- На публичной странице:
  - отображается цена;
  - учитывается sold-out;
  - учитываются режимы продажи (`self`/`venue`).

### Список событий в админке
- Режим по умолчанию: "Все события".
- Сортировка: от новых к старым (`date desc`, `time desc`).
- Фильтры:
  - по спектаклю,
  - по месяцу (`текущий`, `прошлый`, `следующий`, `все`).
- Экспорт текущей отфильтрованной выборки в CSV.

### Страницы спектаклей
- Подключены: `zlata`, `marita`, `demo`.
- Новый спектакль появляется в админке автоматически после добавления в реестр `shows/index.ts` + `ShowSlug`.

## 2) Что остается обязательным

### A. Миграция БД
Проверено: должна быть применена SQL-миграция:
- `docs/sql/2026-02-11-create-schedule-events.sql`

Критичный пункт:
- `alter table public.schedule_events alter column price_ils drop not null;`

### B. Email deliverability (антиспам)
- Мониторинг DMARC-отчетов.
- При стабильной доставке: переход `none -> quarantine -> reject`.

## 3) Актуальные env переменные

### Платежи
- `ALLPAY_TERMINAL_ID`
- `ALLPAY_API_KEY`
- `ALLPAY_WEBHOOK_SECRET`
- `APP_BASE_URL`

### Почта
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`
- `EMAIL_REPLY_TO`

### Админка расписания
- `ADMIN_SCHEDULE_LOGIN`
- `ADMIN_SCHEDULE_PASSWORD`
- `ADMIN_SCHEDULE_AUTH_SECRET`

### БД
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Быстрый smoke-check после деплоя

1. `/zlata` открывается, афиша отображается, цены видны.
2. `/admin/schedule`:
   - вход работает,
   - в списке видны события,
   - фильтры работают,
   - CSV скачивается.
3. Создать тестовое событие:
   - `ticket_mode=self` (с ценой),
   - `ticket_mode=venue` (с внешней ссылкой).
4. Пробная покупка:
   - переход в Allpay,
   - callback,
   - письмо приходит,
   - PDF вложен.
