// Starter Writing and Speaking sets for "practice by question type".
// Writing rows: ["writing", prompt, null, null, tips, minWords]; Speaking rows: ["speaking", prompt, null, null, tips, null, prepSeconds, responseSeconds]

const T1 =
  "You should spend about 20 minutes on this task. Write at least 150 words.";
const T2 =
  "You should spend about 40 minutes on this task. Write at least 250 words.";
const T1_TASK =
  "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
const T2_TASK =
  "Give reasons for your answer and include any relevant examples from your own knowledge or experience.";

const task1 = (practiceType, title, image, prompt, tips) => ({
  practiceType,
  title,
  description:
    "Academic Writing Task 1. Your mentor marks it against the four band criteria.",
  section: {
    title: "Task 1",
    instructions: T1,
    content: T1_TASK,
    imageUrl: image,
  },
  questions: [["writing", prompt, null, null, tips, 150]],
});
const task2 = (practiceType, title, prompt, tips) => ({
  practiceType,
  title,
  description:
    "Writing Task 2. Your mentor marks it against the four band criteria.",
  section: {
    title: "Task 2",
    instructions: T2,
    content: T2_TASK,
    imageUrl: null,
  },
  questions: [["writing", prompt, null, null, tips, 250]],
});

export const WRITING = [
  task1(
    "writing_t1_line_graph",
    "Task 1 Line Graph: Museum Visitors",
    "/practice/line-graph.svg",
    "The graph shows the number of visitors to three museums in a city between 2000 and 2020.",
    'Start with an overview of the main trends: science museum visits rose sharply while history museum visits fell. Group the data by trend rather than describing each year, and use time phrases such as "over the period" and "by 2020".'
  ),
  task1(
    "writing_t1_bar_chart",
    "Task 1 Bar Chart: Leisure Time by Age",
    "/practice/bar-chart.svg",
    "The chart shows the average number of hours per week that people in four age groups spent on three leisure activities.",
    "Compare across age groups: TV viewing rises with age while sport falls. Highlight the extremes (18 hours of TV for over-65s, 2 hours of sport) and avoid listing every bar."
  ),
  task1(
    "writing_t1_pie_chart",
    "Task 1 Pie Chart: Travelling to University",
    "/practice/pie-chart.svg",
    "The pie charts show how students travelled to a university in 2005 and 2025.",
    'Your overview should note the shift away from cars towards buses and bicycles. Use proportion language: "almost half", "a quarter", "trebled". Mention that walking stayed the same.'
  ),
  task1(
    "writing_t1_table",
    "Task 1 Table: Household Spending",
    "/practice/table.svg",
    "The table shows the percentage of household spending on four items in three countries in 2024.",
    "Select the key figures instead of repeating the whole table. Compare countries (Country C spends most on food, Country A most on housing) and note that leisure is the smallest item everywhere."
  ),
  task1(
    "writing_t1_process",
    "Task 1 Process: Recycling Paper",
    "/practice/process.svg",
    "The diagram shows how recycled paper is produced.",
    'State how many stages there are and where the process begins and ends. Use the passive voice ("the paper is sorted") and sequencing words such as "first", "after that" and "finally".'
  ),
  task1(
    "writing_t1_map",
    "Task 1 Maps: Riverside Village",
    "/practice/map.svg",
    "The maps show how Riverside village has changed since 2000.",
    'Summarise the overall change (the village has become more residential and developed). Describe what was replaced, added or removed, using location phrases such as "to the west of the main road" and "where the forest used to be".'
  ),
  {
    practiceType: "writing_t1_letter",
    title: "Task 1 Letter: A Problem with Your Neighbours",
    description: "General Training Writing Task 1 — a formal letter.",
    section: {
      title: "Task 1",
      instructions: T1,
      content:
        "You live in a flat. Recently your neighbours have been making a lot of noise late at night.\n\nWrite a letter to the building manager. In your letter:\n\n• describe the problem\n• explain how it is affecting you\n• say what you would like the manager to do\n\nBegin your letter as follows:\nDear Sir or Madam,",
      imageUrl: null,
    },
    questions: [
      [
        "writing",
        "Write a letter to the building manager about noisy neighbours.",
        null,
        null,
        'Cover all three bullet points in separate paragraphs. Keep a polite, formal tone, state the purpose in the first sentence, and end with "Yours faithfully" because you began with "Dear Sir or Madam".',
        150,
      ],
    ],
  },
  task2(
    "writing_t2_opinion",
    "Task 2 Opinion: University Should Be Free",
    "Some people believe that university education should be free for all students. To what extent do you agree or disagree?",
    "Give a clear position in the introduction and keep it throughout. Use two body paragraphs, each with one main reason, an explanation and an example, then restate your view in the conclusion."
  ),
  task2(
    "writing_t2_discussion",
    "Task 2 Discussion: Working from Home",
    "Some people think working from home benefits both employees and employers. Others believe it has a negative effect on companies. Discuss both views and give your own opinion.",
    "Discuss each view in its own paragraph, then make your opinion clear — either in the introduction and conclusion, or in a final body paragraph."
  ),
  task2(
    "writing_t2_problem_solution",
    "Task 2 Problem / Solution: Traffic in Cities",
    "In many cities, traffic congestion is becoming a serious problem. What are the main causes of this, and what measures could be taken to reduce it?",
    "Answer both questions: one paragraph for causes and one for solutions. Link each solution to a cause, and support it with a realistic example."
  ),
  task2(
    "writing_t2_advantages",
    "Task 2 Advantages / Disadvantages: Studying Abroad",
    "More and more students are choosing to study in a foreign country. Do the advantages of this outweigh the disadvantages?",
    "This question asks for a judgement, so state whether the advantages outweigh the disadvantages. Discuss both sides and explain why one side is stronger."
  ),
];

