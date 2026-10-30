import test from 'node:test';
import assert from 'node:assert/strict';
import { createAllQuestionsQuiz, createTutorialsQuiz } from '../src/lib/quiz-routes.ts';
import {
  createQuestionReportPayload, createQuestionReportText, getQuestionReportDataPath, getQuestionReportHref,
  getQuestionReportQuizPath, getQuestionReportTarget, isOriginalQuizId, parseQuestionReportTarget,
} from '../src/lib/question-report.ts';

const id = 'algorithm-analysis/2026/lecture-01-instructor-tutorial';
const quiz = {
  title: 'Lecture 1 — Instructor Tutorial', subject: 'Algorithm Analysis', year: 2026,
  source: 'Instructor tutorial.pdf', sourceAcademicYear: '1445–1446', sourceTerm: 'Second',
  sourceKind: 'instructor', lang: 'en',
  questions: [
    { id: 7, question: 'Which growth rate is smaller?', options: ['n', 'n²'], correctAnswer: 'n', sourcePage: 4, sourceSlide: 8, sourceSlides: [8, 9] },
    { id: 13, question: 'What does this code do?', code: 'if (x < 2) return x;', options: ['Returns x', 'Returns 2'], correctAnswer: 'Returns x' },
  ],
};
const entry = { id, collection: 'quizzes', data: quiz };

test('question report links retain original content IDs through both aggregate kinds', () => {
  const all = createAllQuestionsQuiz([entry]);
  const aggregateQuestion = all.data.questions.find(question => question.origin.questionId === 13);
  assert.deepEqual(getQuestionReportTarget(all.id, all.data, aggregateQuestion.id), { quizId: id, questionId: 13 });
  const tutorials = createTutorialsQuiz([entry]);
  assert.notEqual(tutorials.data.questions[1].id, 13);
  assert.deepEqual(getQuestionReportTarget(tutorials.id, tutorials.data, tutorials.data.questions[1].id), { quizId: id, questionId: 13 });
  assert.equal(tutorials.data.questions[1].origin.source, quiz.source);
  assert.equal(quiz.questions[1].id, 13, 'aggregate construction never changes original content');
  assert.equal(getQuestionReportTarget(all.id, all.data, -1), null);
  assert.equal(getQuestionReportTarget('algorithm-analysis/2026/all-tutorials', { questions: [{ ...quiz.questions[0], origin: undefined }] }, 7), null);
});

test('query targets reject paths, external URLs, ambiguous parameters and imprecise IDs', () => {
  const query = new URLSearchParams({ reportQuiz: id, reportQuestion: '7' });
  assert.deepEqual(parseQuestionReportTarget(query), { quizId: id, questionId: 7 });
  for (const value of ['../lecture', `${id}/../x`, 'https://evil.example/quiz', '//evil.example/x', 'algorithm-analysis/2026/all-questions', 'algorithm-analysis/2026/all-tutorials', `${id}?x=1`, `${id}#x`, `${id}/`, `${id}%2f..`, `${id}\\other`]) {
    assert.equal(isOriginalQuizId(value), false, value);
    assert.equal(parseQuestionReportTarget(new URLSearchParams({ reportQuiz: value, reportQuestion: '7' })), null);
  }
  for (const value of ['7.5', 'Infinity', 'NaN', '7x', '', '9007199254740992']) {
    assert.equal(parseQuestionReportTarget(new URLSearchParams({ reportQuiz: id, reportQuestion: value })), null, value);
  }
  query.append('reportQuiz', id);
  assert.equal(parseQuestionReportTarget(query), null);
  assert.equal(parseQuestionReportTarget(new URLSearchParams(`reportQuiz=${id}`)), null);
});

test('report navigation preserves deployment base, locale and original quiz route', () => {
  const target = { quizId: id, questionId: 13 };
  const href = getQuestionReportHref('/CS-Vault/ar/contribute/', target);
  const url = new URL(href, 'https://example.test');
  assert.equal(url.pathname, '/CS-Vault/ar/contribute/');
  assert.equal(url.hash, '#question-correction');
  assert.deepEqual(parseQuestionReportTarget(url.searchParams), target);
  assert.equal(getQuestionReportDataPath('/CS-Vault/', target), `/CS-Vault/question-reports/${id}.json`);
  assert.equal(getQuestionReportDataPath('/CS-Vault', target), `/CS-Vault/question-reports/${id}.json`);
  assert.equal(getQuestionReportQuizPath(target, '/CS-Vault/', 'ar'), '/CS-Vault/ar/algorithm-analysis/2026/quiz/lecture-01-instructor-tutorial/');
  assert.equal(getQuestionReportQuizPath(target, '/', 'en'), '/algorithm-analysis/2026/quiz/lecture-01-instructor-tutorial/');
});

test('correction drafts resolve real questions and preserve source evidence in EN and AR', () => {
  const payload = createQuestionReportPayload(id, quiz);
  const target = { quizId: id, questionId: 7 };
  for (const lang of ['en', 'ar']) {
    const text = createQuestionReportText(payload, target, 'https://example.test/quiz/', lang);
    for (const literal of [quiz.title, quiz.subject, 'algorithm-analysis/2026', quiz.questions[0].question, quiz.source, '1445–1446', 'Second', '8, 9', 'n²']) assert.ok(text.includes(literal), literal);
    assert.match(text, lang === 'ar' ? /معرّف السؤال الأصلي: 7/ : /Original question ID: 7/);
    assert.match(text, lang === 'ar' ? /المشكلة أو التصحيح المقترح:/ : /Issue \/ suggested correction:/);
  }
  assert.ok(createQuestionReportText(payload, { ...target, questionId: 13 }, 'https://example.test/quiz/', 'en').includes(quiz.questions[1].code));
  assert.equal(createQuestionReportText(payload, { ...target, questionId: 999 }, '/quiz/', 'en'), null);
  assert.equal(createQuestionReportText({ ...payload, id: 'other-course/2026/quiz' }, target, '/quiz/', 'en'), null);
  assert.equal(createQuestionReportText({ id, quiz: { ...quiz, questions: null } }, target, '/quiz/', 'en'), null);
});

test('lazy report records contain question context without unused answers and explanations', () => {
  const payload = createQuestionReportPayload(id, { ...quiz, questions: [{ ...quiz.questions[0], explanation: 'A long explanation is not needed for reporting.', topic: 'Growth rates' }] });
  const output = JSON.stringify(payload);
  assert.equal(payload.quiz.questions[0].id, 7);
  assert.equal(payload.quiz.questions[0].sourcePage, 4);
  assert.equal(payload.quiz.source, quiz.source);
  assert.doesNotMatch(output, /correctAnswer|explanation|topic/);
});
