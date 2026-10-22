import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createSupplementaryQuizzes, createTutorialsQuiz, getQuizStaticPaths } from '../src/lib/quiz-routes.ts';

function courseEntries(subject) {
  const directory = new URL(`../src/content/quizzes/${subject}/2026/`, import.meta.url);
  return readdirSync(directory).filter(file => !file.startsWith('.') && file.endsWith('.json')).map(file => ({
    id: `${subject}/2026/${file.replace(/\.json$/, '')}`,
    collection: 'quizzes',
    data: JSON.parse(readFileSync(new URL(file, directory), 'utf8')),
  }));
}

const algorithmEntries = courseEntries('algorithm-analysis');
const languageEntries = courseEntries('programming-languages');

test('combined tutorials preserve all 68 questions, marked answers, and PDF references without mutating originals', () => {
  const before = structuredClone(algorithmEntries);
  const quiz = createTutorialsQuiz([...algorithmEntries].reverse());
  const tutorials = algorithmEntries.filter(entry => entry.data.sourceKind === 'instructor').sort((a, b) => a.id.localeCompare(b.id));
  const originals = tutorials.flatMap(entry => entry.data.questions.map(question => ({ entry, question })));

  assert.equal(quiz.id, 'algorithm-analysis/2026/all-tutorials');
  assert.equal(quiz.data.sourceKind, 'combined');
  assert.equal(quiz.data.featured, false);
  assert.equal(quiz.data.questions.length, 68);
  quiz.data.questions.forEach((question, index) => {
    const original = originals[index];
    assert.deepEqual(question, {
      ...original.question,
      id: index + 1,
      explanation: `${original.entry.data.source} — ${original.question.explanation}`,
    });
    assert.equal(question.answerSource, 'marked');
    assert.ok(question.options.includes(question.correctAnswer));
    assert.doesNotMatch(question.explanation, /answer key (?:selects|gives) [A-D]:/);
  });
  assert.deepEqual(algorithmEntries, before);
});

test('individual routes remain available and the tutorial aggregate is last without duplicating the all-questions bank', () => {
  const quizzes = createSupplementaryQuizzes(algorithmEntries);
  assert.deepEqual(quizzes.map(quiz => quiz.id.split('/').at(-1)), ['all-questions', 'all-tutorials']);
  assert.equal(quizzes[0].data.questions.length, 193);

  const paths = getQuizStaticPaths(algorithmEntries);
  assert.equal(paths.length, algorithmEntries.length + 2);
  assert.equal(new Set(paths.map(path => JSON.stringify(path.params))).size, paths.length);
  for (const entry of algorithmEntries) assert.ok(paths.some(path => path.props.quiz === entry));
  assert.equal(paths.at(-1).params.slug, 'all-tutorials');
});

test('tutorial aggregation stays within Algorithm Analysis and does not change other subjects or empty courses', () => {
  assert.equal(createTutorialsQuiz(languageEntries), null);
  assert.deepEqual(createSupplementaryQuizzes([]), []);
  assert.equal(createSupplementaryQuizzes(languageEntries).length, 1);
  const paths = getQuizStaticPaths([...algorithmEntries, ...languageEntries]);
  const tutorialPaths = paths.filter(path => path.params.slug === 'all-tutorials');
  assert.equal(tutorialPaths.length, 1);
  assert.equal(tutorialPaths[0].params.subject, 'algorithm-analysis');
});
