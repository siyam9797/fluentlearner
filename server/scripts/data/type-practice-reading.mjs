// Starter Reading sets for "practice by question type". Question rows: [type, prompt, options, answers, explanation]
// mcq answers are option letters (A, B, C…); tfng/ynng use TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN.

const BEES = `A
For most of the twentieth century, beekeeping was regarded as a rural activity. Hives were kept on farms and in orchards, far from the noise and pollution of towns. In the last twenty years, however, beehives have appeared on the roofs of offices, hotels and apartment blocks in cities such as London, Paris and New York.

B
The main reason for this change is concern about the decline of pollinating insects. Farmers depend on bees to pollinate crops, and reports of falling bee numbers encouraged many city dwellers to act. Keeping a hive seemed a practical way for ordinary people to help.

C
Surprisingly, cities can be good places for bees. Parks, gardens and tree-lined streets offer a wide variety of flowers that bloom at different times of the year. In contrast, modern farmland is often planted with a single crop, which provides food for only a few weeks. Urban temperatures are also slightly higher, so bees can forage for longer each day.

D
Not everyone welcomes the trend. Some scientists warn that too many hives in one area may create competition for food, harming wild bees and other pollinators that are already struggling. They argue that planting more flowers would do more good than adding more hives.

E
Beekeeping associations now offer training courses for new urban beekeepers. These courses cover how to handle bees safely, how to prevent disease and how to reassure neighbours who may be nervous. Many experts believe that careful management, rather than simply increasing the number of hives, is the key to success.`;

const BICYCLE = `The bicycle did not appear in a single moment of invention. It developed gradually over more than seventy years, with contributions from many people in different countries.

The first recognised ancestor of the bicycle was built in 1817 by Karl Drais, a German civil servant. His "running machine" had two wheels in a line but no pedals; riders pushed themselves along with their feet. It was popular for a short time among wealthy young men, but it was expensive and uncomfortable on rough roads.

In the 1860s, pedals were attached directly to the front wheel. Pierre Michaux, a Paris blacksmith, is often credited with producing the first machines of this type in large numbers. Because the pedals turned the front wheel directly, a larger wheel meant a higher speed, and this led to the "high-wheeler" of the 1870s, whose front wheel could be more than a metre and a half across. These machines were fast but dangerous, and falls were common.

The breakthrough came in 1885, when John Kemp Starley, an English engineer, produced the "safety bicycle". It had two wheels of similar size and a chain that drove the rear wheel. Riders could now sit lower and put their feet on the ground. Three years later, John Boyd Dunlop, a Scottish vet, developed the air-filled tyre for his son's tricycle, and it was quickly adopted for bicycles, making them far more comfortable.

By the 1890s, cycling had become a craze across Europe and North America. For many women in particular, the bicycle offered a new sense of independence, and it even influenced fashion, as long skirts were replaced by more practical clothing.`;

const HOMEWORK = `Every few years, a school somewhere announces that it is abolishing homework, and the news is greeted with delight by pupils and alarm by many parents. In my view, both reactions miss the point. The question is not whether homework should exist, but what kind of homework is worth setting.

There is little evidence that long hours of homework improve results for young children. For them, reading with a parent or playing outside is almost certainly more valuable than completing worksheets. I would go further and argue that homework for pupils under ten often does more harm than good, because it turns learning into a chore at the very age when curiosity should be encouraged.

For older students, the picture is different. Teenagers preparing for important examinations need time to practise independently, and a certain amount of homework helps them develop the self-discipline they will need at university and at work. The problem is quantity. When teachers in different subjects do not coordinate, students can receive several heavy assignments on the same evening, leaving no time for rest.

Some critics claim that homework increases inequality, because children from wealthier homes have quiet rooms, computers and educated parents to help them. This concern is reasonable, but banning homework is not the answer. Schools can instead provide supervised study spaces after lessons, so that every student has somewhere suitable to work.

Ultimately, good homework is short, clearly connected to classroom learning and returned with useful feedback. If schools concentrated on these three qualities, the annual argument about abolishing homework would soon disappear.`;

