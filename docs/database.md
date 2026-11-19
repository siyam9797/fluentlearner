# Database

MySQL 8, accessed through Drizzle ORM (`drizzle-orm/mysql2`). The schema source of truth is `server/database/schema.ts`. Connection is lazy: `getDb()` in `server/db.ts` returns `null` when `DATABASE_URL` is unset, and callers either degrade or throw "Database not available".

Relationships are by convention. **There are no foreign-key constraints**, so deleting a parent does not cascade.

## Tables

### Accounts

| Table       | Purpose                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `app_users` | All real accounts: `email` (unique), `passwordHash` (scrypt), `role`, `isActive`, `name`, `avatarUrl`, `targetBand`, `lastSignedIn` |
| `users`     | Legacy OAuth-era table, kept for the type of the auth context. Not used for sign-in                                                 |

`role` is one of `super_admin`, `admin`, `marketing`, `staff`, `mentor`, `student`. See [auth-and-roles.md](auth-and-roles.md).

### Business

| Table              | Purpose                                                        | Notable columns                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `courses`          | Courses shown on the site                                      | `name` (Bengali), `nameEn`, `slug`, `price` / `originalPrice` (display strings such as `৳8,500`), `category` (`ielts`, `spoken`, `grammar`, `study-abroad`, `other`), `level`, JSON `features`, `learningOutcomes`, `curriculum` [{title, content}], `courseFaq` [{question, answer}], instructor fields, `videoUrl`, `isActive`, `isFeatured`, `sortOrder` |
| `batches`          | Course intakes                                                 | `courseId`, `startDate` (text), `maxCapacity`, `currentCount`, `isOpen`, `isActive`                                                                                                                                                                                                                                                                         |
| `enrollments`      | Enrollment and payment records                                 | student name, mobile, email, `courseId`, `batchId`, payment method, account, `transactionId`, `paymentAmount`, `paymentScreenshotUrl`, `status` (`pending`, `verified`, `rejected`, `refunded`), `studentId` (`FL-YYMM-NNNN`), `adminNotes`, `rejectionReason`, `verifiedAt`                                                                                |
| `payment_settings` | Manual payment methods (number, holder, instructions, QR code) | `methodName`, `accountNumber`, `isActive`, `sortOrder`                                                                                                                                                                                                                                                                                                      |
| `success_stories`  | Student achievements                                           | `studentName`, `imageUrl`, `thumbnailUrl`, `bandScore`, `courseName`, `testimonial`, `category`, `isFeatured`                                                                                                                                                                                                                                               |
| `site_settings`    | Key-value store for all editable content and configuration     | `settingKey` (unique), `settingValue` (text, often JSON), `settingType`, `settingGroup`, `label`                                                                                                                                                                                                                                                            |

A student's batch is found by matching the account email to an enrollment's `studentEmail` (`getStudentBatch` in `server/mockDb.ts`). Online checkout stores the email used at checkout, so it matches the account.

### Learning

| Table                | Purpose                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `learning_resources` | Files and links for students. `batchId` null = everyone, otherwise only that batch                                                                                                                                     |
| `vocabulary_words`   | Vocabulary list: `word` (unique), `partOfSpeech`, `meaning`, `example`, `topic`                                                                                                                                        |
| `mock_test_sets`     | A full IELTS test that groups four module tests: `title`, `variant`, `series`, `bookNumber`, `testNumber`. Its modules point to it with `mock_tests.setId` |
| `mock_tests`         | One IELTS test for one module: `module`, `variant` (`academic`, `general`), `durationMinutes`, `maxAttempts`, `isPublished`, `format` (`full`, `answer_sheet`), `series`, `bookNumber`, `testNumber`                   |
| `mock_sections`      | A Reading passage, Listening part, Writing task or Speaking part: `content` (rich HTML), `questionLayout` (Listening `[[n]]` layout), `imageUrl`, `audioUrl`                                                           |
| `mock_questions`     | `type` (27 types, see [ielts-tests.md](ielts-tests.md)), `instruction`, `prompt`, JSON `options`, JSON `answers` (accepted answers), `explanation`, `points`, `minWords`, `prepSeconds`, `responseSeconds`, `audioUrl` |
| `mock_attempts`      | A student's attempt: `status` (`in_progress`, `submitted`, `graded`), `mode` (`exam`, `practice`), `practiceType`, `deadlineAt`, `rawScore`, `maxScore`, `band`, JSON `criteria`, `feedback`, JSON `aiEvaluation`      |
| `mock_answers`       | One row per attempt and question (unique): `response` (text, or speech transcript), `audioUrl`, `isCorrect`, `feedback`                                                                                                |

