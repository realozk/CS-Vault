import test from 'node:test';
import assert from 'node:assert/strict';
import { createAllQuestionsQuiz, getQuizStaticPaths } from '../src/lib/quiz-routes.ts';
import { getPracticeQuestions, getQuizQuestionPath } from '../src/lib/quiz-questions.ts';

test('combined practice keeps its collection year without claiming one source edition', () => {
  const entries = ['2023–2024', '2024–2025'].map((sourceAcademicYear, index) => ({
    id: `operating-systems/2026/practice-${index + 1}`,
    collection: 'quizzes',
    data: {
      title: `Practice ${index + 1}`,
      date: new Date('2026-10-01'),
      subject: 'Operating Systems',
      year: 2026,
      year_level: 3,
      semester: 1,
      sourceAcademicYear,
      sourceTerm: `Term ${index + 1}`,
      updatedAt: new Date('2026-10-17'),
      sourceKind: 'provided',
      questions: [{
        id: 1,
        question: `Question from source ${index + 1}`,
        options: ['A', 'B'],
        correctAnswer: 'A',
      }],
    },
  }));

  const combined = createAllQuestionsQuiz(entries);

  assert.equal(combined.id, 'operating-systems/2026/all-questions');
  assert.equal(combined.data.year, 2026);
  assert.equal(combined.data.questions.length, 2);
  assert.equal(combined.data.sourceAcademicYear, undefined);
  assert.equal(combined.data.sourceTerm, undefined);
  assert.equal(combined.data.updatedAt, undefined);
  assert.equal(entries[0].data.sourceAcademicYear, '2023–2024');
});

const sourceQuiz = (id, questions, overrides = {}) => ({
  id: `programming-languages/2026/${id}`,
  collection: 'quizzes',
  data: {
    title: id,
    date: new Date('2026-10-01'),
    subject: 'Programming Languages',
    year: 2026, year_level: 3, semester: 1, lang: 'en',
    source: `${id}.pdf`, sourceKind: 'provided',
    questions, ...overrides,
  },
});
const question = (id, overrides = {}) => ({
  id, question: 'What is the output?', options: ['total', 'TOTAL'],
  correctAnswer: 'total', ...overrides,
});

test('combined practice keeps code, case, and whitespace differences while deduplicating exact copies', () => {
  const original = question(1, { code: 'print(total)' });
  const distinct = [
    original,
    question(2, { code: 'print(TOTAL)' }),
    question(3, { code: 'print( total )' }),
    question(4, { code: 'print(total)', question: 'What is the Output?' }),
    question(5, { code: 'print(total)', question: 'What  is the output?' }),
    question(6, { code: 'print(total)', options: ['total', 'total '], correctAnswer: 'total ' }),
    question(7, { code: 'print(total)', correctAnswer: 'TOTAL' }),
  ];
  const entries = [sourceQuiz('a', distinct), sourceQuiz('b', [question(1, { ...original, options: ['TOTAL', 'total'] })])];
  const combined = createAllQuestionsQuiz(entries);
  assert.equal(combined.data.questions.length, distinct.length);
  assert.equal(new Set(combined.data.questions.map(q => q.id)).size, distinct.length);
  assert.ok(combined.data.questions.every(q => Number.isSafeInteger(q.id) && q.id > 0));
  assert.equal(entries[0].data.questions[0].origin, undefined);
});

test('combined question IDs, selected provenance, and order are independent of loader order', () => {
  const first = sourceQuiz('a-first', [question(9, { question: 'Later ID?' }), question(2)]);
  const last = sourceQuiz('z-last', [question(1), question(5, { question: 'Distinct?' })], { lang: 'ar' });
  const combined = createAllQuestionsQuiz([last, first]);
  assert.deepEqual(combined, createAllQuestionsQuiz([first, last]));
  assert.deepEqual(combined.data.questions[0].origin, {
    quizId: first.id, questionId: 2, title: 'a-first', source: 'a-first.pdf', lang: 'en',
  });
  assert.deepEqual(combined.data.questions[2].origin, {
    quizId: last.id, questionId: 5, title: 'z-last', source: 'z-last.pdf', lang: 'ar',
  });
  assert.equal(getQuizQuestionPath(first.id), '/programming-languages/2026/quiz/a-first/');
  assert.equal(getQuizQuestionPath(`${first.id}.json`), '/programming-languages/2026/quiz/a-first/');
  const expanded = createAllQuestionsQuiz([last, first, sourceQuiz('0-earlier-source', [question(1, { question: 'New question?' })])]);
  for (const original of combined.data.questions) {
    assert.equal(expanded.data.questions.find(q => q.question === original.question).id, original.id);
  }
});

test('disputed source questions remain inspectable without entering scored practice', () => {
  const disputed = question(22, { status: 'disputed', reviewNote: 'Awaiting instructor clarification.' });
  const reviewed = question(23, { status: 'reviewed' });
  const entry = sourceQuiz('instructor', [disputed, reviewed]);
  const combined = createAllQuestionsQuiz([entry]);
  assert.equal(combined.data.questions.length, 2);
  assert.equal(combined.data.questions[0].correctAnswer, disputed.correctAnswer);
  assert.equal(combined.data.questions[0].origin.questionId, 22);
  assert.deepEqual(getPracticeQuestions(combined.data.questions).map(q => q.origin.questionId), [23]);
  assert.equal(entry.data.questions.length, 2);
  assert.equal(getQuizStaticPaths([entry]).length, 2);
});

test('combined practice retains distinct fixed choice orders and intentional shuffle settings', () => {
  const positional = { ...question(1), options: ['One', 'Two', 'Both A and B'], correctAnswer: 'Both A and B' };
  const fixed = { ...question(2), shuffleOptions: false };
  const combined = createAllQuestionsQuiz([sourceQuiz('a', [positional, fixed]), sourceQuiz('b', [
    { ...positional, options: ['Two', 'One', 'Both A and B'] }, question(2),
  ])]);
  assert.equal(combined.data.questions.length, 4);
  assert.notEqual(combined.data.questions[0].id, combined.data.questions[2].id);
  assert.notEqual(combined.data.questions[1].id, combined.data.questions[3].id);
});

test('combined provenance is derived from the actual source and ignores a supplied origin', () => {
  const entry = sourceQuiz('actual-source', [question(9, { origin: {
    quizId: 'other/2025/fake', questionId: 44, title: 'Fake source', source: 'Fake.pdf', lang: 'ar',
  } })]);
  assert.deepEqual(createAllQuestionsQuiz([entry]).data.questions[0].origin, {
    quizId: entry.id, questionId: 9, title: 'actual-source', source: 'actual-source.pdf', lang: 'en',
  });
});
