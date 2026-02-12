# Operations Runbook

## 1. Ротация ключей

Переменные для ротации:

- `ALLPAY_API_KEY`
- `ALLPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SCHEDULE_AUTH_SECRET`
- `ADMIN_SCHEDULE_PASSWORD`

Порядок:

1. Выпустить новый ключ у провайдера.
2. Обновить переменную в Vercel (`All Environments`).
3. Сделать Redeploy.
4. Прогнать smoke-check (см. раздел 2).
5. Отключить старый ключ у провайдера.

## 2. Smoke-check после деплоя

1. `/zlata` открывается, афиша отображается.
2. `/admin/schedule` открывается.
3. Войти в админку, создать тестовое событие и проверить, что оно появляется в списке.
4. Проверить, что цены отображаются в колонке `Билеты`.
5. Сделать тестовую покупку:
- создается checkout,
- callback проходит,
- письмо приходит,
- PDF во вложении.

## 3. Диагностика проблем

### 3.1 `/api/admin/schedule/events` возвращает 500

Проверить:

1. `SUPABASE_URL` задан в Vercel.
2. `SUPABASE_SERVICE_ROLE_KEY` задан в Vercel.
3. Применена миграция `docs/sql/2026-02-11-create-schedule-events.sql`.
4. В таблице `public.schedule_events` у `price_ils` снят `NOT NULL`.

### 3.2 Цена не показывается в афише

Проверить поле `price_ils` у события в `public.schedule_events`:

- значение должно быть числом > 0 для `ticket_mode=self`.
- для `ticket_mode=venue` цена может быть `NULL`.

### 3.3 Callback Allpay

Если есть ошибки на `/api/payment/allpay-callback`:

1. Проверить `ALLPAY_API_KEY`/`ALLPAY_WEBHOOK_SECRET`.
2. Проверить доступность endpoint из интернета.
3. Проверить, что заказ существует в `orders`.

### 3.4 Письма не уходят / попадают в спам

1. Проверить `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`.
2. Проверить статус домена в Resend (`Verified`).
3. Проверить SPF/DKIM/DMARC.

## 4. Обязательные env переменные

- Платежи: `ALLPAY_TERMINAL_ID`, `ALLPAY_API_KEY`, `ALLPAY_WEBHOOK_SECRET`, `APP_BASE_URL`
- Почта: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`
- DB: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Админка расписания: `ADMIN_SCHEDULE_LOGIN`, `ADMIN_SCHEDULE_PASSWORD`, `ADMIN_SCHEDULE_AUTH_SECRET`

## 5. Полезные endpoints

- `POST /api/checkout/create`
- `POST /api/payment/allpay-callback`
- `GET /api/schedule?show=zlata|marita`
- `GET /api/schedule/availability?show=zlata|marita`
- `GET /api/admin/schedule/events?show=all`
- `POST /api/admin/schedule/events`
