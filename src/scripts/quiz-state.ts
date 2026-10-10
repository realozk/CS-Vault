import type { Question } from '../types';

export const DAY_MS = 86_400_000;
export interface ReviewItem {
  id: number;
  signature: string;
  dueAt: number;
  streak: number;
}
export interface TopicResult { topic: string; correct: number; total: number }

export interface QuizAttempt {
  version: 1;
  phase: 'active' | 'results';
  examMode: boolean;
  short: boolean;
  currentIndex: number;
  deadline: number | null;
  expired: boolean;
  questions: { id: number; signature: string; options: string[] }[];
  answers: [number, string][];
}

// Both language routes use the same quiz ID. Reject stale content or malformed
// storage rather than restoring answers into a different question bank.
export function readAttempt(raw: string | null, bank: Question[]): QuizAttempt | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !['active', 'results'].includes(value.phase)
      || typeof value.examMode !== 'boolean' || typeof value.short !== 'boolean'
      || typeof value.expired !== 'boolean' || (value.short && value.examMode)
      || (value.deadline !== null && (!value.examMode || !Number.isFinite(value.deadline) || value.deadline < 0))
      || !Array.isArray(value.questions) || !value.questions.length
      || (value.short ? value.questions.length > 5 : value.questions.length !== bank.length)
      || !Number.isInteger(value.currentIndex) || value.currentIndex < 0 || value.currentIndex >= value.questions.length
      || !Array.isArray(value.answers)) return null;
    const byId = new Map(bank.map(q => [q.id, q]));
    const ids = new Set<number>();
    for (const item of value.questions) {
      if (!item || ids.has(item.id)) return null;
      const q = byId.get(item.id);
      if (!q || item.signature !== questionSignature(q) || !Array.isArray(item.options)
        || item.options.some((option: unknown) => typeof option !== 'string')
        || JSON.stringify([...item.options].sort()) !== JSON.stringify([...q.options].sort())) return null;
      ids.add(item.id);
    }
    const answerIds = new Set<number>();
    for (const answer of value.answers) {
      if (!Array.isArray(answer) || answer.length !== 2 || !ids.has(answer[0]) || answerIds.has(answer[0])
        || !byId.get(answer[0])!.options.includes(answer[1])) return null;
      answerIds.add(answer[0]);
    }
    return value as QuizAttempt;
  } catch { return null; }
}

// A content edit invalidates an old saved answer, even when its ID stays the same.
export const questionSignature = (q: Question): string =>
  JSON.stringify([q.question, q.code || '', [...q.options].sort(), q.correctAnswer]);

export function readReview(raw: string | null, questions: Question[]): ReviewItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const valid = new Map(questions.map(q => [q.id, questionSignature(q)]));
    const items = new Map<number, ReviewItem>();
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue;
      if (!valid.has(entry.id) || valid.get(entry.id) !== entry.signature || !Number.isFinite(entry.dueAt)
        || entry.dueAt < 0 || !Number.isInteger(entry.streak) || entry.streak < 0 || entry.streak > 2) continue;
      items.set(entry.id, { id: entry.id, signature: entry.signature, dueAt: entry.dueAt, streak: entry.streak });
    }
    return [...items.values()];
  } catch { return []; }
}

export function updateReview(
  previous: ReviewItem[], questions: Question[], answers: ReadonlyMap<number, string>, now: number,
): ReviewItem[] {
  const items = new Map(previous.map(item => [item.id, { ...item }]));
  for (const q of questions) {
    if (answers.get(q.id) !== q.correctAnswer) {
      items.set(q.id, { id: q.id, signature: questionSignature(q), streak: 0, dueAt: now + DAY_MS });
    } else {
      const saved = items.get(q.id);
      // Early practice is welcome, but does not count as a spaced review.
      if (!saved || saved.dueAt > now) continue;
      const streak = saved.streak + 1;
      if (streak >= 3) items.delete(q.id);
      else items.set(q.id, { ...saved, streak, dueAt: now + (streak === 1 ? 3 : 7) * DAY_MS });
    }
  }
  return [...items.values()].sort((a, b) => a.dueAt - b.dueAt || a.id - b.id);
}

export function shortReview(questions: Question[], items: ReviewItem[], limit = 5): Question[] {
  const byId = new Map(questions.map(q => [q.id, q]));
  return [...items].sort((a, b) => a.dueAt - b.dueAt || a.id - b.id)
    .flatMap(item => byId.has(item.id) ? [byId.get(item.id)!] : []).slice(0, limit);
}

export function topicResults(questions: Question[], answers: ReadonlyMap<number, string>): TopicResult[] {
  const topics = new Map<string, TopicResult>();
  for (const q of questions) {
    const topic = q.topic || 'general';
    const result = topics.get(topic) || { topic, correct: 0, total: 0 };
    result.total++;
    if (answers.get(q.id) === q.correctAnswer) result.correct++;
    topics.set(topic, result);
  }
  return [...topics.values()];
}

export function secondsRemaining(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
