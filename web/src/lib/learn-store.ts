"use client";

export type LearnLevel = "Beginner" | "Elementary" | "Intermediate" | "Upper intermediate" | "Advanced";

export type LearnProfile = {
  reason: string;
  topics: string[];
  uiLanguage: string;
  level: LearnLevel;
  dailyMinutes: number;
  onboardedAt: number;
};

export type LearnTaskId = "vocab" | "read" | "listen" | "chat";

export type LearnTaskState = {
  id: LearnTaskId;
  label: string;
  done: boolean;
  completedAt?: number;
  minutes: number;
};

export type VocabWord = {
  id: string;
  word: string;
  phonetic?: string;
  definition: string;
  example?: string;
  ease: number;
  interval: number;
  nextReview: number;
  known: boolean;
  addedAt: number;
};

export type LearnChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type LearnExamScore = {
  examId: string;
  score: number;
  total: number;
  completedAt: number;
};

export type LearnTutorConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  valid: boolean;
};

export type LearnSnapshot = {
  profile: LearnProfile | null;
  tasks: LearnTaskState[];
  vocabulary: VocabWord[];
  activity: Record<string, number>;
  chat: LearnChatMessage[];
  completedItems: string[];
  examScores: LearnExamScore[];
  tutor: LearnTutorConfig;
};

const KEY = "abc-learn-state";
const TASK_DEFAULTS: LearnTaskState[] = [
  { id: "vocab", label: "Vocabulary", done: false, minutes: 12 },
  { id: "read", label: "Reading", done: false, minutes: 18 },
  { id: "listen", label: "Listening", done: false, minutes: 15 },
  { id: "chat", label: "GPT chat", done: false, minutes: 10 },
];

const DEFAULT_TUTOR: LearnTutorConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  valid: false,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function emptySnapshot(): LearnSnapshot {
  return {
    profile: null,
    tasks: TASK_DEFAULTS.map((t) => ({ ...t })),
    vocabulary: [],
    activity: {},
    chat: [],
    completedItems: [],
    examScores: [],
    tutor: { ...DEFAULT_TUTOR },
  };
}

function normalize(raw: Partial<LearnSnapshot> | null): LearnSnapshot {
  const base = emptySnapshot();
  if (!raw) return base;
  return {
    profile: raw.profile ?? null,
    tasks: raw.tasks?.length ? raw.tasks : base.tasks,
    vocabulary: raw.vocabulary ?? [],
    activity: raw.activity ?? {},
    chat: raw.chat ?? [],
    completedItems: raw.completedItems ?? [],
    examScores: raw.examScores ?? [],
    tutor: { ...DEFAULT_TUTOR, ...raw.tutor },
  };
}

export function loadSnapshot(): LearnSnapshot {
  if (typeof window === "undefined") return emptySnapshot();
  try {
    return normalize(JSON.parse(localStorage.getItem(KEY) || "null") as Partial<LearnSnapshot> | null);
  } catch {
    return emptySnapshot();
  }
}

export function saveSnapshot(snapshot: LearnSnapshot) {
  localStorage.setItem(KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent("abc-learn-change"));
  return snapshot;
}

export function hasProfile(): boolean {
  return Boolean(loadSnapshot().profile?.onboardedAt);
}

export function loadProfile(): LearnProfile | null {
  return loadSnapshot().profile;
}

export function saveProfile(profile: Omit<LearnProfile, "onboardedAt"> & { onboardedAt?: number }) {
  const snap = loadSnapshot();
  snap.profile = { ...profile, onboardedAt: profile.onboardedAt ?? Date.now() };
  return saveSnapshot(snap);
}

export function getTasks(): LearnTaskState[] {
  return loadSnapshot().tasks;
}

export function completeTask(id: LearnTaskId, minutes?: number) {
  const snap = loadSnapshot();
  snap.tasks = snap.tasks.map((t) =>
    t.id === id ? { ...t, done: true, completedAt: Date.now(), minutes: minutes ?? t.minutes } : t,
  );
  const day = todayKey();
  const add = minutes ?? snap.tasks.find((t) => t.id === id)?.minutes ?? 10;
  snap.activity[day] = (snap.activity[day] ?? 0) + add;
  return saveSnapshot(snap);
}