const DESALINATION = `As fresh water becomes scarcer, more countries are turning to the sea. Desalination, the process of removing salt from seawater, now supplies drinking water to more than three hundred million people around the world.

The most common method is called reverse osmosis. First, seawater is drawn into the plant through an intake pipe, usually placed some distance from the shore to avoid sand and marine life. Next, the water passes through a series of filters that remove larger particles such as seaweed and sediment. This stage is known as pre-treatment, and it protects the delicate equipment used later in the process.

The filtered water is then pumped at very high pressure through special membranes. These membranes contain tiny holes that allow water molecules to pass through but block the salt. About forty-five per cent of the seawater becomes fresh water at this stage; the rest, which is now twice as salty as normal seawater, is known as brine.

Before it can be drunk, the fresh water is treated once more. Small amounts of minerals such as calcium are added, because water with no minerals tastes flat and can damage pipes. Finally, it is disinfected and stored in tanks before being sent to homes.

Desalination has two major disadvantages. It uses large amounts of energy, mostly for the high-pressure pumps, which makes the water expensive. In addition, the brine must be returned to the sea, where it can harm plants and animals if it is not spread out carefully. Engineers are now developing plants powered by solar energy and better ways of dispersing brine.`;

const readingSection = (title, passage, instructions) => ({
  title,
  instructions,
  content: passage,
});
const HEADINGS = [
  "Training for a new generation",
  "The high cost of city honey",
  "From the countryside to the rooftop",
  "A concern about competition",
  "Why towns suit bees",
  "A response to falling numbers",
  "Laws against urban hives",
];
const PARAGRAPHS = [
  "Paragraph A",
  "Paragraph B",
  "Paragraph C",
  "Paragraph D",
  "Paragraph E",
];
const PEOPLE = [
  "Karl Drais",
  "Pierre Michaux",
  "John Kemp Starley",
  "John Boyd Dunlop",
];

