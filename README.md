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

Корневая `/` редиректит на спектакль по умолчанию (`DEFAULT_SHOW_SLUG` в `shows/index.ts`).

## Домены и middleware

В `middleware.ts` заведён маппинг доменов на slug:

```ts
const HOST_TO_SHOW = {
  'www.ryba-kiva-zlata.com': 'zlata',
  'www.ryba-kiva-marita.com': 'marita',
  // ...
};
```

При запросе на конкретный домен middleware делает rewrite на нужный маршрут (`/zlata` или `/marita`). Для локальной разработки используются `localhost` и `127.0.0.1`.

Чтобы добавить новый домен:
1. Привяжи его в панели хостинга (Vercel: Project Settings → Domains).
2. Добавь домен в `HOST_TO_SHOW`.
3. Убедись, что в `public/shows/<slug>` лежат нужные ассеты.

## Добавление нового спектакля

1. Создай `public/shows/<новый_slug>/{files,photos,images,data}` и положи туда контент.
2. Добавь `shows/<новый_slug>/content.ts` (тексты на трёх языках) и `shows/<новый_slug>/index.ts` (описание ассетов).
3. Экспортируй конфиг в `shows/index.ts`, обнови `ShowSlug`.
4. При необходимости расширь `HOST_TO_SHOW` новым доменом.

5. deploy test
