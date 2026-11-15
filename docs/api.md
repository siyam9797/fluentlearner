# API reference

## tRPC

Endpoint: `/api/trpc` (GET for queries, POST for mutations, batched, superjson). Routers: `server/routers.ts` and `server/mockRouters.ts`. Access tiers are defined in [auth-and-roles.md](auth-and-roles.md#procedure-tiers):

- **public**: everyone
- **admin**: super_admin, admin, staff, mentor
- **mkt**: marketing, admin, super_admin
- **super**: super_admin
- **student**: student, super_admin

"(+ check)" means the handler applies an extra role check, explained in the Notes column.

### `system`, `auth`

| Procedure             | Access    | Notes                                                                                                                    |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `system.health`       | public    | `{ ok: true }` (no DB check; use `/api/health`)                                                                          |
| `system.notifyOwner`  | admin     | Sends `{title, content}` to the webhook                                                                                  |
| `auth.me`             | public    | Current user or `null`                                                                                                   |
| `auth.login`          | public    | `{email, password}` → sets the session cookie                                                                            |
| `auth.logout`         | public    | Clears the cookie                                                                                                        |
| `auth.changePassword` | protected | `{currentPassword, newPassword}` (8–200 chars, must differ). Any database account, every role. Refused for the dev login |
| `auth.myAvatar`       | protected | Own profile photo URL (`null` for the dev login)                                                                         |
| `auth.updateAvatar`   | protected | Upload own photo (image, max 5 MB, to `uploads/avatars/`) or `{remove: true}`. Any role. Refused for the dev login       |

### Site content

| Procedure                                                        | Access | Notes                                                            |
| ---------------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `courses.list` / `featured` / `getById` / `getBySlug`            | public | Active courses only                                              |
| `courses.adminList` / `create` / `update` / `delete`             | admin  |                                                                  |
| `successStories.list` / `featured` / `count`                     | public |                                                                  |
| `successStories.adminList` / `create` / `update` / `delete`      | admin  |                                                                  |
| `batches.active`                                                 | public | Open, active batches                                             |
| `batches.adminList` / `getById` / `create` / `update` / `delete` | admin  |                                                                  |
| `siteSettings.getAll`                                            | public | Map of key → value, secrets removed                              |
| `siteSettings.getAllWithMeta`                                    | admin  | Rows with type, group and label, secrets removed                 |
| `siteSettings.update`                                            | admin  | Bulk upsert. Secret keys are silently ignored                    |
| `upload.image`                                                   | admin  | Image to `uploads/images/`                                       |
| `upload.paymentScreenshot`                                       | public | Max 2 MB, to `uploads/payment-screenshots/` (admin-only to read) |
| `media.list` / `upload` / `delete`                               | admin  | Media library. Delete only works on unused files                 |

### Enrollment and payments

| Procedure                                                    | Access          | Notes                                                                                                  |
| ------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------ |
| `paymentSettings.active`                                     | public          | Manual payment methods                                                                                 |
| `paymentSettings.adminList` / `create` / `update` / `delete` | admin           |                                                                                                        |
| `payments.available`                                         | public          | `{ bkash, sslcommerz }` configured flags                                                               |
| `payments.bkashStart`                                        | public          | Checkout input → bKash URL                                                                             |
| `payments.sslcommerzStart`                                   | public          | Checkout input → SSLCommerz URL                                                                        |
| `payments.bkashResult`                                       | public          | Confirmation summary. The one-time password is returned only to the signed-in new account (via cookie) |
| `enrollments.submit`                                         | public          | Manual enrollment (legacy v1 form). Rejects duplicate transaction IDs                                  |
| `enrollments.adminList` / `stats` / `getById`                | admin           |                                                                                                        |
| `enrollments.verify` / `reject` / `update`                   | admin           | Verify assigns `FL-YYMM-NNNN`                                                                          |
| `paymentGateway.status` / `save` / `setEnabled`              | admin (+ check) | bKash settings. Admin or Super Admin only                                                              |
| `paymentGateway.sslcommerzStatus` / `sslcommerzSave`         | admin (+ check) | SSLCommerz settings. Admin or Super Admin only                                                         |

### Settings with secrets

| Procedure                                    | Access | Notes                                                              |
| -------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `metaSettings.status` / `save`               | mkt    | The token is never returned, only whether it is set and its source |
| `aiSettings.status` / `saveKey` / `clearKey` | super  | Key validated before saving                                        |

### Users

| Procedure                                               | Access          | Notes                                                                                                                                                                           |
| ------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users.list`                                            | admin (+ check) | Admin or Super Admin only                                                                                                                                                       |
| `users.create`                                          | admin (+ check) | `canCreateUserWithRole`: staff → students only                                                                                                                                  |
| `users.update` / `resetPassword`                        | admin (+ check) | Admin or Super Admin. Admin-level targets need Super Admin. No self-deactivate or self-role change. `email` follows `canChangeEmailOf` and also moves the account's enrollments |
| `students.list` / `create` / `update` / `resetPassword` | admin           | Student-role accounts only                                                                                                                                                      |

### IELTS tests (admin)

| Procedure                                                                                         | Access | Notes                                                                                                    |
| ------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `mockTests.list`                                                                                  | admin  | Tests with attempt stats                                                                                 |
| `mockTests.get`                                                                                   | admin  | Full tree with answers                                                                                   |
| `mockTests.preview`                                                                               | admin  | Student view of a test                                                                                   |
| `mockTests.save`                                                                                  | admin  | `{id \| null, test, sections[]}`: replaces the tree. A Listening part allows at most 10 question numbers |
| `mockTests.setPublished` / `delete`                                                               | admin  |                                                                                                          |
| `mockTests.attempts` / `attempt`                                                                  | admin  | Attempt list (filters) and detail                                                                        |
| `mockTests.grade`                                                                                 | admin  | Criterion bands (0–9, step 0.5), band, feedback, per-answer feedback                                     |
| `mockTests.aiAvailable` / `aiEvaluate`                                                            | admin  | Whether AI is configured, and re-run AI marking                                                          |
| `mockTests.uploadMedia`                                                                           | admin  | Audio (60 MB) to `mock-audio/`, image (10 MB) to `images/`                                               |
| `learningResources.list` / `create` / `update` / `delete` / `upload`                              | admin  | Files for all students or one batch                                                                      |
| `learningResources.vocabularyList` / `vocabularyCreate` / `vocabularyUpdate` / `vocabularyDelete` | admin  |                                                                                                          |

### Student

| Procedure                                                            | Access  | Notes                                                                                                |
| -------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `student.profile` / `updateProfile` / `uploadAvatar` / `enrollments` | student | Own account                                                                                          |
| `student.tests`                                                      | student | Published tests with the student's attempt summary                                                   |
| `student.batch` / `resources` / `vocabulary`                         | student | Batch matched by email. Resources for all students plus own batch                                    |
| `student.attempts`                                                   | student | Own attempts. AI details only once applied                                                           |
| `student.start`                                                      | student | `{testId, mode, practiceType?}`. Resumes an in-progress attempt and enforces `maxAttempts` for exams |
| `student.attempt`                                                    | student | Attempt view. Practice reveals answers after submit                                                  |
| `student.save` / `submit`                                            | student | Up to 200 answers per call                                                                           |
| `student.uploadRecording`                                            | student | Speaking audio (15 MB) plus browser transcript                                                       |

## HTTP routes

| Route                               | Method   | Purpose                                                                   |
| ----------------------------------- | -------- | ------------------------------------------------------------------------- |
| `/api/health`                       | GET      | `SELECT 1`: `200 {ok:true}` or `503 {ok:false}`, `no-store`               |
| `/api/payments/bkash/callback`      | GET      | bKash return. 303 to `/enroll?payment=…`                                  |
| `/api/payments/sslcommerz/callback` | GET/POST | SSLCommerz return (`status=success\|fail\|cancel`) and IPN (`status=ipn`) |
| `/api/meta/pageview`                | POST     | `{eventId, path}` → CAPI PageView. Same-origin only, body at most 1 KB    |
| `/uploads/*`                        | GET      | Files from `UPLOAD_DIR`. `payment-screenshots/` requires a dashboard role |
| `/sitemap.xml`, `/robots.txt`       | GET      | Generated                                                                 |
