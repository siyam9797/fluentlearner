/**
 * IELTS mock test rules shared by the server (marking) and the client (labels, previews).
 */

export type MockModule = "reading" | "listening" | "writing" | "speaking";
export type MockVariant = "academic" | "general";
export type MockQuestionType =
  | "mcq"
  | "tfng"
  | "ynng"
  | "short_answer"
  | "writing"
  | "speaking"
  | "one_choice"
  | "two_choices"
  | "three_choices"
  | "four_choices"
  | "five_choices"
  | "matching"
  | "map_labeling"
  | "plan_labeling"
  | "visual_labeling"
  | "diagram_labeling"
  | "form_completion"
  | "note_completion"
  | "table_completion"
  | "flow_chart_completion"
  | "summary_completion"
  | "sentence_completion"
  | "short_answers";

export const MODULE_LABELS: Record<MockModule, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

/** Real IELTS timings, used as defaults when an admin creates a timed test. */
export const DEFAULT_DURATION_MINUTES: Record<MockModule, number> = {
  reading: 60,
  listening: 30,
  writing: 60,
  speaking: 15,
};

export const QUESTION_TYPE_LABELS: Record<MockQuestionType, string> = {
  mcq: "Multiple choice / matching",
  tfng: "True / False / Not Given",
  ynng: "Yes / No / Not Given",
  short_answer: "Short answer / completion",
  writing: "Writing task",
  speaking: "Speaking prompt",
  one_choice: "One Choice",
  two_choices: "Two Choices",
  three_choices: "Three Choices",
  four_choices: "Four Choices",
  five_choices: "Five Choices",
  matching: "Matching",
  map_labeling: "Map Labeling",
  plan_labeling: "Plan Labeling",
  visual_labeling: "Visual Labeling",
  diagram_labeling: "Diagram Labeling",
  form_completion: "Form Completion",
  note_completion: "Note Completion",
  table_completion: "Table Completion",
  flow_chart_completion: "Flow Chart Completion",
  summary_completion: "Summary Completion",
  sentence_completion: "Sentence Completion",
  short_answers: "Short Answers",
};

export const LISTENING_QUESTION_TYPES = [
  "one_choice",
  "two_choices",
  "three_choices",
  "four_choices",
  "five_choices",
  "matching",
  "map_labeling",
  "plan_labeling",
  "visual_labeling",
  "diagram_labeling",
  "form_completion",
  "note_completion",
  "table_completion",
  "flow_chart_completion",
  "summary_completion",
  "sentence_completion",
  "short_answers",
] as const satisfies readonly MockQuestionType[];

export const LISTENING_TYPE_INSTRUCTIONS: Partial<
  Record<MockQuestionType, string>
> = {
  one_choice: "Choose the correct letter, A, B or C.",
  two_choices: "Choose TWO letters.",
  three_choices: "Choose THREE letters.",
  four_choices: "Choose FOUR letters.",
  five_choices: "Choose FIVE letters.",
  matching:
    "Match each item with the correct option. Choose the correct letter.",
  map_labeling: "Label the map below. Choose the correct letter.",
  plan_labeling: "Label the plan below. Choose the correct letter.",
  visual_labeling: "Label the visual below. Choose the correct letter.",
  diagram_labeling: "Label the diagram below. Choose the correct letter.",
  form_completion:
    "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  note_completion:
    "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  table_completion:
    "Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  flow_chart_completion:
    "Complete the flow chart below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  summary_completion:
    "Complete the summary below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  sentence_completion:
    "Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  short_answers:
    "Answer the questions below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
};

export const CHOICE_SELECTION_COUNTS: Partial<
  Record<MockQuestionType, number>
> = {
  mcq: 1,
  one_choice: 1,
  two_choices: 2,
  three_choices: 3,
  four_choices: 4,
  five_choices: 5,
  matching: 1,
  map_labeling: 1,
  plan_labeling: 1,
  visual_labeling: 1,
  diagram_labeling: 1,
};

export const COMPLETION_TYPES: MockQuestionType[] = [
  "short_answer",
  "form_completion",
  "note_completion",
  "table_completion",
  "flow_chart_completion",
  "summary_completion",
  "sentence_completion",
  "short_answers",
];

