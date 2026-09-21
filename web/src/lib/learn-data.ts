export type Topic = { id: string; label: string; size?: "sm" | "md" | "lg" };

export type Article = {
  id: string;
  title: string;
  about: string;
  tags: string[];
  body: string;
  highlights?: string[];
  topicIds: string[];
  minutes: number;
};

export type Podcast = {
  id: string;
  title: string;
  tag: string;
  topicIds: string[];
  audioUrl: string;
  episodes: { id: string; title: string; duration: string }[];
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
};

export type Exam = {
  id: string;
  title: string;
  level: string;
  questions: ExamQuestion[];
};

export const ONBOARDING_REASONS = [
  "Self-study",
  "Travel",
  "Work",
  "Exam prep",
  "Conversation",
  "Culture",
];

export const LEVELS = ["Beginner", "Elementary", "Intermediate", "Upper intermediate", "Advanced"] as const;

export const DAILY_GOALS = [5, 10, 15, 30];

export const TOPICS: Topic[] = [
  { id: "art", label: "Art", size: "lg" },
  { id: "history", label: "History", size: "md" },
  { id: "science", label: "Science", size: "md" },
  { id: "travel", label: "Travel", size: "sm" },
  { id: "food", label: "Food", size: "sm" },
  { id: "music", label: "Music", size: "md" },
  { id: "sport", label: "Sport", size: "sm" },
  { id: "tech", label: "Technology", size: "lg" },
  { id: "nature", label: "Nature", size: "sm" },
  { id: "business", label: "Business", size: "md" },
  { id: "movies", label: "Movies", size: "sm" },
  { id: "health", label: "Health", size: "sm" },
];

export const LANGUAGES = ["English", "Slovak", "German", "Spanish", "French", "Ukrainian"];

export const DAILY_TASKS = [
  { id: "vocab", label: "Vocabulary", done: false, minutes: 12 },
  { id: "read", label: "Reading", done: false, minutes: 18 },
  { id: "listen", label: "Listening", done: false, minutes: 15 },
  { id: "chat", label: "GPT chat", done: false, minutes: 10 },
];

export const COLLECTIONS = [
  { id: "social", title: "Social issues", items: 24, topicIds: ["business", "health"] },
  { id: "museum", title: "Museum", items: 18, topicIds: ["art", "history"] },
  { id: "daily", title: "Daily life", items: 31, topicIds: ["food", "travel"] },
  { id: "food", title: "Food", items: 12, topicIds: ["food"] },
];

export const LIBRARY_ITEMS = {
  books: [
    { id: "modernism", title: "Modernism in architecture", tag: "Intermediate", minutes: 14, topicIds: ["art", "history"] },
    { id: "ocean", title: "The blue economy", tag: "Upper intermediate", minutes: 22, topicIds: ["science", "nature", "business"] },
    { id: "habits", title: "Atomic habits (adapted)", tag: "Intermediate", minutes: 18, topicIds: ["health", "business"] },
  ],
  podcasts: [
    { id: "daily-news", title: "Daily news digest", tag: "Advanced", minutes: 12, topicIds: ["business", "tech"] },
    { id: "startup", title: "Startup stories", tag: "Intermediate", minutes: 20, topicIds: ["tech", "business"] },
  ],
  video: [
    { id: "grammar", title: "Present perfect in context", tag: "Beginner", minutes: 8, topicIds: ["movies"] },
  ],
};

