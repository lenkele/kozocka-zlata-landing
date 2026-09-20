# Ryba Kiva domain migration

Goal: move the theatre to `https://ryba-kiva.com` and keep each show as a page on the shared theatre domain:

- `https://ryba-kiva.com/zlata`
- `https://ryba-kiva.com/marita`
- `https://ryba-kiva.com/gefilte-lid`

## Current retirement plan

1. Keep all new public links on `ryba-kiva.com`.
2. In production environment variables, set:
   - `APP_BASE_URL=https://ryba-kiva.com`
   - `CANONICAL_SITE_URL=https://ryba-kiva.com`
3. Run a low-value or test AllPay purchase and verify:
   - AllPay opens from a show page.
   - Success returns to `/payment/success`.
   - The success page links back to the correct show page.
   - The ticket email is delivered.
   - The QR verification URL opens `/ticket/validate`.
4. Keep permanent redirects active for the remainder of the old domains' paid registration periods:
   - `ryba-kiva-zlata.com` to `ryba-kiva.com/zlata`
   - `ryba-kiva-marita.com` to `ryba-kiva.com/marita`
5. Keep `/api/*` reachable on the old domains until no previously created payment can call an old webhook URL.
6. Disable auto-renewal at the registrar. At the end of the paid period, remove the domains from Vercel and let them expire.

## Payment-sensitive notes

`APP_BASE_URL` is the most important setting for payment. It is used for AllPay success, backlink, webhook, and ticket verification URLs.

`CANONICAL_SITE_URL` controls canonical return links. The application defaults to `https://ryba-kiva.com`; production should also set the variable explicitly.

Old domains must never be used for newly generated payment, email, ticket, or QR links. Their only remaining jobs are redirects and compatibility with webhook URLs embedded in payments created before the migration.
