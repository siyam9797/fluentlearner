/**
 * Passages for Student → Typing practice. IELTS-style academic English on common exam topics.
 * Plain ASCII punctuation only, so every character can be typed on a standard keyboard.
 */
export type TypingPassage = { title: string; topic: string; text: string };

export const TYPING_PASSAGES: TypingPassage[] = [
  // Study skills & education
  {
    title: "Short study sessions",
    topic: "Education",
    text: "Many students assume that progress depends on studying for long periods without a break. In reality, shorter sessions can be more effective when they are focused and repeated regularly. A clear goal helps the learner decide what to practise, while a brief review at the end of each session makes improvement easier to measure. Consistency is often more valuable than intensity.",
  },
  {
    title: "Learning a language",
    topic: "Education",
    text: "Learning a language involves more than memorising individual words. Skilled speakers recognise common phrases, notice how ideas are connected and adjust their language for different situations. Regular exposure is essential, but learners also need opportunities to produce the language, receive useful feedback and try again without fear of making mistakes.",
  },
  {
    title: "Online learning",
    topic: "Education",
    text: "Online courses allow people to study at a time and place that suits them, which is particularly helpful for those who work or care for family members. However, independent study requires strong organisation. Learners who set a weekly timetable, take notes by hand and join live discussions are more likely to finish their course than those who simply watch recorded lessons.",
  },
  {
    title: "Homework debate",
    topic: "Education",
    text: "The value of homework has been debated for many years. Some teachers believe that regular tasks help pupils develop discipline and revise what they have learned in class. Others argue that too much homework reduces time for rest, hobbies and family life. Most researchers agree that short, well designed tasks are more useful than long assignments.",
  },
  {
    title: "University choices",
    topic: "Education",
    text: "Choosing a university course is one of the most important decisions a young person makes. While salary prospects are an obvious consideration, students who select a subject they genuinely enjoy tend to achieve better results. Visiting campuses, speaking to current students and reading the course structure carefully can prevent expensive changes of direction later on.",
  },
  {
    title: "Libraries today",
    topic: "Education",
    text: "Public libraries have changed considerably over the last two decades. Although books remain central to their purpose, many libraries now provide digital resources, quiet workspaces, community events and practical training. These services are especially valuable for people who do not have reliable internet access or a suitable place to study at home.",
  },

  // Environment
  {
    title: "Plastic in the ocean",
    topic: "Environment",
    text: "Millions of tonnes of plastic enter the oceans every year, much of it carried by rivers from towns and cities. Large items can trap turtles and seabirds, while tiny fragments are swallowed by fish and eventually reach the human food chain. Reducing single use packaging and improving waste collection in coastal areas are two of the most effective responses.",
  },
  {
    title: "Urban trees",
    topic: "Environment",
    text: "Trees provide cities with far more than decoration. They cool streets during hot weather, absorb rainwater that might otherwise cause flooding and improve air quality by trapping dust. Studies have also shown that residents who live near green spaces report lower levels of stress. For these reasons, many councils now protect mature trees and plant thousands more each year.",
  },
  {
    title: "Water scarcity",
    topic: "Environment",
    text: "Although water covers most of the planet, only a small proportion is fresh and easily accessible. Growing populations, intensive farming and changing rainfall patterns are placing heavy pressure on this supply. Solutions include repairing leaking pipes, collecting rainwater from rooftops and encouraging farmers to adopt irrigation methods that deliver water directly to the roots of crops.",
  },
  {
    title: "Recycling habits",
    topic: "Environment",
    text: "Recycling only works when households sort their waste correctly. A single greasy pizza box or unwashed bottle can contaminate an entire load, which then has to be sent to landfill. Clear labels on packaging and simple instructions from local councils make a noticeable difference, as do collection services that are regular and easy to use.",
  },
  {
    title: "Protecting bees",
    topic: "Environment",
    text: "Bees play a vital role in food production because they pollinate many of the fruits and vegetables that people eat. In recent years, their numbers have fallen in several regions due to pesticides, disease and the loss of wild flowers. Farmers, gardeners and city planners can all help by leaving space for native plants and reducing chemical sprays.",
  },
  {
    title: "Renewable energy",
    topic: "Environment",
    text: "The cost of solar panels and wind turbines has fallen dramatically over the past decade, making renewable electricity cheaper than coal in many countries. The main challenge is that sunshine and wind are not constant. As a result, governments are investing in batteries, smarter power grids and connections between neighbouring countries so that supply can meet demand at all times.",
  },

  // Technology
  {
    title: "Smartphones and attention",
    topic: "Technology",
    text: "Smartphones have made it possible to answer messages, check the news and find directions within seconds. Yet constant notifications can make it difficult to concentrate on a single task for long. Some people now switch off alerts during work or study hours, while others keep their phones in another room. Small changes like these can greatly improve focus.",
  },
  {
    title: "Artificial intelligence at work",
    topic: "Technology",
    text: "Artificial intelligence is increasingly used to sort emails, translate documents and answer simple customer questions. Supporters say that these tools free employees to concentrate on creative and complex work. Critics worry that some jobs will disappear and that decisions made by computers may be difficult to explain. Most experts agree that training workers in new skills is essential.",
  },
  {
    title: "Online shopping",
    topic: "Technology",
    text: "Online shopping has grown rapidly because it is convenient and often cheaper than visiting a store. Customers can compare prices, read reviews and have goods delivered to their door. However, the rise of home delivery has increased traffic in residential streets and produced large amounts of packaging. Some companies now offer collection points to reduce these problems.",
  },
  {
    title: "Protecting personal data",
    topic: "Technology",
    text: "Every time people use an app or a website, they leave behind information about their habits and interests. Companies use this data to recommend products and improve their services, but it can also be misused if it is stolen. Strong passwords, two step verification and careful attention to privacy settings are simple ways to stay safer online.",
  },

  // Health
  {
    title: "The importance of sleep",
    topic: "Health",
    text: "Sleep is sometimes treated as a luxury, but it is essential for both physical and mental health. During sleep, the body repairs tissue and the brain organises the information learned during the day. Adults who regularly sleep for less than seven hours are more likely to have difficulty concentrating and are at greater risk of several serious illnesses.",
  },
  {
    title: "Walking every day",
    topic: "Health",
    text: "Walking is one of the simplest forms of exercise, yet its benefits are considerable. A brisk thirty minute walk each day can strengthen the heart, help control weight and improve mood. Unlike many sports, it requires no special equipment or membership fees. Choosing to walk for short journeys also reduces traffic and pollution in local neighbourhoods.",
  },
  {
    title: "Healthy eating",
    topic: "Health",
    text: "Nutrition experts generally recommend a diet based on vegetables, fruit, whole grains and a moderate amount of protein. Processed foods are often high in salt, sugar and fat, which can contribute to heart disease when eaten regularly. Cooking at home, even simple meals, gives people greater control over what they eat and is usually cheaper as well.",
  },
  {
    title: "An ageing population",
    topic: "Health",
    text: "In many countries, people are living longer than ever before, and the proportion of older citizens is rising. This trend reflects improvements in medicine and living conditions, but it also creates challenges. Health services must care for more patients with long term conditions, and fewer working adults are available to support pension systems through their taxes.",
  },

  // Work & society
  {
    title: "Working from home",
    topic: "Work",
    text: "Remote work became common for millions of employees in a very short period of time. Many workers appreciate saving time and money on commuting, and some companies have reduced the cost of office space. On the other hand, it can be harder to build relationships with colleagues and to separate professional duties from home life. Hybrid arrangements attempt to balance both.",
  },
  {
    title: "Volunteering",
    topic: "Work",
    text: "Volunteering benefits communities and volunteers alike. Charities depend on unpaid helpers to run food banks, support elderly residents and organise local events. In return, volunteers gain practical experience, meet new people and often feel a stronger sense of purpose. Employers also tend to value applicants who have given their time to help others.",
  },
  {
    title: "Job interviews",
    topic: "Work",
    text: "A successful job interview usually depends on careful preparation. Candidates should research the organisation, read the job description closely and think of specific examples that show their skills. It is also sensible to prepare one or two thoughtful questions for the interviewer. Arriving early and dressing appropriately help to create a positive first impression.",
  },
  {
    title: "Tourism and local life",
    topic: "Work",
    text: "Tourism creates jobs and brings income to many regions, from coastal villages to historic cities. However, large numbers of visitors can raise the cost of housing and put pressure on local services. Some destinations now limit the number of cruise ships, introduce visitor taxes or promote quieter seasons in order to protect the quality of life of residents.",
  },

  // Cities & transport
  {
    title: "Safer streets",
    topic: "Cities",
    text: "Cities around the world are investing in safer routes for walking and cycling. Supporters argue that active travel can reduce congestion, improve air quality and support public health. However, successful schemes require more than painted lanes. They also need secure parking, clear junctions and convenient connections with buses and trains.",
  },
  {
    title: "Public transport",
    topic: "Cities",
    text: "Reliable public transport is essential for a modern city. When buses and trains are frequent, affordable and clean, more people choose to leave their cars at home. This reduces traffic and pollution while making it easier for everyone, including students and older residents, to reach work, education and health services. Investment, however, must be long term.",
  },
  {
    title: "Housing costs",
    topic: "Cities",
    text: "In many large cities, the cost of renting or buying a home has risen much faster than wages. Young people in particular may spend a large share of their income on rent or continue living with their parents for longer. Possible solutions include building more affordable homes, converting empty offices into flats and improving transport links to cheaper areas.",
  },

  // Science & culture
  {
    title: "Exploring space",
    topic: "Science",
    text: "Space exploration has produced benefits that reach far beyond astronomy. Technology developed for satellites and spacecraft has improved weather forecasting, global communication and medical imaging. Critics argue that the money could be spent on problems on Earth, while supporters believe that exploring other planets inspires young people to study science and engineering.",
  },
  {
    title: "Endangered languages",
    topic: "Culture",
    text: "Experts estimate that around half of the world's languages may disappear by the end of this century. When the last speakers of a language die, knowledge about local history, plants and traditions can be lost with them. Recording elderly speakers, teaching children in their home language and creating digital dictionaries are among the efforts to prevent this loss.",
  },
  {
    title: "Museums for everyone",
    topic: "Culture",
    text: "Museums preserve objects that tell the story of human history and the natural world. In the past, many were seen as quiet places for experts. Today, museums use interactive displays, evening events and online collections to attract a wider audience. Free entry policies have also increased the number of families and young visitors in several countries.",
  },
  {
    title: "The history of coffee",
    topic: "Culture",
    text: "Coffee is believed to have been discovered in Ethiopia and was later cultivated in Yemen, where it became popular among people who needed to stay awake for evening prayers. By the seventeenth century, coffee houses had spread across Europe and became important meeting places for merchants, writers and scientists who exchanged news and ideas there.",
  },
  {
    title: "Team sports",
    topic: "Culture",
    text: "Taking part in team sports teaches young people more than physical skills. Players learn to communicate, to accept decisions they disagree with and to support teammates after a mistake. Coaches often notice that these habits carry over into the classroom and the workplace. For this reason, many schools consider sport an essential part of education.",
  },
  {
    title: "Architecture and climate",
    topic: "Science",
    text: "Traditional buildings in hot countries often used thick walls, small windows and shaded courtyards to stay cool without electricity. Modern architects are rediscovering these ideas. By combining natural ventilation, reflective roofs and good insulation, new buildings can remain comfortable while using far less energy for air conditioning and heating.",
  },
  {
    title: "Why we forget",
    topic: "Science",
    text: "Psychologists have shown that people forget most new information within a few days unless they review it. The rate of forgetting slows each time the material is recalled, which is why spaced repetition is such an effective study technique. Testing yourself with flashcards or practice questions is generally more useful than simply reading your notes again.",
  },
];

/** Topics in the order they first appear, for grouping the passage picker. */
export const TYPING_TOPICS = Array.from(
  new Set(TYPING_PASSAGES.map(passage => passage.topic))
);
