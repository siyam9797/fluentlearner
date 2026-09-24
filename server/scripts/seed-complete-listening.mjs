/** A complete, original IELTS-style Listening mock: four parts and 40 questions. */
import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
const TITLE = "Complete Listening Mock · Community & Study";

const q = (type, prompt, answers, options = null) => ({ type, prompt, answers, options });
const parts = [
  {
    title: "Part 1 · Course registration",
    instructions: "Questions 1–10. Complete the registration form. Write no more than two words and/or a number for each answer.",
    script: `Receptionist: Good morning, Greenford Adult Learning Centre. How can I help? Caller: I'd like to register for the weekend photography course. Receptionist: Of course. Can I take your name? Caller: It's Nadia Rahman. Nadia is N A D I A, and Rahman is R A H M A N. Receptionist: Thank you. And your address? Caller: 27 King Street, Greenford. Receptionist: What's the best number to contact you on? Caller: My mobile is 07955 318 204. Receptionist: Now, we offer a Saturday morning class and a Sunday afternoon class. Caller: Sunday would be better. Receptionist: That runs from two fifteen until four forty-five. The first session is on the sixth of October. Caller: Fine. Receptionist: The standard fee is ninety-five pounds, but students pay seventy-five. Caller: I'm working, so I'll pay the standard fee. Does that include equipment? Receptionist: It includes a course handbook, but you'll need to bring your own camera. A tripod is optional. Caller: That's fine. Receptionist: Classes are in Studio 3, on the second floor. Your tutor is Daniel Lewis. Caller: Great. Receptionist: Finally, where did you hear about us? Caller: I saw a poster in the library. Receptionist: Perfect. You'll receive confirmation by email this afternoon.`,
    image: null,
    questions: [
      q("short_answer", "Registration form · Family name", ["Rahman"]),
      q("short_answer", "House number", ["27", "twenty-seven"]),
      q("short_answer", "Street name", ["King Street"]),
      q("short_answer", "Preferred day", ["Sunday"]),
      q("short_answer", "Class starts at", ["2:15", "2.15", "two fifteen"]),
      q("short_answer", "First session date", ["6 October", "October 6", "6th October"]),
      q("short_answer", "Course fee", ["£95", "95 pounds", "95"]),
      q("short_answer", "Included item", ["course handbook", "handbook"]),
      q("short_answer", "Room", ["Studio 3", "3"]),
      q("short_answer", "Where did Nadia see the advertisement?", ["library", "the library"]),
    ],
  },
  {
    title: "Part 2 · Community centre tour",
    instructions: "Questions 11–15: choose the correct answer. Questions 16–20: match each facility with location A–F on the map.",
    script: `Welcome to Riverside Community Centre. Before our tour, a few practical details. The centre opens at eight thirty on weekdays, but at nine on Saturdays. On Sundays it is closed to the public, although private events may be booked. Membership is free for anyone under eighteen; adults pay twenty pounds per year. Please collect your membership card from reception, not from the office upstairs. This month's special event is the Spring Food Fair on the twenty-third, moved from the sixteenth because of building work. Now look at the map. You entered from the south. Reception is immediately on your right. The café is in room F, directly to the left of reception. The fitness studio is room D, in the south-west corner. Walk north along the left corridor and the art room is A. The computer room is B, at the northern end above the courtyard. On the opposite side, room C is the quiet study room. Finally, the children's playroom is E, in the south-east corner. The central courtyard is open whenever the centre is open, but children must be supervised there.`,
    image: "/listening-community-map.svg",
    questions: [
      q("mcq", "When does the centre open on Saturday?", ["B"], ["8:00", "9:00", "9:30"]),
      q("mcq", "Who receives free membership?", ["A"], ["People under 18", "Full-time students", "People over 65"]),
      q("mcq", "Where are membership cards collected?", ["C"], ["The café", "The upstairs office", "Reception"]),
      q("mcq", "On what date is the Spring Food Fair?", ["C"], ["16th", "20th", "23rd"]),
      q("mcq", "Why was the event date changed?", ["B"], ["Staff illness", "Building work", "Bad weather"]),
      q("mcq", "Map · Café", ["F"], ["A", "B", "C", "D", "E", "F"]),
      q("mcq", "Map · Fitness studio", ["D"], ["A", "B", "C", "D", "E", "F"]),
      q("mcq", "Map · Art room", ["A"], ["A", "B", "C", "D", "E", "F"]),
      q("mcq", "Map · Computer room", ["B"], ["A", "B", "C", "D", "E", "F"]),
      q("mcq", "Map · Children's playroom", ["E"], ["A", "B", "C", "D", "E", "F"]),
    ],
  },
  {
    title: "Part 3 · Research project discussion",
    instructions: "Questions 21–25: choose the correct answer. Questions 26–30: complete the project notes.",
    script: `Tutor: So, Maya and Oliver, tell me about your research project. Maya: We're studying how first-year students use the university library. At first we planned to compare printed books with electronic books, but there was already a recent study on that. Oliver: So we changed our focus to the study spaces students choose. Tutor: Good. How will you collect your data? Maya: We considered an online questionnaire, but response rates can be low. Instead, we'll conduct short face-to-face interviews near the library exit. Oliver: We hope to speak to sixty students over three days. Tutor: Make sure you include both morning and evening users. Oliver: Yes. We'll collect data on Monday, Wednesday and Friday, from ten to twelve in the morning and from six to eight in the evening. Tutor: What will you ask? Maya: Their year of study, the length of their visit, which floor they used and whether they worked alone or in a group. We won't ask for names. Tutor: Sensible. What do you predict? Oliver: We think quiet individual areas will be most popular during exam weeks, while group rooms will be busier earlier in the term. Tutor: And how will you present the results? Maya: A bar chart for the preferred floors and a table comparing visit length. Oliver will write the methods section, I'll analyse the interview data, and we'll write the conclusion together. Tutor: Your main challenge may be getting a balanced sample, so record the time of every interview. Send me your draft by the eighteenth of November.`,
    image: null,
    questions: [
      q("mcq", "What is the project's final focus?", ["C"], ["Printed books", "Electronic resources", "Choice of study spaces"]),
      q("mcq", "Why did they reject an online questionnaire?", ["A"], ["It may receive few replies", "It costs too much", "It takes too long to design"]),
      q("mcq", "Where will interviews take place?", ["B"], ["Inside group rooms", "Near the library exit", "In the student café"]),
      q("mcq", "How many students do they plan to interview?", ["C"], ["30", "40", "60"]),
      q("mcq", "What does the tutor identify as the main challenge?", ["B"], ["Writing questions", "Getting a balanced sample", "Making a bar chart"]),
      q("short_answer", "Data collection days: Monday, Wednesday and ____", ["Friday"]),
      q("short_answer", "Evening interviews finish at ____", ["8", "8:00", "8 pm", "8 p.m."]),
      q("short_answer", "Students will not be asked for their ____", ["names", "name"]),
      q("short_answer", "Maya will analyse the ____ data", ["interview"]),
      q("short_answer", "Draft deadline: ____ November", ["18", "18th", "eighteenth"]),
    ],
  },
  {
    title: "Part 4 · Urban bees lecture",
    instructions: "Questions 31–40. Complete the lecture notes. Write one word only for each answer.",
    script: `Today we'll examine why bees are increasingly found in cities. Although people associate bees with farmland, urban areas can provide surprisingly rich habitats. City parks and private gardens often contain a wider variety of flowers than modern agricultural land. This diversity means nectar may be available across a longer season. Cities are also slightly warmer, allowing some species to become active earlier in spring. However, urban life creates risks. Traffic pollution can affect how insects recognise floral scents, while glass buildings may disrupt flight paths. The greatest problem is not usually a lack of food but a shortage of safe nesting sites. Researchers in Bristol tested a simple response: small wooden bee hotels containing hollow tubes. They placed these at different heights and orientations. Hotels facing south-east attracted the largest number of solitary bees. Structures positioned one to two metres above the ground performed better than those installed on rooftops. The diameter of the nesting tubes mattered too: tubes between six and nine millimetres were used most often. Maintenance is essential. Damp or damaged tubes can contain parasites, so they should be replaced every two years. Residents can also help by avoiding pesticides, growing native flowers and leaving a shallow dish of water containing stones where insects can land. The study shows that small, carefully designed actions can support biodiversity even in densely populated neighbourhoods.`,
    image: null,
    questions: [
      q("short_answer", "Urban gardens often contain a greater variety of ____", ["flowers"]),
      q("short_answer", "Cities allow some bee species to become active earlier in ____", ["spring"]),
      q("short_answer", "Pollution affects recognition of floral ____", ["scents"]),
      q("short_answer", "The main urban problem is a shortage of safe ____ sites", ["nesting"]),
      q("short_answer", "Bee hotels were made from ____", ["wood", "wooden"]),
      q("short_answer", "The most successful hotels faced ____", ["south-east", "southeast"]),
      q("short_answer", "Effective hotels were one to two metres above the ____", ["ground"]),
      q("short_answer", "The preferred tube diameter was six to nine ____", ["millimetres", "millimeters"]),
      q("short_answer", "Old tubes may contain ____", ["parasites"]),
      q("short_answer", "A water dish should contain ____ for bees to land on", ["stones"]),
    ],
  },
];