export default [
  {
    practiceType: "reading_matching_headings",
    title: "Matching Headings: The Urban Beehive",
    description:
      "Choose the heading that best fits each paragraph. There are more headings than paragraphs.",
    section: readingSection(
      "The Urban Beehive",
      BEES,
      "Choose the correct heading for each paragraph from the list of headings below."
    ),
    questions: [
      [
        "mcq",
        "Paragraph A",
        HEADINGS,
        ["C"],
        "Paragraph A describes how beehives moved from farms to city roofs.",
      ],
      [
        "mcq",
        "Paragraph B",
        HEADINGS,
        ["F"],
        "It explains that people started keeping bees because bee numbers were falling.",
      ],
      [
        "mcq",
        "Paragraph C",
        HEADINGS,
        ["E"],
        "It lists reasons cities are good places for bees.",
      ],
      [
        "mcq",
        "Paragraph D",
        HEADINGS,
        ["D"],
        "Scientists warn that too many hives create competition for food.",
      ],
      [
        "mcq",
        "Paragraph E",
        HEADINGS,
        ["A"],
        "It is about training courses for new beekeepers.",
      ],
    ],
  },
  {
    practiceType: "reading_matching_information",
    title: "Matching Information: The Urban Beehive",
    description:
      "Which paragraph contains each piece of information? You may use any letter more than once.",
    section: readingSection(
      "The Urban Beehive",
      BEES,
      "Which paragraph, A–E, contains the following information?"
    ),
    questions: [
      [
        "mcq",
        "a comparison between the food available to bees in cities and on farms",
        PARAGRAPHS,
        ["C"],
        "Paragraph C contrasts varied urban flowers with single crops on farmland.",
      ],
      [
        "mcq",
        "a suggestion that growing plants may be more useful than keeping bees",
        PARAGRAPHS,
        ["D"],
        "Scientists in D say planting more flowers would do more good.",
      ],
      [
        "mcq",
        "a reference to people who may be worried about living near bees",
        PARAGRAPHS,
        ["E"],
        "E mentions reassuring nervous neighbours.",
      ],
      [
        "mcq",
        "examples of cities where rooftop hives can be found",
        PARAGRAPHS,
        ["A"],
        "A names London, Paris and New York.",
      ],
      [
        "mcq",
        "the reason farmers need bees",
        PARAGRAPHS,
        ["B"],
        "B says farmers depend on bees to pollinate crops.",
      ],
    ],
  },
  {
    practiceType: "reading_sentence_endings",
    title: "Sentence Endings: The Urban Beehive",
    description: "Complete each sentence with the correct ending.",
    section: readingSection(
      "The Urban Beehive",
      BEES,
      "Complete each sentence with the correct ending, A–F."
    ),
    questions: [
      [
        "mcq",
        "Until recently, most beehives were kept",
        [
          "far from towns.",
          "in public parks.",
          "by scientists.",
          "because city flowers bloom at different times.",
          "may reduce food for wild bees.",
          "on the roofs of schools.",
        ],
        ["A"],
        "Hives were kept on farms and in orchards, far from towns.",
      ],
      [
        "mcq",
        "Bees in cities can find food for much of the year",
        [
          "far from towns.",
          "in public parks.",
          "by scientists.",
          "because city flowers bloom at different times.",
          "may reduce food for wild bees.",
          "on the roofs of schools.",
        ],
        ["D"],
        "Paragraph C: flowers bloom at different times of the year.",
      ],
      [
        "mcq",
        "Adding too many hives to one area",
        [
          "far from towns.",
          "in public parks.",
          "by scientists.",
          "because city flowers bloom at different times.",
          "may reduce food for wild bees.",
          "on the roofs of schools.",
        ],
        ["E"],
        "Paragraph D: competition for food may harm wild bees.",
      ],
    ],
  },
  {
    practiceType: "reading_matching_features",
    title: "Matching Features: The History of the Bicycle",
    description: "Match each statement with the correct person.",
    section: readingSection(
      "The History of the Bicycle",
      BICYCLE,
      "Match each statement with the correct person. You may use any letter more than once."
    ),
    questions: [
      [
        "mcq",
        "made a machine that had no pedals",
        PEOPLE,
        ["A"],
        "Drais's running machine had no pedals.",
      ],
      [
        "mcq",
        "produced a design in which a chain turned the back wheel",
        PEOPLE,
        ["C"],
        "Starley's safety bicycle had a chain that drove the rear wheel.",
      ],
      [
        "mcq",
        "developed an improvement originally intended for a child",
        PEOPLE,
        ["D"],
        "Dunlop developed the air-filled tyre for his son's tricycle.",
      ],
      [
        "mcq",
        "manufactured machines with pedals on the front wheel in large numbers",
        PEOPLE,
        ["B"],
        "Michaux is credited with producing the first pedal machines in large numbers.",
      ],
    ],
  },
  {
    practiceType: "reading_tfng",
    title: "True / False / Not Given: The History of the Bicycle",
    description: "Do the statements agree with the information in the passage?",
    section: readingSection(
      "The History of the Bicycle",
      BICYCLE,
      "Write TRUE if the statement agrees with the information, FALSE if it contradicts the information, NOT GIVEN if there is no information on this."
    ),
    questions: [
      [
        "tfng",
        "The bicycle was invented by one person in a single year.",
        null,
        ["FALSE"],
        "It developed gradually over more than seventy years with many contributors.",
      ],
      [
        "tfng",
        "Karl Drais's running machine was cheap to buy.",
        null,
        ["FALSE"],
        "The passage says it was expensive.",
      ],
      [
        "tfng",
        "Pierre Michaux worked as a blacksmith.",
        null,
        ["TRUE"],
        "He is described as a Paris blacksmith.",
      ],
      [
        "tfng",
        "High-wheelers were mainly used for racing.",
        null,
        ["NOT GIVEN"],
        "The passage says they were fast and dangerous but not what they were mainly used for.",
      ],
      [
        "tfng",
        "The air-filled tyre was first used on a tricycle.",
        null,
        ["TRUE"],
        "Dunlop developed it for his son's tricycle.",
      ],
    ],
  },
  {
    practiceType: "reading_short_answer",
    title: "Short Answer Questions: The History of the Bicycle",
    description:
      "Answer using NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage.",
    section: readingSection(
      "The History of the Bicycle",
      BICYCLE,
      "Answer the questions below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer."
    ),
    questions: [
      [
        "short_answer",
        "In which year was the running machine built?",
        null,
        ["1817"],
        "The first ancestor was built in 1817.",
      ],
      [
        "short_answer",
        "What name was given to Starley's 1885 design?",
        null,
        ["safety bicycle", "the safety bicycle"],
        'Starley produced the "safety bicycle".',
      ],
      [
        "short_answer",
        "What was Dunlop's profession?",
        null,
        ["vet", "a vet"],
        "John Boyd Dunlop was a Scottish vet.",
      ],
      [
        "short_answer",
        "Which item of clothing did cycling help to replace?",
        null,
        ["long skirts", "skirts"],
        "Long skirts were replaced by more practical clothing.",
      ],
    ],
  },
  {
    practiceType: "reading_ynng",
    title: "Yes / No / Not Given: Is Homework Worth It?",
    description: "Do the statements agree with the views of the writer?",
    section: readingSection(
      "Is Homework Worth It?",
      HOMEWORK,
      "Write YES if the statement agrees with the views of the writer, NO if it contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this."
    ),
    questions: [
      [
        "ynng",
        "Schools should stop setting homework completely.",
        null,
        ["NO"],
        "The writer says the question is what kind of homework to set, not whether it should exist.",
      ],
      [
        "ynng",
        "Homework can make young children less curious about learning.",
        null,
        ["YES"],
        "It turns learning into a chore at the age when curiosity should be encouraged.",
      ],
      [
        "ynng",
        "Teachers in different subjects should plan homework together.",
        null,
        ["YES"],
        "The writer criticises teachers who do not coordinate.",
      ],
      [
        "ynng",
        "Students who do more homework earn higher salaries later in life.",
        null,
        ["NOT GIVEN"],
        "The writer does not discuss salaries.",
      ],
      [
        "ynng",
        "Homework always increases inequality between students.",
        null,
        ["NO"],
        "The writer accepts the concern but says schools can provide study spaces instead.",
      ],
    ],
  },
  {
    practiceType: "reading_multiple_choice",
    title: "Multiple Choice: Is Homework Worth It?",
    description: "Choose the correct letter, A, B, C or D.",
    section: readingSection(
      "Is Homework Worth It?",
      HOMEWORK,
      "Choose the correct letter, A, B, C or D."
    ),
    questions: [
      [
        "mcq",
        "What is the writer's main purpose?",
        [
          "to persuade schools to abolish homework",
          "to argue that homework should be well designed",
          "to describe homework in different countries",
          "to criticise parents who help with homework",
        ],
        ["B"],
        "The conclusion says good homework is short, connected to learning and returned with feedback.",
      ],
      [
        "mcq",
        "According to the writer, what is the main problem with homework for teenagers?",
        [
          "It is too easy.",
          "It is not marked.",
          "There is sometimes too much of it.",
          "It does not prepare them for work.",
        ],
        ["C"],
        '"The problem is quantity."',
      ],
      [
        "mcq",
        "What solution does the writer suggest for inequality?",
        [
          "giving every student a computer",
          "shorter school days",
          "supervised study spaces at school",
          "more help from parents",
        ],
        ["C"],
        "Schools can provide supervised study spaces after lessons.",
      ],
    ],
  },
  {
    practiceType: "reading_summary_completion",
    title: "Summary Completion: Turning Seawater into Drinking Water",
    description:
      "Complete the summary using NO MORE THAN TWO WORDS from the passage.",
    section: readingSection(
      "Turning Seawater into Drinking Water",
      DESALINATION,
      "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer."
    ),
    questions: [
      [
        "short_answer",
        "The most common desalination method is known as ________.",
        null,
        ["reverse osmosis"],
        '"The most common method is called reverse osmosis."',
      ],
      [
        "short_answer",
        "The filtering of larger particles is called ________.",
        null,
        ["pre-treatment", "pretreatment"],
        '"This stage is known as pre-treatment."',
      ],
      [
        "short_answer",
        "Salt is stopped by special ________ with tiny holes.",
        null,
        ["membranes"],
        "The membranes block the salt.",
      ],
      [
        "short_answer",
        "The very salty water left over is called ________.",
        null,
        ["brine"],
        'The rest "is known as brine".',
      ],
    ],
  },
  {
    practiceType: "reading_sentence_completion",
    title: "Sentence Completion: Turning Seawater into Drinking Water",
    description:
      "Complete the sentences using NO MORE THAN THREE WORDS AND/OR A NUMBER.",
    section: readingSection(
      "Turning Seawater into Drinking Water",
      DESALINATION,
      "Complete the sentences below. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer."
    ),
    questions: [
      [
        "short_answer",
        "Desalination provides drinking water for over ________ people.",
        null,
        ["three hundred million", "300 million", "300,000,000"],
        '"more than three hundred million people"',
      ],
      [
        "short_answer",
        "The intake pipe is placed away from the shore to avoid sand and ________.",
        null,
        ["marine life"],
        '"to avoid sand and marine life"',
      ],
      [
        "short_answer",
        "Approximately ________ per cent of the seawater becomes fresh water.",
        null,
        ["forty-five", "45", "forty five"],
        '"About forty-five per cent"',
      ],
      [
        "short_answer",
        "Most of the energy used is needed for the ________.",
        null,
        ["high-pressure pumps", "high pressure pumps", "pumps"],
        '"mostly for the high-pressure pumps"',
      ],
    ],
  },
  {
    practiceType: "reading_diagram_labelling",
    title: "Table Completion: Turning Seawater into Drinking Water",
    description: "Complete the table using ONE WORD ONLY from the passage.",
    section: readingSection(
      "Turning Seawater into Drinking Water",
      DESALINATION,
      "Complete the table below. Choose ONE WORD ONLY from the passage for each answer.\n\nStage | What happens\n1. Intake | Seawater enters through a (1) ________\n2. Pre-treatment | (2) ________ remove seaweed and sediment\n3. Reverse osmosis | Water is pushed through membranes at high (3) ________\n4. Post-treatment | Minerals such as (4) ________ are added\n5. Storage | Water is disinfected and kept in (5) ________"
    ),
    questions: [
      [
        "short_answer",
        "(1) Seawater enters through a ________",
        null,
        ["pipe"],
        '"drawn into the plant through an intake pipe"',
      ],
      [
        "short_answer",
        "(2) ________ remove seaweed and sediment",
        null,
        ["filters"],
        '"a series of filters that remove larger particles"',
      ],
      [
        "short_answer",
        "(3) Water is pushed through membranes at high ________",
        null,
        ["pressure"],
        '"pumped at very high pressure"',
      ],
      [
        "short_answer",
        "(4) Minerals such as ________ are added",
        null,
        ["calcium"],
        '"minerals such as calcium are added"',
      ],
      [
        "short_answer",
        "(5) Water is disinfected and kept in ________",
        null,
        ["tanks"],
        '"stored in tanks"',
      ],
    ],
  },
];
