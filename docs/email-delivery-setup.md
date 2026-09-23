# Настройка отправки писем с адреса театра

Цель: отправлять билеты от `Театр «Рыба Кива» <tickets.rybakiva@gmail.com>`.

## 1. Подготовить Gmail

1. Войдите в Google-аккаунт `tickets.rybakiva@gmail.com`.
2. Включите двухэтапную аутентификацию.
3. Откройте `https://myaccount.google.com/apppasswords`.
4. Создайте пароль приложения с названием `RYBA KIVA tickets`.
5. Сохраните выданный 16-значный пароль. Обычный пароль Gmail использовать нельзя.

Пароль приложения является секретом. Его нельзя добавлять в Git, документацию или сообщения покупателям.

## 2. Настроить переменные окружения в Vercel

В `Project Settings -> Environment Variables` задайте для Production:

- `EMAIL_PROVIDER=gmail`
- `GMAIL_USER=tickets.rybakiva@gmail.com`
- `GMAIL_APP_PASSWORD=<16-значный пароль приложения>`
- `EMAIL_FROM=tickets.rybakiva@gmail.com`
- `EMAIL_FROM_NAME=Театр «Рыба Кива»`
- `EMAIL_REPLY_TO=tickets.rybakiva@gmail.com`

После этого сделайте Redeploy.

## 3. Проверка

1. Сделайте тестовую покупку.
2. Убедитесь, что письмо:
   - пришло на внешний адрес (не только на ваш),
   - отправитель отображается как `Театр «Рыба Кива» <tickets.rybakiva@gmail.com>`,
   - PDF-билет приложен.

## Резервный режим Resend

Для возврата к Resend задайте `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` и адрес подтвержденного в Resend домена в `EMAIL_FROM`. Resend не может отправлять от `@gmail.com`, поскольку этот домен принадлежит Google.
