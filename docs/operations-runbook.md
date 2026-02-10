# Operations Runbook

## 1. Ротация ключей

Переменные для ротации:

- `ALLPAY_API_KEY`
- `ALLPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SCHEDULE_SYNC_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Порядок:

1. Выпустить новый ключ у провайдера.
2. Обновить переменную в Vercel (`All Environments`).
3. Сделать Redeploy.
4. Прогнать smoke-check (см. раздел 2).
5. Отключить старый ключ у провайдера.

## 2. Smoke-check после деплоя

1. `/zlata` открывается, афиша отображается.
2. `/admin/schedule` открывается.
3. Нажать `Обновить` для `Козочка Злата` -> статус `Готово`.
4. Проверить, что цены отображаются в колонке `Билеты`.
5. Сделать тестовую покупку:
- создается checkout,
- callback проходит,
- письмо приходит,
- PDF во вложении.

## 3. Диагностика проблем

### 3.1 `/api/admin/schedule/sync` возвращает 500

Проверить:

1. `SCHEDULE_SYNC_SECRET` задан в Vercel.
2. `SCHEDULE_CSV_URL_<SHOW>` задан и доступен публично.
3. Лог в Vercel покажет причину:
- `failed to fetch CSV: 401` -> неверная/приватная CSV ссылка.
- `required field "... is empty"` -> пустая обязательная колонка.

### 3.2 Цена не показывается в афише

Проверить колонку `Стоимость` в Google Sheet:

- допустимые значения: `10`, `10.5`, `10,50`, `₪ 10,00`.
- после правки нажать `Обновить` в `/admin/schedule`.

### 3.3 Callback Allpay

Если есть ошибки на `/api/payment/allpay-callback`:

1. Проверить `ALLPAY_API_KEY`/`ALLPAY_WEBHOOK_SECRET`.
2. Проверить доступность endpoint из интернета.
3. Проверить, что заказ существует в `orders`.

### 3.4 Письма не уходят / попадают в спам

1. Проверить `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`.
2. Проверить статус домена в Resend (`Verified`).
3. Проверить SPF/DKIM/DMARC.
4. Для спама: продолжать прогрев и ужесточать DMARC по этапам.

## 4. Обязательные env переменные

- Платежи: `ALLPAY_TERMINAL_ID`, `ALLPAY_API_KEY`, `ALLPAY_WEBHOOK_SECRET`, `APP_BASE_URL`
- Почта: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`
- DB: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Расписание: `SCHEDULE_SYNC_SECRET`, `SCHEDULE_CSV_URL_ZLATA`, `SCHEDULE_CSV_URL_MARITA`

## 5. Полезные endpoints

- `POST /api/checkout/create`
- `POST /api/payment/allpay-callback`
- `GET /api/schedule?show=zlata|marita`
- `GET /api/schedule/availability?show=zlata|marita`
- `POST /api/admin/schedule/sync`
