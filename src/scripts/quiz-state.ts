import type { Question } from '../types';
import { canShuffleOptions } from '../lib/quiz-questions.ts';

export const DAY_MS = 86_400_000;
export interface ReviewItem {
  id: number;
  signature: string;
  dueAt: number;
  streak: number;
}
export interface TopicResult { topic: string; correct: number; total: number }
export interface BestScore { version: 2; fingerprint: string; correct: number; total: number; percentage: number }

export const bestScoreStorageKey = (quizId: string): string => `cs-vault-best-score-v2:${quizId}`;

export function bestScoreTone(percentage: number): 'red' | 'yellow' | 'green' {
  if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('Best score percentage must be an integer from 0 to 100.');
  }
  if (percentage < 60) return 'red';
  if (percentage < 80) return 'yellow';
  return 'green';
}

export function readBestScore(raw: string | null, expectedTotal: number, fingerprint: string): BestScore | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<BestScore>;
    if (candidate.version !== 2 || !fingerprint || candidate.fingerprint !== fingerprint
      || !Number.isInteger(expectedTotal) || expectedTotal < 1
      || candidate.total !== expectedTotal
      || typeof candidate.correct !== 'number' || !Number.isInteger(candidate.correct)
      || candidate.correct < 0 || candidate.correct > candidate.total
      || typeof candidate.percentage !== 'number'
      || candidate.percentage !== Math.round(candidate.correct / candidate.total * 100)) return null;
    return candidate as BestScore;
  } catch {
    return null;
  }
}

export function updateBestScore(previous: BestScore | null, correct: number, total: number, fingerprint: string): BestScore {
  if (!fingerprint || !Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || correct < 0 || correct > total) {
    throw new Error('Best quiz score must contain a valid correct and total question count.');
  }
  const next: BestScore = { version: 2, fingerprint, correct, total, percentage: Math.round(correct / total * 100) };
  return previous && previous.fingerprint === fingerprint && previous.total === total && previous.correct >= next.correct ? previous : next;
}

export type SessionKind = 'full' | 'quick' | 'topic' | 'review';
export interface QuizAttempt {
  version: 1 | 2;
  savedAt?: number;
  phase: 'active' | 'results';
  examMode: boolean;
  short: boolean;
  sessionKind?: SessionKind;
  currentIndex: number;
  deadline: number | null;
  expired: boolean;
  questions: { id: number; signature: string; options: string[] }[];
  answers: [number, string][];
}

export interface AttemptPlan {
  fingerprint: string;
  questions: { id: number; options: number[] }[];
  optionIndices: Map<number, Map<string, number>>;
}

// Compute immutable option order once per session. Stored attempts contain only
// identifiers/indices, never a repeated copy of the question and choice text.
export function createAttemptPlan(bank: Question[], prepared: Question[], fingerprint = questionBankFingerprint(bank)): AttemptPlan {
  const byId = new Map(bank.map(q => [q.id, q]));
  const optionIndices = new Map<number, Map<string, number>>();
  const seen = new Set<number>();
  const questions = prepared.map(question => {
    const original = byId.get(question.id);
    if (!original || seen.has(question.id)) throw new Error('Session questions must belong to the current bank.');
    seen.add(question.id);
    const vocabulary = canShuffleOptions(original) ? [...original.options].sort() : original.options;
    const indices = new Map(vocabulary.map((text, index) => [text, index]));
    const options = question.options.map(text => indices.get(text) ?? -1);
    if (options.length !== original.options.length || new Set(options).size !== options.length || options.includes(-1)
      || (!canShuffleOptions(original) && options.some((value, index) => value !== index))) {
      throw new Error('Session option order must preserve the original choices.');
    }
    optionIndices.set(question.id, indices);
    return { id: question.id, options };
  });
  return { fingerprint, questions, optionIndices };
}

export function compactAttempt(plan: AttemptPlan, state: {
  savedAt: number; phase: QuizAttempt['phase']; examMode: boolean; sessionKind: SessionKind;
  currentIndex: number; deadline: number | null; expired: boolean; answers: ReadonlyMap<number, string>;
}) {
  return {
    version: 2 as const, fingerprint: plan.fingerprint,
    savedAt: state.savedAt, phase: state.phase, examMode: state.examMode,
    short: state.sessionKind === 'review', sessionKind: state.sessionKind,
    currentIndex: state.currentIndex, deadline: state.deadline, expired: state.expired,
    questions: plan.questions,
    answers: [...state.answers].map(([id, text]) => {
      const index = plan.optionIndices.get(id)?.get(text);
      if (index === undefined) throw new Error('Saved answers must belong to the session.');
      return [id, index];
    }),
  };
}

