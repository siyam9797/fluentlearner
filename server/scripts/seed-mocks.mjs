/** Published starter content for the student Practice and Mock Test libraries. */
import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);

const tests = [
  {
    title: "Reading Skills Practice",
    description: "Build confidence with skimming, detail and inference questions.",
    module: "reading", mode: "practice", duration: null, attempts: null,
    section: {
      title: "The return of urban gardens",
      instructions: "Read the passage and answer every question.",
      content: "Across many large cities, unused rooftops and vacant plots are being turned into community gardens. Supporters say these spaces do more than provide fresh food. They can reduce summer heat, absorb rainwater and give neighbours a place to meet. Early projects depended heavily on volunteers, but some newer gardens employ trained coordinators. Researchers caution that urban gardens cannot supply all the food a city needs. Even so, they argue that the social and environmental benefits make the projects worthwhile.",
      questions: [
        ["tfng", "Urban gardens are only created on rooftops.", null, ["FALSE"], "The passage also mentions vacant plots."],
        ["tfng", "Some modern gardens employ professional coordinators.", null, ["TRUE"], "Newer gardens may employ trained coordinators."],
        ["mcq", "Which benefit is mentioned in the passage?", ["Lower school fees", "Reduced summer heat", "Faster transport"], ["B"], "The gardens can reduce summer heat."],
        ["short_answer", "What can the gardens absorb?", null, ["rainwater", "rain water"], "The passage states that gardens absorb rainwater."],
        ["ynng", "Researchers believe urban gardens can provide all of a city's food.", null, ["NO"], "Researchers explicitly caution that they cannot."],
      ],
    },
  },
  {
    title: "Listening Skills Practice",
    description: "Practise identifying names, times and key details from a short conversation.",
    module: "listening", mode: "practice", duration: null, attempts: null,
    section: {
      title: "Course registration",
      instructions: "Use the transcript below as a practice recording and answer the questions.",
      content: "Receptionist: Good morning, Westfield Language Centre. Student: I'd like to join the evening pronunciation course. Receptionist: Certainly. It begins on Tuesday 14 October and runs from 6:30 to 8:00. The tutor is Ms Helen Carter. The full course costs £85, including the workbook. Classes are held in Room 12.",
      questions: [
        ["short_answer", "Which course does the student want to join?", null, ["pronunciation", "pronunciation course", "evening pronunciation course"], "The student asks for the evening pronunciation course."],
        ["short_answer", "On what date does the course begin?", null, ["14 October", "October 14", "14th October"], "The stated date is 14 October."],
        ["mcq", "What time does the class begin?", ["6:00", "6:30", "8:00"], ["B"], "It runs from 6:30 to 8:00."],
        ["short_answer", "What is the tutor's surname?", null, ["Carter"], "The tutor is Ms Helen Carter."],
        ["short_answer", "Which room is used?", null, ["12", "Room 12"], "Classes are in Room 12."],
      ],
    },
  },
  {
    title: "Writing Task 2 Practice",
    description: "Develop and organise an opinion essay with no time pressure.",
    module: "writing", mode: "practice", duration: null, attempts: null,
    section: {
      title: "Opinion essay",
      instructions: "Write at least 250 words. Support your position with reasons and examples.",
      content: "Plan briefly before you write and leave time to check your response.",
      questions: [["writing", "Some people believe online learning can replace classroom teaching completely. To what extent do you agree or disagree?", null, null, null, 250]],
    },
  },
  {
    title: "Speaking Confidence Practice",
    description: "Record short answers and build fluency across all three speaking parts.",
    module: "speaking", mode: "practice", duration: null, attempts: null,
    section: {
      title: "Everyday life and learning",
      instructions: "Record a natural answer for each prompt. Do not memorise a script.",
      content: "Speak clearly and extend your answers with reasons or examples.",
      questions: [
        ["speaking", "What do you enjoy most about the place where you live?", null, null, null, null, 10, 45],
        ["speaking", "Describe a skill you would like to learn. Explain why it interests you.", null, null, null, null, 60, 120],
        ["speaking", "Do you think schools will teach different skills in the future? Why?", null, null, null, null, 20, 60],
      ],
    },
  },
  {
    title: "Academic Reading Mock 1",
    description: "A timed academic reading mini-mock with automatic marking.",
    module: "reading", mode: "exam", duration: 20, attempts: 3,
    section: {
      title: "The science of sleep",
      instructions: "You have 20 minutes. Read the passage carefully and answer all questions.",
      content: "Sleep was once thought to be a passive state, but modern research shows that the brain remains highly active. During sleep it consolidates memories, regulates emotion and clears metabolic waste. Adults are commonly advised to sleep for seven to nine hours, though individual needs vary. Artificial light can delay the release of melatonin, a hormone that helps prepare the body for sleep. Researchers therefore recommend reducing exposure to bright screens before bedtime.",
      questions: [
        ["tfng", "The brain becomes completely inactive during sleep.", null, ["FALSE"], null],
        ["mcq", "What does sleep help consolidate?", ["Memories", "Muscles", "Appetite"], ["A"], null],
        ["short_answer", "How many hours of sleep are adults commonly advised to get?", null, ["seven to nine", "7 to 9", "7-9"], null],
        ["short_answer", "Which hormone helps prepare the body for sleep?", null, ["melatonin"], null],
        ["ynng", "All adults require exactly eight hours of sleep.", null, ["NO"], null],
      ],
    },
  },
  {
    title: "Listening Mock 1",
    description: "A timed listening-style mini-mock focused on accurate detail.",
    module: "listening", mode: "exam", duration: 10, attempts: 3,
    section: {
      title: "Museum tour booking",
      instructions: "Read the supplied recording transcript once, then complete the answers.",
      content: "The Saturday museum tour leaves the main entrance at 10:15. Visitors should arrive fifteen minutes early. Tickets cost £12 for adults and £7 for students. The tour lasts approximately ninety minutes and finishes beside the museum café. Photography is allowed, but flash must not be used.",
      questions: [
        ["short_answer", "What time does the tour leave?", null, ["10:15", "10.15"], null],
        ["short_answer", "How many minutes early should visitors arrive?", null, ["15", "fifteen"], null],
        ["mcq", "How much is a student ticket?", ["£7", "£10", "£12"], ["A"], null],
        ["short_answer", "Where does the tour finish?", null, ["museum café", "museum cafe", "café", "cafe"], null],
        ["mcq", "What is not permitted?", ["Photography", "Using flash", "Visiting the café"], ["B"], null],
      ],
    },
  },
  {
    title: "Academic Writing Mock 1",
    description: "A full timed writing paper with Task 1 and Task 2.",
    module: "writing", mode: "exam", duration: 60, attempts: 2,
    sections: [
      { title: "Task 1", instructions: "Spend about 20 minutes and write at least 150 words.", content: "Summarise the main features and make relevant comparisons.", questions: [["writing", "The percentage of commuters travelling by bicycle in a city rose from 12% in 2010 to 28% in 2025, while car use fell from 55% to 39%. Summarise the information.", null, null, null, 150]] },
      { title: "Task 2", instructions: "Spend about 40 minutes and write at least 250 words.", content: "Give reasons for your answer and include relevant examples.", questions: [["writing", "Some cities charge drivers to enter the city centre. Do the advantages of this policy outweigh the disadvantages?", null, null, null, 250]] },
    ],
  },
  {
    title: "Speaking Mock 1",
    description: "A timed three-part speaking simulation for examiner review.",
    module: "speaking", mode: "exam", duration: 15, attempts: 2,
    sections: [
      { title: "Part 1", instructions: "Answer briefly but naturally.", content: null, questions: [["speaking", "Do you work or are you a student? What do you enjoy about it?", null, null, null, null, 5, 45]] },
      { title: "Part 2", instructions: "Prepare for one minute, then speak for up to two minutes.", content: "Describe a journey you remember well. Say where you went, who you went with, and why it was memorable.", questions: [["speaking", "Describe a memorable journey.", null, null, null, null, 60, 120]] },
      { title: "Part 3", instructions: "Develop your answer and support your opinion.", content: null, questions: [["speaking", "How might the way people travel change in the next twenty years?", null, null, null, null, 20, 60]] },
    ],
  },
];

