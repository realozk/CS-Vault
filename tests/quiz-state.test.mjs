import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_MS, questionSignature, readReview, updateReview, shortReview, topicResults, secondsRemaining, readAttempt } from '../src/scripts/quiz-state.ts';

const question = (id, topic = 'evaluation') => ({ id, topic, question: `Question ${id}?`, options: ['Yes', 'No'], correctAnswer: 'Yes' });
const q1 = question(1), q2 = question(2, 'implementation-tools'), q3 = question(3);
const now = 1_800_000_000_000;

test('wrong and unanswered answers are scheduled; correct answers are not added', () => {
  const saved = updateReview([], [q1, q2, q3], new Map([[1, 'No'], [3, 'Yes']]), now);
  assert.deepEqual(saved.map(item => item.id), [1, 2]);
  assert.equal(saved[0].dueAt, now + DAY_MS);
});

test('spaced correct reviews advance at 1, 3, and 7 days; early practice does not advance', () => {
  let saved = updateReview([], [q1], new Map(), now);
  const correct = new Map([[1, 'Yes']]);
  assert.deepEqual(updateReview(saved, [q1], correct, now + 1000), saved);
  saved = updateReview(saved, [q1], correct, now + DAY_MS);
  assert.equal(saved[0].streak, 1);
  assert.equal(saved[0].dueAt, now + 4 * DAY_MS);
  saved = updateReview(saved, [q1], correct, now + 4 * DAY_MS);
  assert.equal(saved[0].streak, 2);
  assert.equal(saved[0].dueAt, now + 11 * DAY_MS);
  assert.deepEqual(updateReview(saved, [q1], correct, now + 11 * DAY_MS), []);
});

test('a new mistake resets the review schedule without modifying previous state', () => {
  const previous = [{ id: 1, signature: questionSignature(q1), streak: 2, dueAt: now }];
  const next = updateReview(previous, [q1], new Map([[1, 'No']]), now);
  assert.equal(next[0].streak, 0);
  assert.equal(next[0].dueAt, now + DAY_MS);
  assert.equal(previous[0].streak, 2);
});

test('corrupt, obsolete, duplicated, and invalid stored entries are handled safely', () => {
  const valid = { id: 1, signature: questionSignature(q1), dueAt: now, streak: 0 };
  assert.deepEqual(readReview('{bad json', [q1]), []);
  assert.deepEqual(readReview('{}', [q1]), []);
  const raw = JSON.stringify([valid, valid, null, { ...valid, id: 99 }, { ...valid, streak: -1 }, { ...valid, dueAt: -1 }, { id: 99, dueAt: now, streak: 0 }]);
  assert.deepEqual(readReview(raw, [q1]), [valid]);
  assert.deepEqual(readReview(JSON.stringify([valid]), [{ ...q1, correctAnswer: 'No' }]), []);
  assert.deepEqual(readReview(JSON.stringify([valid]), [{ ...q1, code: 'changed code' }]), []);
});

test('short sessions prioritize earliest due dates, stay within five, and preserve input order', () => {
  const questions = Array.from({ length: 8 }, (_, i) => question(i + 1));
  const saved = questions.map(q => ({ id: q.id, dueAt: now - q.id * DAY_MS, signature: questionSignature(q), streak: 0 }));
  const order = saved.map(item => item.id);
  assert.deepEqual(shortReview(questions, saved).map(q => q.id), [8, 7, 6, 5, 4]);
  assert.deepEqual(saved.map(item => item.id), order);
});

test('topic totals include unanswered questions and support legacy questions without topics', () => {
  const legacy = { ...q3 }; delete legacy.topic;
  assert.deepEqual(topicResults([q1, q2, legacy], new Map([[1, 'Yes'], [2, 'No']])), [
    { topic: 'evaluation', correct: 1, total: 1 },
    { topic: 'implementation-tools', correct: 0, total: 1 },
    { topic: 'general', correct: 0, total: 1 },
  ]);
});

test('timer uses a deadline, rounds partial seconds up, and expires after background delays', () => {
  assert.equal(secondsRemaining(now + 60_000, now), 60);
  assert.equal(secondsRemaining(now + 60_000, now + 59_001), 1);
  assert.equal(secondsRemaining(now + 60_000, now + 60_000), 0);
  assert.equal(secondsRemaining(now + 60_000, now + 120_000), 0);
});

const attempt = (overrides = {}) => ({
  version: 1, phase: 'active', examMode: true, short: false,
  currentIndex: 1, deadline: now + 60_000, expired: false,
  questions: [q2, q1].map(q => ({ id: q.id, signature: questionSignature(q), options: ['No', 'Yes'] })),
  answers: [[2, 'No']],
  ...overrides,
});

test('an attempt preserves shuffled questions, option letters, answers, position, and the original deadline', () => {
  const value = attempt();
  assert.deepEqual(readAttempt(JSON.stringify(value), [q1, q2]), value);
  // An expired deadline must survive restoration so the UI submits immediately.
  const expired = attempt({ deadline: now - 1 });
  assert.equal(readAttempt(JSON.stringify(expired), [q1, q2]).deadline, now - 1);
});

test('attempts reject changed content, obsolete questions, and a different-sized question bank', () => {
  const raw = JSON.stringify(attempt());
  assert.equal(readAttempt(raw, [{ ...q1, question: 'Edited question' }, q2]), null);
  assert.equal(readAttempt(raw, [{ ...q1, correctAnswer: 'No' }, q2]), null);
  assert.equal(readAttempt(raw, [q1, q3]), null);
  assert.equal(readAttempt(raw, [q1, q2, q3]), null);
});

test('corrupt attempt data cannot restore invalid answers, order, index, or timer settings', () => {
  assert.equal(readAttempt('{bad', [q1, q2]), null);
  for (const overrides of [
    { currentIndex: -1 }, { currentIndex: 2 }, { currentIndex: 0.5 },
    { version: 2 }, { phase: 'unknown' }, { deadline: '60000' }, { deadline: -1 },
    { deadline: now, examMode: false }, { examMode: true, short: true },
    { questions: [attempt().questions[0], attempt().questions[0]] },
    { questions: [{ ...attempt().questions[0], options: ['Yes', 'Yes'] }, attempt().questions[1]] },
    { answers: [[99, 'Yes']] }, { answers: [[1, 'Maybe']] }, { answers: [[1, 'Yes'], [1, 'No']] },
  ]) assert.equal(readAttempt(JSON.stringify(attempt(overrides)), [q1, q2]), null);
});

test('practice and completed attempts restore; short review retains its subset and size limit', () => {
  const practice = attempt({ examMode: false, deadline: null });
  assert.deepEqual(readAttempt(JSON.stringify(practice), [q1, q2]), practice);
  const results = attempt({ phase: 'results', expired: true });
  assert.deepEqual(readAttempt(JSON.stringify(results), [q1, q2]), results);
  const short = attempt({ short: true, examMode: false, deadline: null, currentIndex: 0, questions: [attempt().questions[0]] });
  assert.deepEqual(readAttempt(JSON.stringify(short), [q1, q2, q3]), short);
  const bank = Array.from({ length: 6 }, (_, i) => question(i + 1));
  assert.equal(readAttempt(JSON.stringify({ ...short, questions: bank.map(q => ({ id: q.id, signature: questionSignature(q), options: q.options })) }), bank), null);
});
