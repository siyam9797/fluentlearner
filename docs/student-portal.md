# Student portal

`/student`. Signed-out visitors see the student login. Signed in, `StudentDashboard` renders inside `StudentShell` (sidebar, mobile nav, account menu). Only `student` accounts and the Super Admin can use it (`studentProcedure`).

Accounts are created by an admin or staff member (**Admin → Users**), or automatically by an online enrollment payment (see [payments.md](payments.md)).

## Sections

| Path                    | Section         | What it shows                                                                                                                                          |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/student`              | Dashboard       | Tests home: best band per module, recent results, quick links                                                                                          |
| `/student/practice`     | Practice        | **Practice by question type** (drill one type, e.g. Matching Headings, across the published tests), **Full practice tests**, and the Cambridge library |
| `/student/mocks`        | Mock tests      | Published tests to take as a timed exam                                                                                                                |
| `/student/results`      | My results      | All attempts with score, band, status and links to each result                                                                                         |
| `/student/batch`        | My batch        | The batch from the student's enrollment (matched by email), course and start date                                                                      |
| `/student/resources`    | Resources       | Files for everyone or for the student's batch, plus the vocabulary list                                                                                |
| `/student/typing`       | Typing practice | Typing speed and accuracy drills on built-in passages (`components/student/typingPassages.ts`)                                                         |
| `/student/profile`      | My profile      | Name, target band, avatar upload, enrollments                                                                                                          |
| `/student/settings`     | Settings        | Change password (`auth.changePassword`)                                                                                                                |
| `/student/attempts/:id` | Attempt         | The exam screen while in progress, then the result page                                                                                                |

## Taking a test

1. The student picks a published test and a **mode**:
   - **Exam:** timed (`durationMinutes`, or the default of Listening 30, Reading 60, Writing 60, Speaking 15). Limited by `maxAttempts`. Listening audio plays once. Results and model answers stay hidden, and Writing and Speaking wait for a mentor.
   - **Practice:** untimed. After submitting, the student sees correct answers and explanations, and AI marking of Writing and Speaking is applied straight away.
   - **Practice by question type:** a practice attempt with `practiceType` set. Only the questions of that type are shown and marked, and the result is a raw score rather than a band.
2. `student.start` creates the attempt, or resumes an unfinished one with the same test, mode and practice type.
3. While the student works, answers **autosave every 4 seconds** (`student.save`). A `beforeunload` guard warns before leaving. The deadline comes from the server and is corrected for clock skew. When time runs out, the attempt is submitted automatically.
4. `student.submit` saves the final answers and finalises the attempt (see [ielts-tests.md](ielts-tests.md#marking)).

### Module screens

The screens imitate computer-delivered IELTS:

- **Listening:** an audio player that plays once in exam mode. A part can instead have a scripted transcript read aloud by browser speech synthesis. Questions appear in the part's layout, with `[[n]]` blanks placed inline in forms, notes and tables. Matching uses drag-and-drop boxes, and labeling uses a letter grid over the image.
- **Reading:** the passage and questions side by side, with the same question widgets.
- **Writing:** the task prompt and chart image next to a text editor with a live word count against `minWords`.
- **Speaking:** examiner audio (if uploaded) plays the question. Part 2 shows a cue card with preparation and speaking timers. `Recorder.tsx` records with `MediaRecorder` and, where the browser supports it, transcribes with the Web Speech API (`SpeechRecognition`). Each recording is uploaded with `student.uploadRecording`, and its transcript is stored as the answer's `response`, which AI marking uses.
- **Answer-sheet tests** (`format: answer_sheet`): the student works from their own Cambridge book. The site shows only a numbered answer sheet and stores the key.

## Results

- **Listening and Reading** are marked automatically on submit: raw score, band, and per-question correct or incorrect.
- **Writing and Speaking** show "submitted" until marked:
  - In **practice**, the AI result is applied as the grade, labelled "Marked by AI · your mentor may review it".
  - In an **exam**, a mentor grades the attempt in Admin. Students never see an AI suggestion that hasn't been applied. They see only its status.
- Mentor feedback, criterion bands and per-answer comments appear on the result page.
