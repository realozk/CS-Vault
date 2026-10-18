import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { quizSchema } from '../src/lib/quiz-schema.ts';
import { getPracticeQuestions } from '../src/lib/quiz-questions.ts';

const tutorialPath = new URL('../src/content/quizzes/programming-languages/2026/lecture-01-instructor-tutorial.json', import.meta.url);

test('tutorial retains its source key and IDs but excludes disputed question 22 from scored practice', async () => {
  const quiz = quizSchema.parse(JSON.parse(await readFile(tutorialPath, 'utf8')));
  assert.equal(quiz.questions.length, 29);
  assert.deepEqual(quiz.questions.map(q => q.id), Array.from({ length: 29 }, (_, index) => index + 1));
  const disputed = quiz.questions.find(q => q.id === 22);
  assert.equal(disputed.correctAnswer, 'Smalltalk');
  assert.equal(disputed.answerSource, 'marked');
  assert.equal(disputed.status, 'disputed');
  assert.ok(disputed.reviewNote.includes('instructor clarification'));
  assert.equal(getPracticeQuestions(quiz.questions).length, 28);
  assert.ok(getPracticeQuestions(quiz.questions).every(q => q.id !== 22));
  assert.ok(quiz.questions.every(q => /original PDF choice [A-D]:/.test(q.explanation)));
  assert.equal(quiz.date.toISOString().slice(0, 10), '2026-10-09');
});

test('disputed questions require a review note and review status is validated', async () => {
  const quiz = JSON.parse(await readFile(tutorialPath, 'utf8'));
  const disputed = quiz.questions.find(q => q.id === 22);
  delete disputed.reviewNote;
  assert.equal(quizSchema.safeParse(quiz).success, false);
  disputed.status = 'reviewed';
  assert.equal(quizSchema.safeParse(quiz).success, true);
  disputed.status = 'approved-by-guessing';
  assert.equal(quizSchema.safeParse(quiz).success, false);
});

test('source quizzes validate shuffle settings and strip derived provenance supplied in JSON', async () => {
  const quiz = JSON.parse(await readFile(tutorialPath, 'utf8'));
  quiz.questions[0].shuffleOptions = false;
  quiz.questions[0].origin = { quizId: 'other/2025/fake', questionId: 99, title: 'Spoofed provenance' };
  const validated = quizSchema.parse(quiz);
  assert.equal(validated.questions[0].shuffleOptions, false);
  assert.equal(validated.questions[0].origin, undefined);
  quiz.questions[0].shuffleOptions = 'false';
  assert.equal(quizSchema.safeParse(quiz).success, false);
});