export function choiceSelectionCount(type: MockQuestionType) {
  return CHOICE_SELECTION_COUNTS[type] ?? 0;
}

export function isCompletionType(type: MockQuestionType) {
  return COMPLETION_TYPES.includes(type);
}

export const FIXED_CHOICES: Partial<Record<MockQuestionType, string[]>> = {
  tfng: ["TRUE", "FALSE", "NOT GIVEN"],
  ynng: ["YES", "NO", "NOT GIVEN"],
};

/** Which question types each module may contain. */
export const MODULE_QUESTION_TYPES: Record<MockModule, MockQuestionType[]> = {
  reading: ["mcq", "tfng", "ynng", "short_answer"],
  listening: [...LISTENING_QUESTION_TYPES, "mcq", "short_answer"],
  writing: ["writing"],
  speaking: ["speaking"],
};

export const AUTO_MARKED_TYPES: MockQuestionType[] = [
  "mcq",
  "tfng",
  "ynng",
  "short_answer",
  ...LISTENING_QUESTION_TYPES,
];

export function isAutoMarkedModule(module: MockModule) {
  return module === "reading" || module === "listening";
}

/** Band descriptors examiners mark Writing and Speaking against. */
export const GRADING_CRITERIA: Record<"writing" | "speaking", string[]> = {
  writing: [
    "Task Achievement / Response",
    "Coherence & Cohesion",
    "Lexical Resource",
    "Grammatical Range & Accuracy",
  ],
  speaking: [
    "Fluency & Coherence",
    "Lexical Resource",
    "Grammatical Range & Accuracy",
    "Pronunciation",
  ],
};

export const BAND_OPTIONS = Array.from({ length: 19 }, (_, i) => i * 0.5); // 0 … 9

/** Option letters for multiple choice: A, B, C … */
export function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

/** Lower-case, trim, collapse spaces and strip surrounding punctuation. */
export function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s.,;:!?"'()]+|[\s.,;:!?"'()]+$/g, "");
}

export function isAnswerCorrect(
  type: MockQuestionType,
  accepted: string[] | null | undefined,
  response: string | null | undefined
) {
  const required = choiceSelectionCount(type);
  return (
    answerScore(type, accepted, response) === (required > 1 ? required : 1)
  );
}

/** Number of marks earned by an auto-marked answer (multi-select awards partial credit). */
export function answerScore(
  type: MockQuestionType,
  accepted: string[] | null | undefined,
  response: string | null | undefined
) {
  if (!response || !accepted?.length) return 0;
  if (choiceSelectionCount(type) > 1) {
    const selected = new Set(
      response.split(",").map(normalizeAnswer).filter(Boolean)
    );
    const expected = new Set(accepted.map(normalizeAnswer).filter(Boolean));
    return Array.from(selected).filter(answer => expected.has(answer)).length;
  }
  const given = normalizeAnswer(response);
  if (!given) return 0;
  return accepted.some(answer => normalizeAnswer(answer) === given) ? 1 : 0;
}

/**
 * Official-style raw score (out of 40) → band tables.
 * Each entry is [minimum correct answers, band]; the first match wins.
 */
const LISTENING_TABLE: [number, number][] = [
  [39, 9],
  [37, 8.5],
  [35, 8],
  [32, 7.5],
  [30, 7],
  [26, 6.5],
  [23, 6],
  [18, 5.5],
  [16, 5],
  [13, 4.5],
  [10, 4],
  [8, 3.5],
  [6, 3],
  [4, 2.5],
  [2, 2],
  [1, 1],
];
const ACADEMIC_READING_TABLE: [number, number][] = [
  [39, 9],
  [37, 8.5],
  [35, 8],
  [33, 7.5],
  [30, 7],
  [27, 6.5],
  [23, 6],
  [19, 5.5],
  [15, 5],
  [13, 4.5],
  [10, 4],
  [8, 3.5],
  [6, 3],
  [4, 2.5],
  [2, 2],
  [1, 1],
];
const GENERAL_READING_TABLE: [number, number][] = [
  [40, 9],
  [39, 8.5],
  [37, 8],
  [36, 7.5],
  [34, 7],
  [32, 6.5],
  [30, 6],
  [27, 5.5],
  [23, 5],
  [19, 4.5],
  [15, 4],
  [12, 3.5],
  [9, 3],
  [6, 2.5],
  [3, 2],
  [1, 1],
];