Two columns are unused but kept to avoid a migration: `mock_tests.mode`, since the student chooses the mode per attempt, and `mock_tests.practiceType`, since question types now come from each question.

## `site_settings` keys

Everything editable without a deploy lives here. Groups and key prefixes:

| Group / prefix   | Content                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `v2_*`           | Every field of the public site. Defined in `client/src/components/home-v2/content.ts` (see [public-website.md](public-website.md)) |
| Branding         | `logo_light`, `logo_dark`, `favicon`, `page_title`, `site_tagline`                                                                 |
| `instructors`    | JSON list of reusable instructor profiles that courses pick from                                                                   |
| `marketing`      | `meta_pixel_enabled`, `meta_dataset_id`, `meta_capi_enabled`, `meta_capi_access_token`, `meta_test_event_code`                     |
| Payment gateways | bKash and SSLCommerz credentials and on/off switches (`BKASH_SETTINGS`, `SSLCOMMERZ_SETTINGS` in their modules)                    |
| AI               | `anthropic_api_key`                                                                                                                |

The admin **Appearance** settings (theme palette, dark mode) are _not_ in the database. They are saved in each browser's `localStorage` (`client/src/lib/adminAppearance.ts`).

**Secret keys** (payment credentials, the AI key, all Meta keys) are filtered out by `getPublicSiteSettings()` and are never returned by the general settings endpoints. `siteSettings.update` refuses to write them. Each secret has its own dedicated procedure.

## Migrations

Migrations are the numbered files `server/database/0000_*.sql` … `0021_marketing_role.sql`. Drizzle generated `0000`–`0008`. From `0009` onwards they were **written and applied by hand**, so Drizzle's migration history in the database is out of sync with the files.

**Rules:**

- **Never run `npm run db:push`** (`drizzle-kit generate && drizzle-kit migrate`) against an existing database. It will fail, or try to re-apply migrations.
- **New database:** apply every file in number order. The Compose MySQL image does this automatically on a fresh volume (see [deployment.md](deployment.md)).
- **Existing database:** back it up, then apply only the files that haven't run yet, e.g. `mysql fluentlearner < server/database/0022_full_tests.sql`. Do this both locally and on production.

**Adding a migration:**

1. Edit `server/database/schema.ts`.
2. Write `server/database/NNNN_short_name.sql` with the next number by hand. Separate statements with `--> statement-breakpoint` lines to match the existing files.
3. Add its entry to `server/database/meta/_journal.json`.
4. Apply it manually everywhere, production included, **before** deploying code that depends on it.

| #         | Change                                                                                      |
| --------- | ------------------------------------------------------------------------------------------- |
| 0000–0005 | Core tables: users, courses, stories, batches, payment settings, enrollments, site settings |
| 0006      | `app_users` (email/password accounts)                                                       |
| 0007–0008 | Mock tests, sections, questions, attempts, answers; series, book and test numbers           |
| 0009      | `learning_resources`                                                                        |
| 0010      | Student profile fields                                                                      |
| 0011      | `vocabulary_words`                                                                          |
| 0012      | User roles                                                                                  |
| 0013      | Practice type                                                                               |
| 0014      | AI evaluation column                                                                        |
| 0015      | Attempt mode (exam / practice)                                                              |
| 0016      | Listening question types                                                                    |
| 0017      | Per-question instructions                                                                   |
| 0018      | Reading question types                                                                      |
| 0019      | Question audio (Speaking examiner audio)                                                    |
| 0020      | Attempt practice type                                                                       |
| 0021      | `marketing` role. **Apply before creating a Marketing account**                             |
| 0022      | Full tests: `mock_test_sets` table and `mock_tests.setId`. **Apply before deploying**       |
