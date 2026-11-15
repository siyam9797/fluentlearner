# IELTS tests

The core of the learning platform. Shared rules live in `shared/mock.ts`, which the server uses for marking and the client uses for the builder, previews and labels. Persistence and marking are in `server/mockDb.ts`, the API in `server/mockRouters.ts`, AI marking in `server/aiGrading.ts`, the builder in `client/src/screens/AdminMockTestEditor.tsx`, and the student screens in `client/src/screens/StudentAttempt.tsx`.

> Student screens and admin builders deliberately mirror the real computer-delivered IELTS layout. Keep that fidelity when changing them.

## Data model

```text
mock_tests (one module: listening | reading | writing | speaking)
 └─ mock_sections (Listening part, Reading passage, Writing task, Speaking part)
     └─ mock_questions
mock_attempts (student × test, mode exam|practice, optional practiceType)
 └─ mock_answers (one per question)
```

Test settings:

- `variant`: `academic` or `general`. It selects the Reading band table.
- `durationMinutes`: exam time limit. Defaults: Listening 30, Reading 60, Writing 60, Speaking 15.
- `maxAttempts`: limit on **exam** attempts (null = unlimited). Practice is never limited.
- `isPublished`: students see published tests only.
- `format`: `full` stores passages, audio and prompts on the site. `answer_sheet` stores only the key, and students use their own book.
- `series`, `bookNumber`, `testNumber`: Cambridge IELTS 1–21 × Tests 1–4.

## Question types

27 types (`MOCK_QUESTION_TYPES`):

| Module    | Types                                                                                                                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listening | one, two, three, four or five choices · matching · map, plan, visual and diagram labeling · form, note, table, flow-chart, summary and sentence completion · short answers                                                  |
| Reading   | one to five choices · Yes/No/Not Given · True/False/Not Given · matching features, information, sentence endings and headings · diagram labeling · note, table, flow-chart, summary and sentence completion · short answers |
| Writing   | `writing` (task prompt in the section, optional chart image, `minWords`)                                                                                                                                                    |
| Speaking  | `speaking` (`prepSeconds`, `responseSeconds`, optional examiner `audioUrl`; Part 2 uses the section's rich text as the cue card)                                                                                            |

`mcq` and `short_answer` are older generic types that are still accepted. Multi-select types (`two_choices` … `five_choices`) count as that many question numbers, and a Listening part may hold at most 10 numbers. Default instructions per type are in `READING_TYPE_INSTRUCTIONS` and `LISTENING_TYPE_INSTRUCTIONS`, and each question can override them with `instruction`.

## Building tests (Admin → IELTS Modules)

- **Module list** (`/admin/ielts/{listening|reading|writing|speaking}`): tests with attempt stats. From here you can create, edit, publish or unpublish, delete, and preview.
- **Editor** (`/admin/ielts/:id`, `AdminMockTestEditor`):
  - Sections with rich-text content (TipTap: `RichLayoutEditor`, tables supported), images, and audio uploads (`mockTests.uploadMedia`: audio up to 60 MB, images up to 10 MB).
  - **Listening layout builder** (`ListeningLayoutBuilder`): write the part's form, notes or table as rich text, with `[[n]]` placeholders where answer boxes go. This is stored in `mock_sections.questionLayout`.
  - Matching and labeling questions are edited as **groups** that share one option list. Labeling groups take a map, plan or diagram image.
  - Accepted answers for completion boxes are separated by `/`.
  - **Answer-key import** (`parseAnswerKey`): paste a key, one answer per line (`11 library`, `12 22 / twenty-two`, `13 TRUE`). Optional `Part 2` / `Passage 3` headings start sections, and the standard part ranges are used otherwise. True/False/Not Given and Yes/No/Not Given answers are detected. Bracketed optional words expand, so `(a) large house` accepts both "a large house" and "large house".
- **Cambridge library** (`/admin/ielts/cambridge`): a grid of books 1–21 × tests 1–4 × modules. Each cell opens the existing test or starts a pre-filled answer sheet. `npm run seed:cambridge` creates unpublished templates for every cell.
- **Preview** (`/admin/ielts/preview/:id`): the exact student exam screen, full-screen. Nothing is saved, and audio can be replayed.

`mockTests.save` replaces the whole test tree (test, sections and questions) in one call.

## Marking

On submit (`finalizeAttempt`):

**Listening and Reading (auto-marked)**

- Answers are normalised before comparison: lowercased, curly quotes straightened, whitespace collapsed, and leading or trailing punctuation removed. Any accepted answer counts.
- Multi-select questions earn one mark per correct choice, regardless of order.
- The raw score is scaled to /40 and converted with the official tables (`bandFromRawScore`): Listening, Academic Reading and General Training Reading each have their own table. Tests that aren't out of 40 therefore get an _estimated_ band.
- A question-type drill (`practiceType`) gets a raw score only, with no band.
- The status becomes `graded` immediately.

**Writing and Speaking**

- The status becomes `submitted`, and AI marking is queued if a key is configured (`queueAiEvaluation`).
- A mentor grades the attempt in **Admin → IELTS Modules → Attempts** (`mockTests.grade`): one band per criterion, overall feedback, and per-answer feedback. Bands are in steps of 0.5.
  - Writing criteria: Task Achievement / Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
  - Speaking criteria: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.
- The overall band is the criterion average with IELTS rounding to the nearest 0.5 (`overallFromCriteria`).

## AI marking

`server/aiGrading.ts`, using Claude (`claude-opus-5`) with structured output (Zod schema per criterion).

- **Enable it:** the Super Admin saves an Anthropic API key in **Admin → Settings → AI marking** (`aiSettings.saveKey`, validated against the API). `ANTHROPIC_API_KEY` is the fallback. Without a key, attempts simply wait for a mentor.
- **Input:** the task text, rich-text parts, the Task 1 chart image(s), the student's answers and word counts. For Speaking, the input is the **browser speech-to-text transcripts**. Claude can't hear the audio, so Pronunciation is a cautious estimate, and the prompt tells it to ask the mentor to confirm.
- **Rules in the prompt:** strict marking against the public band descriptors, half bands only, Task 2 weighted twice Task 1, under-length answers penalised, and specific feedback quoting the student under about 250 words.
- **Result** (`mock_attempts.aiEvaluation`): `status` (pending, done or failed), criterion bands and comments, overall band, feedback, per-answer feedback and model name.
  - **Practice attempts:** the result is applied as the grade (status `graded`, `applied: true`), unless a mentor has already graded it.
  - **Exam attempts:** the result is stored as a **suggestion**. In the Attempts drawer a mentor can apply it, edit it, or re-run it (`mockTests.aiEvaluate`).
- Students see AI details only once they have been applied. Before that, they see the status only.

## Practice by question type

`PRACTICE_TYPES` in `shared/mock.ts` lists drillable types per module, for example Reading → Matching Headings and Writing → Task 1 bar chart. A question's type is derived from the question itself (`practiceTypeOfQuestion`). `practiceTypesInTest` lists what a test offers, and `practiceQuestionIds` selects the questions for a drill. `npm run seed:type-practice` adds starter Reading, Writing and Speaking sets. Listening sets need real audio, so admins add them.