/**
 * Convert a raw score to a band. Tests with fewer or more than 40 marks are
 * scaled to 40 first, so the result is an estimate for shorter practice tests.
 */
export function bandFromRawScore(
  module: MockModule,
  variant: MockVariant,
  correct: number,
  total: number
): number {
  if (total <= 0) return 0;
  const outOf40 = Math.round(
    (Math.max(0, Math.min(correct, total)) / total) * 40
  );
  const table =
    module === "listening"
      ? LISTENING_TABLE
      : variant === "general"
        ? GENERAL_READING_TABLE
        : ACADEMIC_READING_TABLE;
  return table.find(([min]) => outOf40 >= min)?.[1] ?? 0;
}

/** IELTS rounding: averages ending in .25 round up to .5, .75 up to the next whole band. */
export function roundToBand(value: number) {
  return Math.round(value * 2) / 2;
}

export function overallFromCriteria(criteria: Record<string, number>) {
  const values = Object.values(criteria).filter(v => Number.isFinite(v));
  if (!values.length) return null;
  return roundToBand(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function formatBand(band: number | string | null | undefined) {
  if (band === null || band === undefined || band === "") return "—";
  const n = typeof band === "string" ? Number(band) : band;
  return Number.isFinite(n) ? n.toFixed(1) : String(band);
}

export function countWords(text: string | null | undefined) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0;
}

// ============================================
// Book series (Cambridge IELTS 1–21) and answer-sheet tests
// ============================================

export type MockFormat = "full" | "answer_sheet";

export const CAMBRIDGE = {
  key: "cambridge",
  label: "Cambridge IELTS",
  books: 21,
  testsPerBook: 4,
} as const;

export function cambridgeTitle(book: number, test: number, module: MockModule) {
  return `${CAMBRIDGE.label} ${book} · Test ${test} · ${MODULE_LABELS[module]}`;
}

/** Question-number ranges for each part/passage of a standard 40-question paper. */
export const PAPER_LAYOUT: Record<
  "listening" | "reading",
  { title: string; from: number; to: number }[]
> = {
  listening: [
    { title: "Part 1", from: 1, to: 10 },
    { title: "Part 2", from: 11, to: 20 },
    { title: "Part 3", from: 21, to: 30 },
    { title: "Part 4", from: 31, to: 40 },
  ],
  reading: [
    { title: "Passage 1", from: 1, to: 13 },
    { title: "Passage 2", from: 14, to: 26 },
    { title: "Passage 3", from: 27, to: 40 },
  ],
};

/** "(a) large house" → ["a large house", "large house"] — Cambridge keys bracket optional words. */
export function expandOptionalWords(answer: string): string[] {
  const match = /\(([^()]*)\)/.exec(answer);
  if (!match) return [answer.replace(/\s+/g, " ").trim()];
  const withWord =
    answer.slice(0, match.index) +
    match[1] +
    answer.slice(match.index + match[0].length);
  const without =
    answer.slice(0, match.index) + answer.slice(match.index + match[0].length);
  return [
    ...new Set([
      ...expandOptionalWords(withWord),
      ...expandOptionalWords(without),
    ]),
  ].filter(Boolean);
}

export type ParsedKeyItem = {
  number: number;
  type: MockQuestionType;
  answers: string[];
};
export type ParsedKeySection = { title: string; items: ParsedKeyItem[] };

const TFNG = new Set(["TRUE", "FALSE", "NOT GIVEN"]);
const YNNG = new Set(["YES", "NO", "NOT GIVEN"]);

function detectType(answers: string[]): MockQuestionType {
  const upper = answers.map(a => a.toUpperCase());
  if (upper.every(a => TFNG.has(a))) return "tfng";
  if (upper.every(a => YNNG.has(a))) return "ynng";
  return "short_answer";
}

/**
 * Parse an answer key typed or pasted from a book, one answer per line:
 *   Part 2            ← optional heading starts a new section
 *   11 library        ← number, then the answer
 *   12 22 / twenty-two   ← alternatives separated by "/" or " OR "
 *   13 TRUE           ← True/False/Not Given and Yes/No/Not Given are detected
 * Without headings, numbers are split into the standard parts/passages for the module.
 */
export function parseAnswerKey(text: string, module: "listening" | "reading") {
  const errors: string[] = [];
  const headed: ParsedKeySection[] = [];
  const items: ParsedKeyItem[] = [];
  const seen = new Set<number>();

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    // "Part 2", "Passage 3", "Section 1: Questions 1–10" …
    if (/^(part|section|passage|recording)\s*\d+\b/i.test(line)) {
      headed.push({
        title: line.replace(/\s+/g, " ").replace(/[:.\s]+$/, ""),
        items: [],
      });
      continue;
    }
    const m = /^(\d{1,3})\s*[.):\-–]?\s+(.+)$/.exec(line);
    if (!m) {
      errors.push(`Line ${index + 1}: couldn't read "${line}"`);
      continue;
    }
    const number = Number(m[1]);
    if (seen.has(number))
      errors.push(`Question ${number} appears more than once`);
    seen.add(number);
    const answers = m[2]
      .split(/\s*\/\s*|\s+OR\s+/i)
      .flatMap(expandOptionalWords)
      .map(a => a.trim())
      .filter(Boolean);
    const upper = answers.map(a => a.toUpperCase());
    const type = detectType(answers);
    const item = {
      number,
      type,
      answers: type === "short_answer" ? answers : upper,
    };
    if (headed.length) headed[headed.length - 1].items.push(item);
    else items.push(item);
  }

  let sections: ParsedKeySection[];
  if (headed.length) {
    sections = headed.filter(s => s.items.length);
    if (items.length) sections.unshift({ title: "Questions", items });
  } else {
    sections = PAPER_LAYOUT[module]
      .map(part => ({
        title: part.title,
        items: items.filter(i => i.number >= part.from && i.number <= part.to),
      }))
      .filter(s => s.items.length);
    const outside = items.filter(
      i =>
        !PAPER_LAYOUT[module].some(p => i.number >= p.from && i.number <= p.to)
    );
    if (outside.length)
      sections.push({ title: "Other questions", items: outside });
  }
  for (const section of sections) {
    section.items.sort((a, b) => a.number - b.number);
    // A lone "NOT GIVEN" fits both TFNG and YNNG; follow the YES/NO answers around it.
    const hasYesNo = section.items.some(i =>
      i.answers.some(a => a === "YES" || a === "NO")
    );
    if (hasYesNo)
      for (const item of section.items)
        if (item.answers.every(a => a === "NOT GIVEN")) item.type = "ynng";
  }
  return { sections, errors, count: seen.size };
}