async function addTest(test, index) {
  const [existing] = await db.execute("SELECT id FROM mock_tests WHERE title = ? LIMIT 1", [test.title]);
  let testId = existing[0]?.id;
  if (testId) {
    await db.execute("UPDATE mock_tests SET description=?, module=?, mode=?, durationMinutes=?, maxAttempts=?, isPublished=true, sortOrder=? WHERE id=?", [test.description, test.module, test.mode, test.duration, test.attempts, index + 1, testId]);
    const [sections] = await db.execute("SELECT id FROM mock_sections WHERE testId = ? LIMIT 1", [testId]);
    if (sections.length) return;
  } else {
    const [result] = await db.execute("INSERT INTO mock_tests (title,description,module,variant,mode,durationMinutes,maxAttempts,isPublished,sortOrder,format) VALUES (?, ?, ?, 'academic', ?, ?, ?, true, ?, 'full')", [test.title, test.description, test.module, test.mode, test.duration, test.attempts, index + 1]);
    testId = result.insertId;
  }

  const sections = test.sections ?? [test.section];
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    const [sectionResult] = await db.execute("INSERT INTO mock_sections (testId,title,instructions,content,sortOrder) VALUES (?, ?, ?, ?, ?)", [testId, section.title, section.instructions, section.content, sectionIndex]);
    for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex += 1) {
      const [type, prompt, options, answers, explanation, minWords, prepSeconds, responseSeconds] = section.questions[questionIndex];
      await db.execute("INSERT INTO mock_questions (testId,sectionId,type,prompt,options,answers,explanation,points,minWords,prepSeconds,responseSeconds,sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)", [testId, sectionResult.insertId, type, prompt, options ? JSON.stringify(options) : null, answers ? JSON.stringify(answers) : null, explanation, minWords ?? null, prepSeconds ?? null, responseSeconds ?? null, questionIndex]);
    }
  }
}

await db.beginTransaction();
try {
  for (let index = 0; index < tests.length; index += 1) await addTest(tests[index], index);
  await db.commit();
  console.log(`Mock library ready: ${tests.length} published tests across 4 IELTS modules.`);
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