// Both language routes use the same quiz ID. Reject stale content or malformed
// storage rather than restoring answers into a different question bank.
export function readAttempt(raw: string | null, bank: Question[], fingerprint?: string): QuizAttempt | null {
  if (!raw) return null;
  try {
    let value = JSON.parse(raw);
    if (!value || ![1, 2].includes(value.version)) return null;
    if (value.version === 1 && value.sessionKind !== undefined) return null;
    const byId = new Map(bank.map(q => [q.id, q]));
    if (value.version === 2) {
      if (value.fingerprint !== (fingerprint ?? questionBankFingerprint(bank))
        || !['full', 'quick', 'topic', 'review'].includes(value.sessionKind)
        || value.short !== (value.sessionKind === 'review')
        || !Array.isArray(value.questions) || !Array.isArray(value.answers)) return null;
      const questions = [];
      for (const item of value.questions) {
        const original = byId.get(item?.id);
        if (!original || !Array.isArray(item.options)
          || item.options.some((index: unknown) => !Number.isInteger(index) || (index as number) < 0 || (index as number) >= original.options.length)) return null;
        const vocabulary = canShuffleOptions(original) ? [...original.options].sort() : original.options;
        questions.push({ id: item.id, signature: questionSignature(original), options: item.options.map((index: number) => vocabulary[index]) });
      }
      const answers = [];
      for (const answer of value.answers) {
        if (!Array.isArray(answer) || answer.length !== 2) return null;
        const original = byId.get(answer[0]);
        if (!original || !Number.isInteger(answer[1]) || answer[1] < 0 || answer[1] >= original.options.length) return null;
        const vocabulary = canShuffleOptions(original) ? [...original.options].sort() : original.options;
        answers.push([answer[0], vocabulary[answer[1]]]);
      }
      value = { ...value, questions, answers };
    }
    const kind = value.version === 1 ? (value.short ? 'review' : 'full') : value.sessionKind;
    if (!['active', 'results'].includes(value.phase)
      || (value.savedAt !== undefined && (!Number.isSafeInteger(value.savedAt) || value.savedAt < 0))
      || typeof value.examMode !== 'boolean' || typeof value.short !== 'boolean'
      || typeof value.expired !== 'boolean' || (value.short && value.examMode)
      || (value.deadline !== null && (!value.examMode || !Number.isFinite(value.deadline) || value.deadline < 0))
      || !Array.isArray(value.questions) || !value.questions.length
      || value.questions.length > bank.length
      || (kind === 'review' && value.questions.length > 5)
      || (kind === 'quick' && value.questions.length > 10)
      || (kind === 'full' && value.questions.length !== bank.length)
      || !Number.isInteger(value.currentIndex) || value.currentIndex < 0 || value.currentIndex >= value.questions.length
      || !Array.isArray(value.answers)) return null;
    const ids = new Set<number>();
    for (const item of value.questions) {
      if (!item || ids.has(item.id)) return null;
      const q = byId.get(item.id);
      if (!q || item.signature !== questionSignature(q) || !Array.isArray(item.options)
        || item.options.some((option: unknown) => typeof option !== 'string')
        || (!canShuffleOptions(q) && JSON.stringify(item.options) !== JSON.stringify(q.options))
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

export interface AttemptProgress {
  total: number;
  solved: number;
  left: number;
  correct: number;
  wrong: number;
}

export function attemptProgress(attempt: QuizAttempt, bank: Question[]): AttemptProgress {
  const byId = new Map(bank.map(q => [q.id, q]));
  const total = attempt.questions.length;
  const solved = attempt.answers.length;
  const left = Math.max(0, total - solved);
  let correct = 0;
  for (const [id, selected] of attempt.answers) {
    if (byId.get(id)?.correctAnswer === selected) correct++;
  }
  return { total, solved, left, correct, wrong: solved - correct };
}

// A content edit invalidates an old saved answer, even when its ID stays the same.
export const questionSignature = (q: Question): string =>
  JSON.stringify([q.question, q.code || '', canShuffleOptions(q) ? [...q.options].sort() : q.options, q.correctAnswer, ...(!canShuffleOptions(q) ? [false] : [])]);

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

// Stable across language routes and shuffled display order. Legacy scores have no
// bank identity, so version 2 deliberately leaves them behind.
export function questionBankFingerprint(questions: Question[]): string {
  const content = JSON.stringify([...questions].sort((a, b) => a.id - b.id).map(q =>
    [q.id, questionSignature(q), q.explanation || '']));
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(content)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}