export function resetDailyTasksIfNeeded() {
  const snap = loadSnapshot();
  const lastDone = snap.tasks.find((t) => t.completedAt)?.completedAt;
  if (!lastDone) return snap;
  const lastDay = new Date(lastDone).toISOString().slice(0, 10);
  if (lastDay === todayKey()) return snap;
  snap.tasks = TASK_DEFAULTS.map((t) => ({ ...t }));
  return saveSnapshot(snap);
}

export function listVocabulary(): VocabWord[] {
  return loadSnapshot().vocabulary;
}

export function addWord(word: Omit<VocabWord, "id" | "ease" | "interval" | "nextReview" | "known" | "addedAt"> & { id?: string }) {
  const snap = loadSnapshot();
  const id = word.id ?? word.word.toLowerCase().replace(/\s+/g, "-");
  if (snap.vocabulary.some((v) => v.id === id)) return snap;
  snap.vocabulary.unshift({
    id,
    word: word.word,
    phonetic: word.phonetic,
    definition: word.definition,
    example: word.example,
    ease: 2.5,
    interval: 0,
    nextReview: Date.now(),
    known: false,
    addedAt: Date.now(),
  });
  return saveSnapshot(snap);
}

export function removeWord(id: string) {
  const snap = loadSnapshot();
  snap.vocabulary = snap.vocabulary.filter((v) => v.id !== id);
  return saveSnapshot(snap);
}

export function reviewWord(id: string, known: boolean) {
  const snap = loadSnapshot();
  snap.vocabulary = snap.vocabulary.map((v) => {
    if (v.id !== id) return v;
    if (known) {
      const interval = v.interval === 0 ? 1 : Math.min(v.interval * v.ease, 30);
      return {
        ...v,
        known: true,
        interval,
        ease: Math.min(v.ease + 0.15, 3),
        nextReview: Date.now() + interval * 86_400_000,
      };
    }
    return { ...v, known: false, interval: 0, ease: Math.max(1.3, v.ease - 0.2), nextReview: Date.now() + 86_400_000 };
  });
  return saveSnapshot(snap);
}

export function dueVocabulary(): VocabWord[] {
  const now = Date.now();
  return loadSnapshot().vocabulary.filter((v) => v.nextReview <= now);
}

export function recordActivity(minutes: number, day = todayKey()) {
  const snap = loadSnapshot();
  snap.activity[day] = (snap.activity[day] ?? 0) + minutes;
  return saveSnapshot(snap);
}

export function getActivity(): Record<string, number> {
  return loadSnapshot().activity;
}

export function getChatMessages(): LearnChatMessage[] {
  return loadSnapshot().chat;
}

export function saveChatMessages(messages: LearnChatMessage[]) {
  const snap = loadSnapshot();
  snap.chat = messages.slice(-50);
  return saveSnapshot(snap);
}

export function markItemComplete(itemId: string) {
  const snap = loadSnapshot();
  if (!snap.completedItems.includes(itemId)) snap.completedItems.push(itemId);
  return saveSnapshot(snap);
}

export function getCompletedItems(): string[] {
  return loadSnapshot().completedItems;
}

export function saveExamScore(score: LearnExamScore) {
  const snap = loadSnapshot();
  snap.examScores = [score, ...snap.examScores.filter((s) => s.examId !== score.examId)].slice(0, 20);
  return saveSnapshot(snap);
}

export function getExamScores(): LearnExamScore[] {
  return loadSnapshot().examScores;
}

export function loadTutorConfig(): LearnTutorConfig {
  return loadSnapshot().tutor;
}

export function saveTutorConfig(tutor: LearnTutorConfig) {
  const snap = loadSnapshot();
  snap.tutor = { ...tutor, valid: Boolean(tutor.baseUrl && tutor.apiKey && tutor.model) };
  return saveSnapshot(snap);
}

export function computeStreak(): number {
  const activity = getActivity();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if ((activity[key] ?? 0) >= 5) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function tasksProgress(): number {
  const tasks = getTasks();
  const done = tasks.filter((t) => t.done).length;
  return tasks.length ? Math.round((done / tasks.length) * 100) : 0;
}

export function mergeRemoteSnapshot(remote: Partial<LearnSnapshot>) {
  const local = loadSnapshot();
  const merged = normalize({
    ...local,
    ...remote,
    profile: remote.profile ?? local.profile,
    vocabulary: remote.vocabulary?.length ? remote.vocabulary : local.vocabulary,
    activity: { ...local.activity, ...remote.activity },
  });
  return saveSnapshot(merged);
}