export const ARTICLES: Article[] = [
  {
    id: "modernism",
    title: "Modernism in architecture",
    about: "A short overview of form, function, and the shift away from ornament in twentieth-century buildings.",
    tags: ["Architecture", "History", "Intermediate"],
    topicIds: ["art", "history"],
    minutes: 14,
    highlights: ["sustainable", "proportion", "efficient"],
    body: `Modernism rejected decorative excess in favor of clarity and purpose. Architects like Le Corbusier argued that a house should be a machine for living — efficient, honest, and shaped by human needs.

Glass, steel, and concrete became the vocabulary of the movement. Buildings opened toward light; floor plans simplified; ornament gave way to proportion.

Today, modernist ideas still influence how we think about sustainable design, urban density, and the relationship between public space and private life.`,
  },
  {
    id: "ocean",
    title: "The blue economy",
    about: "How coastal nations balance marine conservation with sustainable industry.",
    tags: ["Science", "Business", "Upper intermediate"],
    topicIds: ["science", "nature", "business"],
    minutes: 22,
    highlights: ["sustainable", "conservation", "industry"],
    body: `The blue economy describes activities that use ocean resources while preserving ecosystem health. Fisheries, shipping, and offshore energy all compete for space in coastal waters.

Governments increasingly require environmental impact assessments before approving new projects. Sustainable tourism and marine biotechnology offer alternatives to extractive industries.

Students of English benefit from vocabulary around policy, trade, and ecology when reading international news about climate agreements.`,
  },
  {
    id: "habits",
    title: "Atomic habits (adapted)",
    about: "Small daily routines compound into lasting language progress.",
    tags: ["Self-improvement", "Intermediate"],
    topicIds: ["health", "business"],
    minutes: 18,
    highlights: ["routine", "compound", "progress"],
    body: `Language learning rewards consistency more than intensity. Ten focused minutes each day beats a single three-hour session once a month.

Track your streak, review vocabulary before it expires, and tie new words to stories you actually want to read. Progress compounds when practice becomes automatic.

Replace vague goals with specific cues: after breakfast, open one article; before bed, review five flashcards.`,
  },
];

export const PODCASTS: Podcast[] = [
  {
    id: "daily-news",
    title: "Daily news digest",
    tag: "Advanced",
    topicIds: ["business", "tech"],
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    episodes: [
      { id: "1", title: "Markets and climate policy", duration: "12:04" },
      { id: "2", title: "City transport reforms", duration: "09:41" },
      { id: "3", title: "Language learning trends", duration: "11:18" },
    ],
  },
  {
    id: "startup",
    title: "Startup stories",
    tag: "Intermediate",
    topicIds: ["tech", "business"],
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    episodes: [
      { id: "1", title: "From idea to MVP", duration: "14:22" },
      { id: "2", title: "Fundraising basics", duration: "11:05" },
    ],
  },
];

export const EXAM_QUESTIONS: Record<string, ExamQuestion[]> = {
  "vocab-1": [
    { id: "q1", prompt: "Choose the best synonym for 'sustainable'.", options: ["Temporary", "Maintainable", "Expensive", "Random"], answer: 1 },
    { id: "q2", prompt: "'Proportion' most nearly means…", options: ["Ratio", "Noise", "Delay", "Permission"], answer: 0 },
    { id: "q3", prompt: "Pick the correct phrase:", options: ["Make a progress", "Do progress", "Make progress", "Make progresses"], answer: 2 },
    { id: "q4", prompt: "'Conservation' relates to…", options: ["Waste", "Protection", "Speed", "Profit"], answer: 1 },
    { id: "q5", prompt: "Best collocation: ___ an impact", options: ["do", "make", "take", "give"], answer: 1 },
    { id: "q6", prompt: "'Efficient' means…", options: ["Wasteful", "Productive", "Silent", "Ancient"], answer: 1 },
    { id: "q7", prompt: "Choose the formal alternative to 'get'.", options: ["Obtain", "Grab", "Snatch", "Catch"], answer: 0 },
    { id: "q8", prompt: "'Routine' is closest to…", options: ["Chaos", "Habit", "Accident", "Mystery"], answer: 1 },
    { id: "q9", prompt: "Correct article: ___ honest answer", options: ["a", "an", "the", "—"], answer: 1 },
    { id: "q10", prompt: "'Compound' as a verb means…", options: ["Separate", "Accumulate", "Delete", "Ignore"], answer: 1 },
  ],
  "ielts-1": [
    { id: "q1", prompt: "Skimming helps you find…", options: ["Every detail", "Main ideas", "Grammar rules", "Pronunciation"], answer: 1 },
    { id: "q2", prompt: "True/False/Not Given tests…", options: ["Opinion only", "Stated facts", "Future events", "Word count"], answer: 1 },
    { id: "q3", prompt: "Matching headings requires…", options: ["Memorization", "Paragraph gist", "Spelling", "Listening"], answer: 1 },
    { id: "q4", prompt: "Time management tip:", options: ["Spend 40 min on one question", "Move on if stuck", "Skip all part 3", "Never guess"], answer: 1 },
    { id: "q5", prompt: "Synonym questions test…", options: ["Paraphrase recognition", "Handwriting", "Accent", "Idiom only"], answer: 0 },
    { id: "q6", prompt: "Best note-taking style:", options: ["Full sentences", "Keywords", "Drawings only", "No notes"], answer: 1 },
    { id: "q7", prompt: "'Infer' means…", options: ["Copy text", "Deduce", "Translate", "Summarize aloud"], answer: 1 },
    { id: "q8", prompt: "Order of answers in the passage…", options: ["Always random", "Usually sequential", "Never appears", "Only in part 1"], answer: 1 },
    { id: "q9", prompt: "When unsure,…", options: ["Leave blank always", "Guess if no penalty", "Stop the test", "Change section"], answer: 1 },
    { id: "q10", prompt: "Review means…", options: ["Reread quickly", "Rewrite passage", "Memorize title", "Skip answers"], answer: 0 },
  ],
  "ielts-2": [
    { id: "q1", prompt: "Preview questions before audio to…", options: ["Predict content", "Ignore speakers", "Skip section", "Change volume"], answer: 0 },
    { id: "q2", prompt: "Spelling counts in…", options: ["Multiple choice only", "Gap fill", "Matching only", "Never"], answer: 1 },
    { id: "q3", prompt: "Accents vary; train with…", options: ["One voice only", "Diverse speakers", "Silent mode", "Subtitles off always"], answer: 1 },
    { id: "q4", prompt: "Maps and diagrams need…", options: ["Direction vocabulary", "Poetry", "Slang only", "No labels"], answer: 0 },
    { id: "q5", prompt: "Distractors are…", options: ["Always wrong words", "Similar-sounding traps", "Extra time", "Bonus points"], answer: 1 },
    { id: "q6", prompt: "Note-taking during listening:", options: ["Write everything", "Key names/numbers", "Stop listening", "Use long sentences"], answer: 1 },
    { id: "q7", prompt: "Section 4 is often…", options: ["Casual chat", "Academic lecture", "Song lyrics", "Silent"], answer: 1 },
    { id: "q8", prompt: "Check word limit for answers…", options: ["After submitting", "While writing", "Never", "Only part 1"], answer: 1 },
    { id: "q9", prompt: "Plural forms…", options: ["Never tested", "Must match audio", "Ignore grammar", "Optional"], answer: 1 },
    { id: "q10", prompt: "Transfer time is for…", options: ["Break only", "Checking answers", "Leaving early", "New audio"], answer: 1 },
  ],
};