/**
 * Official IELTS question types, for "practice by question type".
 * A practice set is a mock test tagged with one of these keys (mock_tests.practiceType).
 * Each maps onto the stored question kinds above (e.g. Matching Headings → mcq, Summary Completion → short_answer).
 */
export type PracticeTypeInfo = {
  key: string;
  label: string;
  description: string;
};

export const PRACTICE_TYPES: Record<MockModule, PracticeTypeInfo[]> = {
  reading: [
    {
      key: "reading_matching_headings",
      label: "Matching Headings",
      description: "Choose the heading that best fits each paragraph.",
    },
    {
      key: "reading_matching_information",
      label: "Matching Information",
      description:
        "Find which paragraph contains a given piece of information.",
    },
    {
      key: "reading_matching_features",
      label: "Matching Features",
      description: "Match statements to people, places, dates or categories.",
    },
    {
      key: "reading_sentence_endings",
      label: "Matching Sentence Endings",
      description: "Complete each sentence with the correct ending.",
    },
    {
      key: "reading_tfng",
      label: "True / False / Not Given",
      description:
        "Decide whether statements agree with the facts in the passage.",
    },
    {
      key: "reading_ynng",
      label: "Yes / No / Not Given",
      description: "Decide whether statements agree with the writer's views.",
    },
    {
      key: "reading_multiple_choice",
      label: "Multiple Choice",
      description: "Choose the correct answer from several options.",
    },
    {
      key: "reading_summary_completion",
      label: "Summary / Note Completion",
      description: "Fill gaps in a summary using words from the passage.",
    },
    {
      key: "reading_sentence_completion",
      label: "Sentence Completion",
      description: "Complete sentences with words from the passage.",
    },
    {
      key: "reading_diagram_labelling",
      label: "Table / Diagram Completion",
      description: "Complete a table or label a diagram from the passage.",
    },
    {
      key: "reading_short_answer",
      label: "Short Answer Questions",
      description: "Answer questions using a few words from the passage.",
    },
  ],
  listening: [
    {
      key: "listening_form_completion",
      label: "Form / Note / Table Completion",
      description: "Fill in missing details while you listen.",
    },
    {
      key: "listening_multiple_choice",
      label: "Multiple Choice",
      description: "Choose the correct answer as the speakers talk.",
    },
    {
      key: "listening_matching",
      label: "Matching",
      description: "Match items in a list to a set of options.",
    },
    {
      key: "listening_map_labelling",
      label: "Map / Plan / Diagram Labelling",
      description: "Label places on a map or parts of a diagram.",
    },
    {
      key: "listening_sentence_completion",
      label: "Sentence Completion",
      description: "Complete sentences with words you hear.",
    },
    {
      key: "listening_flow_chart",
      label: "Flow-chart / Summary Completion",
      description: "Complete the steps of a process or a summary.",
    },
    {
      key: "listening_short_answer",
      label: "Short Answer Questions",
      description: "Answer questions in a few words.",
    },
  ],
  writing: [
    {
      key: "writing_t1_line_graph",
      label: "Task 1: Line Graph",
      description: "Describe trends over time.",
    },
    {
      key: "writing_t1_bar_chart",
      label: "Task 1: Bar Chart",
      description: "Compare categories shown as bars.",
    },
    {
      key: "writing_t1_pie_chart",
      label: "Task 1: Pie Chart",
      description: "Compare proportions of a whole.",
    },
    {
      key: "writing_t1_table",
      label: "Task 1: Table",
      description: "Select and compare the key figures in a table.",
    },
    {
      key: "writing_t1_process",
      label: "Task 1: Process Diagram",
      description: "Describe the stages of a process in order.",
    },
    {
      key: "writing_t1_map",
      label: "Task 1: Maps",
      description: "Describe how a place has changed.",
    },
    {
      key: "writing_t1_letter",
      label: "Task 1 (General): Letter",
      description: "Write a formal, semi-formal or informal letter.",
    },
    {
      key: "writing_t2_opinion",
      label: "Task 2: Opinion Essay",
      description: "Agree or disagree and give reasons.",
    },
    {
      key: "writing_t2_discussion",
      label: "Task 2: Discussion Essay",
      description: "Discuss both views and give your opinion.",
    },
    {
      key: "writing_t2_problem_solution",
      label: "Task 2: Problem / Solution",
      description: "Explain causes or problems and suggest solutions.",
    },
    {
      key: "writing_t2_advantages",
      label: "Task 2: Advantages / Disadvantages",
      description: "Weigh the benefits and drawbacks.",
    },
  ],
  speaking: [
    {
      key: "speaking_part1",
      label: "Part 1: Introduction & Interview",
      description: "Short questions about familiar topics.",
    },
    {
      key: "speaking_part2",
      label: "Part 2: Cue Card",
      description: "Speak for up to 2 minutes after 1 minute of preparation.",
    },
    {
      key: "speaking_part3",
      label: "Part 3: Discussion",
      description: "Discuss abstract ideas linked to the Part 2 topic.",
    },
  ],
};

const PRACTICE_TYPE_INDEX = new Map(
  Object.entries(PRACTICE_TYPES).flatMap(([module, types]) =>
    types.map(
      type => [type.key, { ...type, module: module as MockModule }] as const
    )
  )
);

export function practiceTypeInfo(key: string | null | undefined) {
  return key ? (PRACTICE_TYPE_INDEX.get(key) ?? null) : null;
}