export const SPEAKING = [
  {
    practiceType: "speaking_part1",
    title: "Part 1: Home, Study and Free Time",
    description:
      "Short questions on familiar topics. Answer in 2–3 sentences with a reason or example.",
    section: {
      title: "Part 1",
      instructions:
        "Answer each question naturally. Aim for two or three sentences.",
      content: null,
      imageUrl: null,
    },
    questions: [
      [
        "speaking",
        "Do you live in a house or a flat? What do you like about it?",
        null,
        null,
        'Give a direct answer, then one reason and a detail: "I live in a flat near the city centre. I like it because…"',
        null,
        5,
        30,
      ],
      [
        "speaking",
        "Are you a student or do you work? Why did you choose that?",
        null,
        null,
        "Explain your choice with a personal reason rather than a one-word answer.",
        null,
        5,
        30,
      ],
      [
        "speaking",
        "What do you usually do at weekends?",
        null,
        null,
        "Use the present simple for routines and add an example from last weekend.",
        null,
        5,
        30,
      ],
      [
        "speaking",
        "Would you like to learn a new skill in the future?",
        null,
        null,
        'Use future forms ("I\'d love to…", "I\'m planning to…") and say why.',
        null,
        5,
        30,
      ],
    ],
  },
  {
    practiceType: "speaking_part2",
    title: "Part 2 Cue Card: A Helpful Person",
    description: "Prepare for 1 minute, then speak for up to 2 minutes.",
    section: {
      title: "Part 2",
      instructions:
        "You have one minute to prepare. You can make notes. Then speak for one to two minutes.",
      content:
        "Describe a person who has helped you in your life.\n\nYou should say:\n• who this person is\n• how you know them\n• what they helped you with\n\nand explain why their help was important to you.",
      imageUrl: null,
    },
    questions: [
      [
        "speaking",
        "Describe a person who has helped you in your life.",
        null,
        null,
        'Use your minute to note a keyword for each bullet point. Tell it as a story in the past tense and spend the most time on the final "explain why" point.',
        null,
        60,
        120,
      ],
    ],
  },
  {
    practiceType: "speaking_part3",
    title: "Part 3 Discussion: Helping Others",
    description:
      "Longer answers on abstract ideas. Give opinions, reasons and examples.",
    section: {
      title: "Part 3",
      instructions:
        "Develop each answer with an opinion, a reason and an example.",
      content: null,
      imageUrl: null,
    },
    questions: [
      [
        "speaking",
        "Why do some people enjoy helping others more than others do?",
        null,
        null,
        "Discuss more than one possible reason (personality, upbringing, culture) and give an example.",
        null,
        10,
        60,
      ],
      [
        "speaking",
        "Do you think people help their neighbours less than they did in the past?",
        null,
        null,
        "Compare past and present, and consider why things might have changed.",
        null,
        10,
        60,
      ],
      [
        "speaking",
        "Should schools teach children to volunteer in their community?",
        null,
        null,
        "Give a clear opinion and acknowledge the other side before concluding.",
        null,
        10,
        60,
      ],
    ],
  },
];