export const EXAMS: Exam[] = [
  { id: "vocab-1", title: "Vocabulary test", level: "Intermediate", questions: EXAM_QUESTIONS["vocab-1"] },
  { id: "ielts-1", title: "IELTS reading mock", level: "Upper intermediate", questions: EXAM_QUESTIONS["ielts-1"] },
  { id: "ielts-2", title: "IELTS listening mock", level: "Advanced", questions: EXAM_QUESTIONS["ielts-2"] },
];

export const CHAT_SEED = [
  { id: "1", role: "assistant" as const, text: "Hi! What topic should we practice today?" },
];

export const ARTICLE = ARTICLES[0];

export const PODCAST = PODCASTS[0];

export const TRAINING_WORD = {
  word: "Sustainable",
  phonetic: "/səˈsteɪnəbl/",
  definition: "Able to be maintained at a certain rate or level.",
  example: "The city invested in sustainable transport.",
};

export const STATS = {
  streak: 0,
  monthProgress: 0,
  reading: 0,
  writing: 0,
  listening: 0,
  minutesThisWeek: 0,
};

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

export function getPodcast(id: string): Podcast | undefined {
  return PODCASTS.find((p) => p.id === id);
}

export function getExam(id: string): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function recommendByTopics(topicIds: string[]) {
  const set = new Set(topicIds);
  const score = (ids: string[]) => ids.filter((id) => set.has(id)).length;
  const books = [...LIBRARY_ITEMS.books].sort((a, b) => score(b.topicIds) - score(a.topicIds));
  const podcasts = [...LIBRARY_ITEMS.podcasts].sort((a, b) => score(b.topicIds) - score(a.topicIds));
  const video = [...LIBRARY_ITEMS.video].sort((a, b) => score(b.topicIds) - score(a.topicIds));
  return { books, podcasts, video };
}

export function taskHref(taskId: string): string {
  switch (taskId) {
    case "vocab":
      return "/learn/training/word";
    case "read":
      return "/learn/read/modernism";
    case "listen":
      return "/learn/listen/daily-news";
    case "chat":
      return "/learn/chat";
    default:
      return "/learn/plan";
  }
}

export function topicLabels(ids: string[]) {
  return ids.map((id) => TOPICS.find((t) => t.id === id)?.label ?? id).filter(Boolean);
}
