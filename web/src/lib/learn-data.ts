export type Topic = { id: string; label: string; size?: "sm" | "md" | "lg" };

export const ONBOARDING_REASONS = [
  "Self-study",
  "Travel",
  "Work",
  "Exam prep",
  "Conversation",
  "Culture",
];

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
  { id: "vocab", label: "Vocabulary", done: true, minutes: 12 },
  { id: "read", label: "Reading", done: false, minutes: 18 },
  { id: "listen", label: "Listening", done: false, minutes: 15 },
  { id: "chat", label: "GPT chat", done: true, minutes: 10 },
];

export const COLLECTIONS = [
  { id: "social", title: "Social issues", progress: 78, items: 24 },
  { id: "museum", title: "Museum", progress: 45, items: 18 },
  { id: "daily", title: "Daily life", progress: 92, items: 31 },
  { id: "food", title: "Food", progress: 34, items: 12 },
];

export const LIBRARY_ITEMS = {
  books: [
    { id: "modernism", title: "Modernism in architecture", tag: "Intermediate", minutes: 14 },
    { id: "ocean", title: "The blue economy", tag: "Upper intermediate", minutes: 22 },
    { id: "habits", title: "Atomic habits (adapted)", tag: "Intermediate", minutes: 18 },
  ],
  podcasts: [
    { id: "daily-news", title: "Daily news digest", tag: "Advanced", minutes: 12 },
    { id: "startup", title: "Startup stories", tag: "Intermediate", minutes: 20 },
  ],
  video: [
    { id: "grammar", title: "Present perfect in context", tag: "Beginner", minutes: 8 },
  ],
};

export const EXAMS = [
  { id: "vocab-1", title: "Vocabulary test", level: "Intermediate", questions: 30 },
  { id: "ielts-1", title: "IELTS reading mock", level: "Upper intermediate", questions: 40 },
  { id: "ielts-2", title: "IELTS listening mock", level: "Advanced", questions: 40 },
];

export const CHAT_SEED = [
  { id: "1", role: "assistant" as const, text: "Hi! What topic should we practice today?" },
  { id: "2", role: "user" as const, text: "Let's talk about travel and airports." },
  { id: "3", role: "assistant" as const, text: "Great. Imagine you just landed in London. How would you ask for directions to the hotel?" },
];

export const ARTICLE = {
  id: "modernism",
  title: "Modernism in architecture",
  about: "A short overview of form, function, and the shift away from ornament in twentieth-century buildings.",
  tags: ["Architecture", "History", "Intermediate"],
  body: `Modernism rejected decorative excess in favor of clarity and purpose. Architects like Le Corbusier argued that a house should be a machine for living — efficient, honest, and shaped by human needs.

Glass, steel, and concrete became the vocabulary of the movement. Buildings opened toward light; floor plans simplified; ornament gave way to proportion.

Today, modernist ideas still influence how we think about sustainable design, urban density, and the relationship between public space and private life.`,
};

export const PODCAST = {
  id: "daily-news",
  title: "Daily news digest",
  episodes: [
    { id: "1", title: "Markets and climate policy", duration: "12:04" },
    { id: "2", title: "City transport reforms", duration: "09:41" },
    { id: "3", title: "Language learning trends", duration: "11:18" },
  ],
};

export const TRAINING_WORD = {
  word: "Sustainable",
  phonetic: "/səˈsteɪnəbl/",
  definition: "Able to be maintained at a certain rate or level.",
  example: "The city invested in sustainable transport.",
};

export const STATS = {
  streak: 12,
  monthProgress: 78,
  reading: 84,
  writing: 52,
  listening: 67,
  minutesThisWeek: 186,
};
