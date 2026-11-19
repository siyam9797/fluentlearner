# Enrollment and payments

## Online checkout on `/enroll`

The current enroll page (`V2Enroll`) works in three steps: **choose course → your details → pay**. Students pay online with:

- **bKash** Tokenized Checkout (`server/bkash.ts`), or
- **SSLCommerz** hosted checkout (`server/sslcommerz.ts`) for Nagad, Rocket and cards.

`payments.available` tells the page which gateways are configured. If no gateway is configured, or the course has no usable price, the page offers **Enroll on WhatsApp** instead. WhatsApp help links appear throughout the page.

### Flow

```text
V2Enroll ── payments.bkashStart / sslcommerzStart {courseId, name, mobile (01XXXXXXXXX), email}
   │          → prepareCheckout: course price → amount; find or create account; insert pending enrollment
   │          → gateway session; transactionId = "<gateway>:<paymentID>"
   ▼
Gateway checkout page
   ▼
/api/payments/bkash/callback?paymentID=…&status=…        (GET)
/api/payments/sslcommerz/callback?status=success|fail|cancel  (form POST)
/api/payments/sslcommerz/callback?status=ipn             (server-to-server)
   │  success → execute or validate with the gateway → confirmCheckout:
   │            enrollment status=verified, real transaction ID, verifiedAt
   │            activate the account and set a generated password (if new)
   │            notifyOwner webhook · Meta Purchase (CAPI)
   │  cancel / fail → delete the pending enrollment and the never-used account
   ▼
303 → /enroll?payment=success&paymentID=…   (or payment=cancel|failure&courseId=…)
   ▼
V2Enroll confirmation ── payments.bkashResult(paymentID) → summary, one-time password, Meta Purchase (Pixel)
```

The callbacks are idempotent: handling the same payment twice is safe. The SSLCommerz IPN completes a payment even if the student closed the tab.

**Amount:** parsed from the course's `price` string (e.g. `৳8,500` → `8500` BDT). The client never sends the amount.

**Payment IDs** are validated as `^[A-Za-z0-9_-]{6,100}$` before they reach any query.

### Student accounts at checkout

Every paid enrollment ends up linked to a student account. The account kind is recorded in `adminNotes` as `[account:<kind>:<userId>]`.

| Situation at checkout                                                | Kind       | On payment                                                                            |
| -------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| No account for that email                                            | `new`      | Created inactive at checkout. Activated, with a generated password (e.g. `k7qm-9xpt`) |
| An inactive account that has never signed in (an abandoned checkout) | `reused`   | Same as new                                                                           |
| An active or previously used account                                 | `existing` | Linked as-is. Password untouched, and **no auto sign-in**                             |

For `new` and `reused` accounts, the callback signs the student in (session cookie) and passes the generated password to the confirmation screen in a short-lived HttpOnly cookie, `fl_enroll_pw`, never in the URL. The password is shown once. The student can change it in **Student → Settings**.

Auto sign-in is limited to new accounts on purpose. Otherwise, paying with someone else's email would log you in as them.

### Configuring gateways

In **Admin → Settings → Online payment** (Admin or Super Admin), or through environment variables. Saved settings win.

| Gateway    | Settings keys                                                                                          | Env fallback                                                                              | Base URLs                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| bKash      | `bkash_enabled`, `bkash_mode`, `bkash_username`, `bkash_password`, `bkash_app_key`, `bkash_app_secret` | `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET` | sandbox `https://tokenized.sandbox.bka.sh/v1.2.0-beta`, live `https://tokenized.pay.bka.sh/v1.2.0-beta` |
| SSLCommerz | `sslcommerz_enabled`, `sslcommerz_mode`, `sslcommerz_store_id`, `sslcommerz_store_password`            | `SSLCOMMERZ_MODE`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`                     | sandbox `https://sandbox.sslcommerz.com`, live `https://securepay.sslcommerz.com`                       |

- Credentials are checked against the gateway before they are saved.
- The **enabled** switch applies whether the credentials come from Settings or the environment.
- Set `PUBLIC_SITE_URL`, so return URLs are correct behind a proxy. Otherwise `X-Forwarded-Host` / `X-Forwarded-Proto` are used.
- Use sandbox while developing.

## Manual verification in Admin

**Admin → Transactions** lists every payment, online or manual (each is an enrollment row). On a transaction's detail page an admin can:

- **Verify** a pending enrollment. This assigns a student ID `FL-YYMM-NNNN` (counted per month), an optional batch and notes.
- **Reject** it with a reason.
- **Edit** contact details, batch, student ID, notes or status (`pending`, `verified`, `rejected`, `refunded`).

Online payments arrive already `verified`. Payment screenshots (`/uploads/payment-screenshots/*`) are visible only to admin-dashboard roles.

## Manual payment methods

The old manual enrollment form, its API (`enrollments.submit`, `upload.paymentScreenshot`) and the admin Payments page were removed. Students pay through online checkout, with WhatsApp as the fallback. The `payment_settings` table and existing payment screenshots are kept for the record.

## Side effects of a confirmed payment

- **Owner notification:** `NOTIFICATION_WEBHOOK_URL` receives `POST {title, content}`, if it is set. A failed delivery is only logged.
- **Meta Purchase:** sent server-side (CAPI) and from the browser (Pixel), with the shared event ID `fluentlearner-purchase-<enrollmentId>` for deduplication, the amount in BDT, and hashed email and phone. See [integrations.md](integrations.md).
