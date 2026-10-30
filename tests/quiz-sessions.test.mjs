import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPracticeQuestions } from '../src/lib/quiz-questions.ts';
import { createAttemptPlan, compactAttempt, readAttempt, questionSignature } from '../src/scripts/quiz-state.ts';

const question = (id, topic = 'scheduling') => ({ id, topic, question: `Question ${id}: choose an answer.`, options: ['Yes', 'No'], correctAnswer: 'Yes' });
const state = (overrides = {}) => ({ savedAt: 1800000000000, phase: 'active', examMode: false, sessionKind: 'full', currentIndex: 0, deadline: null, expired: false, answers: new Map(), ...overrides });

test('quick practice samples only the selected topic, caps at ten, and excludes disputed questions', () => {
  const bank = Array.from({ length: 30 }, (_, i) => question(i + 1, i < 15 ? 'scheduling' : 'memory'));
  bank[0].status = 'disputed';
  const initialOrder = bank.map(q => q.id);
  const quick = selectPracticeQuestions(bank, { topic: 'scheduling', limit: 10 }, values => values.reverse());
  assert.equal(quick.length, 10);
  assert.ok(quick.every(q => q.topic === 'scheduling' && q.id !== 1));
  assert.deepEqual(bank.map(q => q.id), initialOrder);
  assert.equal(selectPracticeQuestions(bank, { topic: 'missing' }, values => values).length, 0);
  assert.equal(selectPracticeQuestions(bank, {}, values => values).length, 29);
});

test('compact attempts preserve displayed choice order and answer meaning after source options reorder', () => {
  const bank = [question(1), question(2)];
  const prepared = [{ ...bank[1], options: ['No', 'Yes'] }, bank[0]];
  const plan = createAttemptPlan(bank, prepared);
  const encoded = compactAttempt(plan, state({ currentIndex: 1, answers: new Map([[2, 'Yes']]) }));
  const reordered = bank.map(q => ({ ...q, options: ['No', 'Yes'] }));
  const restored = readAttempt(JSON.stringify(encoded), reordered);
  assert.deepEqual(restored.questions.map(q => q.id), [2, 1]);
  assert.deepEqual(restored.questions.map(q => q.options), prepared.map(q => q.options));
  assert.deepEqual(restored.answers, [[2, 'Yes']]);
  assert.equal(restored.currentIndex, 1);
});

test('compact attempts reject changed content, invalid indices, duplicates, oversized sessions and timers', () => {
  const bank = Array.from({ length: 12 }, (_, i) => question(i + 1));
  const value = compactAttempt(createAttemptPlan(bank, bank), state());
  const read = overrides => readAttempt(JSON.stringify({ ...value, ...overrides }), bank);
  assert.equal(readAttempt(JSON.stringify(value), [{ ...bank[0], question: 'Edited' }, ...bank.slice(1)]), null);
  for (const overrides of [
    { fingerprint: 'old' }, { sessionKind: 'unknown' }, { sessionKind: 'quick' },
    { sessionKind: 'review', short: true }, { sessionKind: 'review', short: false },
    { questions: [{ id: 1, options: [0, 0] }, ...value.questions.slice(1)] },
    { questions: [{ id: 1, options: [-1, 1] }, ...value.questions.slice(1)] },
    { questions: [{ id: 1, options: [0, 1.5] }, ...value.questions.slice(1)] },
    { answers: [[1, 2]] }, { answers: [[1, 'Yes']] }, { answers: [[1, 0], [1, 1]] },
    { deadline: 1000 }, { questions: [value.questions[0], value.questions[0], ...value.questions.slice(2)] },
  ]) assert.equal(read(overrides), null);
});

test('quick and topic attempts restore their exact subset and preserve timed exam deadlines', () => {
  const bank = Array.from({ length: 20 }, (_, i) => question(i + 1));
  for (const [kind, count] of [['quick', 10], ['topic', 12], ['review', 5]]) {
    const value = compactAttempt(createAttemptPlan(bank, bank.slice(0, count)), state({ sessionKind: kind, examMode: kind !== 'review', deadline: kind === 'review' ? null : 1800000060000, answers: new Map([[1, 'No']]) }));
    const restored = readAttempt(JSON.stringify(value), bank);
    assert.equal(restored.sessionKind, kind);
    assert.equal(restored.questions.length, count);
    assert.deepEqual(restored.answers, [[1, 'No']]);
    assert.equal(restored.deadline, value.deadline);
  }
});

test('position-dependent options cannot be reordered by compact storage', () => {
  const q = { ...question(1), options: ['First', 'Second', 'Both A and B'], correctAnswer: 'Both A and B' };
  assert.throws(() => createAttemptPlan([q], [{ ...q, options: [...q.options].reverse() }]), /option order/);
  const value = compactAttempt(createAttemptPlan([q], [q]), state({ answers: new Map([[1, 'Both A and B']]) }));
  value.questions[0].options = [2, 1, 0];
  assert.equal(readAttempt(JSON.stringify(value), [q]), null);
});

test('new snapshots reuse the prepared plan and omit repeated source text', () => {
  const bank = Array.from({ length: 193 }, (_, i) => ({ ...question(i + 1), question: 'A longer source question about operating system scheduling. '.repeat(4), options: ['One explanatory choice '.repeat(5), 'Another explanatory choice '.repeat(5)], correctAnswer: 'One explanatory choice '.repeat(5) }));
  const plan = createAttemptPlan(bank, bank);
  const first = compactAttempt(plan, state());
  const next = compactAttempt(plan, state({ currentIndex: 1, answers: new Map([[1, bank[0].correctAnswer]]) }));
  assert.equal(first.questions, next.questions);
  assert.ok(!JSON.stringify(next).includes(bank[0].question));
  const legacy = { ...state(), version: 1, short: false, questions: bank.map(q => ({ id: q.id, signature: questionSignature(q), options: q.options })), answers: [] };
  assert.ok(JSON.stringify(next).length < JSON.stringify(legacy).length / 10);
});
