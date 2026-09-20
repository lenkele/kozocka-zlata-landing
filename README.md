## Структура проекта

- `public/shows/<slug>/files` — pdf/png/zip материалы спектакля
- `public/shows/<slug>/photos` — изображения для галереи и карусели
- `public/shows/<slug>/images` — фоновые изображения
- `public/shows/<slug>/data` — YAML-расписание (используется на клиенте)
- `shows/<slug>` — конфиг спектакля: тексты на трёх языках и ссылки на ассеты
- `components/ShowLandingClient.tsx` — универсальный клиентский компонент страницы
- `app/[show]/page.tsx` — рендерит страницу для конкретного `slug`

## Запуск

```bash
npm install
npm run dev
```

Доступные страницы:
- `http://localhost:3000/zlata`
- `http://localhost:3000/marita`

## Email (билеты)

- Настройка отправки с вашего домена на любые адреса: `docs/email-delivery-setup.md`.
- Операционный runbook: `docs/operations-runbook.md`.
- Операционный чеклист (1 страница): `docs/ops-checklist-onepage.md`.

## Расписание (автоматизация)

- Редактирование CSV и генерация YAML: `docs/schedule-automation.md`.
- Google Sheets + кнопка обновления: `docs/google-sheets-sync.md`.

Корневая `/` редиректит на спектакль по умолчанию (`DEFAULT_SHOW_SLUG` в `shows/index.ts`).

## Домены и proxy

Основной production-домен: `https://ryba-kiva.com`.

В `proxy.ts` заведён маппинг старых доменов на страницы спектаклей:

```ts
const HOST_TO_SHOW = {
  'www.ryba-kiva-zlata.com': 'zlata',
  'www.ryba-kiva-marita.com': 'marita',
};
```

Старые публичные страницы отдают постоянный `308`-редирект на соответствующий маршрут основного сайта. Пути `/api/*` на старых доменах временно остаются доступными для callback-запросов ранее созданных платежей. Для локальной разработки используются `localhost` и `127.0.0.1`.

Новые домены для отдельных спектаклей не добавляются. Все спектакли публикуются внутри `ryba-kiva.com/<slug>`.

## Добавление нового спектакля

1. Создай `public/shows/<новый_slug>/{files,photos,images,data}` и положи туда контент.
2. Добавь `shows/<новый_slug>/content.ts` (тексты на трёх языках) и `shows/<новый_slug>/index.ts` (описание ассетов).
3. Экспортируй конфиг в `shows/index.ts`, обнови `ShowSlug`.
4. Проверь страницу по адресу `https://ryba-kiva.com/<новый_slug>`.
