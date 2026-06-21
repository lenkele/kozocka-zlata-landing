# Google Sheets: таблица заказов на каждый показ

Каждый показ (событие в админке) получает собственную Google-таблицу. При продаже
билета (и при выдаче бесплатного билета из админки) в неё дописывается строка с
данными покупателя. Старые показы не копятся в одной таблице — у каждого своя.

Интеграция сделана через **Google Apps Script Web App**: не нужен Google Cloud,
сервис-аккаунт и npm-зависимости. Сайт общается со скриптом обычными HTTP-запросами.

## 1. Создать таблицу-«хост» для скрипта

1. Создайте любую новую Google-таблицу (она нужна только как контейнер для скрипта;
   реальные таблицы показов скрипт будет создавать сам). Назвать можно, например,
   `RYBA KIVA — Orders Bot`.
2. В ней откройте **Extensions → Apps Script**.

## 2. Вставить код скрипта

Удалите содержимое `Code.gs` и вставьте код ниже:

```javascript
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (!secret || body.secret !== secret) {
      return json({ ok: false, error: 'unauthorized' });
    }

    if (body.action === 'create') {
      var ss = SpreadsheetApp.create(body.title || 'Orders');
      var sheet = ss.getSheets()[0];
      sheet.setName('Orders');

      var header = body.header || [
        'Дата оплаты', 'Имя', 'Email', 'Билетов', 'Сумма',
        'Валюта', 'Спектакль', 'Показ (event_id)', 'Order ID'
      ];
      sheet.appendRow(header);
      sheet.setFrozenRows(1);

      // Необязательно: сложить таблицы в отдельную папку Google Drive.
      var folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
      if (folderId) {
        var file = DriveApp.getFileById(ss.getId());
        DriveApp.getFolderById(folderId).addFile(file);
        DriveApp.getRootFolder().removeFile(file);
      }

      return json({ ok: true, id: ss.getId(), url: ss.getUrl() });
    }

    if (body.action === 'append') {
      if (!body.sheetId) return json({ ok: false, error: 'missing_sheet_id' });
      var target = SpreadsheetApp.openById(body.sheetId);
      var s = target.getSheetByName('Orders') || target.getSheets()[0];
      s.appendRow(body.row || []);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Задать секрет

1. В редакторе Apps Script: **Project Settings (шестерёнка) → Script Properties → Add script property**.
2. Добавьте свойство:
   - `WEBHOOK_SECRET` = придумайте длинную случайную строку (это же значение пойдёт в `.env`).
3. (Опционально) Чтобы все созданные таблицы складывались в одну папку Drive —
   создайте папку, скопируйте её ID из URL и добавьте свойство `DRIVE_FOLDER_ID`.

## 4. Опубликовать как Web App

1. **Deploy → New deployment → Type: Web app**.
2. Настройки:
   - **Execute as:** Me (ваш аккаунт).
   - **Who has access:** Anyone (доступ контролируется секретом `WEBHOOK_SECRET`).
3. Подтвердите запрошенные разрешения (Sheets/Drive).
4. Скопируйте полученный **Web app URL** (вида `https://script.google.com/macros/s/.../exec`).

> При изменении кода скрипта делайте **Deploy → Manage deployments → Edit → New version**,
> иначе обновления не применятся к тому же URL.

## 5. Переменные окружения сайта

Добавьте в `.env.local` (локально) и в переменные окружения Vercel (production):

```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
GOOGLE_SHEETS_WEBHOOK_SECRET=<тот же секрет, что и WEBHOOK_SECRET>
```

Если эти переменные не заданы — интеграция просто отключается (создание событий,
оплата и письма работают как раньше).

## 6. Миграция базы

Выполните SQL из `docs/sql/2026-06-21-add-schedule-event-sheets.sql` в Supabase
(добавляет колонки `sheet_id` и `sheet_url` в таблицу `schedule_events`).

## Как это работает в коде

- `lib/googleSheet.ts` — обёртка над Web App (`createEventSheet`, `appendOrderRow`).
- `app/api/admin/schedule/events/route.ts` — при создании показа создаёт таблицу и
  сохраняет её `sheet_id`/`sheet_url` в строку события.
- `app/api/payment/allpay-callback/route.ts` — при успешной оплате (ровно один раз на
  заказ) дописывает строку в таблицу показа.
- `app/api/admin/ticket/test-generate/route.ts` — бесплатные билеты из админки тоже
  попадают в таблицу.

Все вызовы Google обёрнуты в `try/catch`: сбой Google API не ломает ни оплату, ни
выдачу билета, ни создание показа (это «best-effort» логирование).

## Замечания

- Таблицы показов **не удаляются** — после завершения показа просто остаются на Диске.
- Для уже существующих показов (созданных до включения интеграции) таблицы не появятся
  автоматически — у них пустой `sheet_id`, и покупки в лист не попадут. При необходимости
  такие показы можно пересоздать или проставить `sheet_id` вручную.