await db.beginTransaction();
try {
  const [existing] = await db.execute("SELECT id FROM mock_tests WHERE title=? LIMIT 1", [TITLE]);
  let testId = existing[0]?.id;
  if (testId) {
    const [attempts] = await db.execute("SELECT COUNT(*) count FROM mock_attempts WHERE testId=?", [testId]);
    if (Number(attempts[0].count)) throw new Error("Cannot rebuild this test because student attempts already exist");
    await db.execute("DELETE q FROM mock_questions q WHERE q.testId=?", [testId]);
    await db.execute("DELETE s FROM mock_sections s WHERE s.testId=?", [testId]);
    await db.execute("UPDATE mock_tests SET description=?, module='listening', variant='academic', mode='exam', durationMinutes=30, maxAttempts=3, isPublished=true, format='full', series=NULL, bookNumber=NULL, testNumber=NULL WHERE id=?", ["A complete original four-part listening mock with 40 questions, map work and automatic scoring.", testId]);
  } else {
    const [result] = await db.execute("INSERT INTO mock_tests (title,description,module,variant,mode,durationMinutes,maxAttempts,isPublished,sortOrder,format) VALUES (?,?,'listening','academic','exam',30,3,true,50,'full')", [TITLE, "A complete original four-part listening mock with 40 questions, map work and automatic scoring."]);
    testId = result.insertId;
  }

  for (const [partIndex, part] of parts.entries()) {
    const [section] = await db.execute("INSERT INTO mock_sections (testId,title,instructions,content,imageUrl,sortOrder) VALUES (?,?,?,?,?,?)", [testId, part.title, part.instructions, part.script, part.image, partIndex]);
    for (const [index, question] of part.questions.entries()) {
      await db.execute("INSERT INTO mock_questions (testId,sectionId,type,prompt,options,answers,points,sortOrder) VALUES (?,?,?,?,?,?,1,?)", [testId, section.insertId, question.type, question.prompt, question.options ? JSON.stringify(question.options) : null, JSON.stringify(question.answers), index]);
    }
  }
  await db.commit();
  console.log(`Complete listening mock ready: ${parts.length} parts and ${parts.reduce((sum, part) => sum + part.questions.length, 0)} questions.`);
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
