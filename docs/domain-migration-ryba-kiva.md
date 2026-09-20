# Ryba Kiva domain migration

Goal: move the theatre to `https://ryba-kiva.com` and keep each show as a page on the shared theatre domain:

- `https://ryba-kiva.com/zlata`
- `https://ryba-kiva.com/marita`
- `https://ryba-kiva.com/gefilte-lid`

## Safe rollout order

1. Deploy the code while keeping the current production environment unchanged.
2. Buy and connect `ryba-kiva.com` in the hosting provider.
3. Test the shared domain without changing payment settings yet.
4. In production environment variables, set:
   - `APP_BASE_URL=https://ryba-kiva.com`
   - `CANONICAL_SITE_URL=https://ryba-kiva.com`
5. Run a low-value or test AllPay purchase and verify:
   - AllPay opens from a show page.
   - Success returns to `/payment/success`.
   - The success page links back to the correct show page.
   - The ticket email is delivered.
   - The QR verification URL opens `/ticket/validate`.
6. After payment is verified, redirect old show domains to the matching shared-domain paths.

## Payment-sensitive notes

`APP_BASE_URL` is the most important setting for payment. It is used for AllPay success, backlink, webhook, and ticket verification URLs.

`CANONICAL_SITE_URL` controls canonical return links. It is intentionally optional: if it is not set, the project keeps the legacy per-show return domains so existing production payments are not moved early.

Do not set `CANONICAL_SITE_URL=https://ryba-kiva.com` until the new domain is connected and reachable over HTTPS.
