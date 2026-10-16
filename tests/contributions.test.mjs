import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { courses, courseKey } from '../src/lib/course-catalog.ts';
import { createInstructions, createStarterQuiz } from '../src/lib/contribution-kit.ts';
import { getContributionFormUrl, MAX_QUIZ_BYTES, safeQuizFilename, validateContribution } from '../src/lib/contributions.ts';
import { quizSchema } from '../src/lib/quiz-schema.ts';

const course = courses[0];
const starter = () => createStarterQuiz(course, '2026-10-16');
const check = quiz => validateContribution(JSON.stringify(quiz), course);
const config = { responderUrl: 'https://docs.google.com/forms/d/e/example/viewform' };

test('every course starter validates with matching placement and versioned instructions', () => {
  for (const course of courses) {
    const quiz = createStarterQuiz(course);
    assert.ok(validateContribution(JSON.stringify(quiz), course).quiz, courseKey(course));
    assert.match(createInstructions(course), /format 1\.0/);
    assert.ok(createInstructions(course).includes(courseKey(course)));
    assert.equal(quiz.year, course.year);
    assert.equal(quiz.year_level, course.year_level);
    assert.equal(quiz.semester, course.semester);
  }
});

test('all existing quiz files pass the shared schema and catalog metadata', async () => {
  let count = 0;
  for (const course of courses) {
    const directory = new URL(`../src/content/quizzes/${courseKey(course)}/`, import.meta.url);
    let files;
    try { files = await readdir(directory); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const file of files.filter(file => file.endsWith('.json') && !file.startsWith('._'))) {
      const text = await readFile(new URL(file, directory), 'utf8');
      const result = validateContribution(text, course);
      assert.ok(result.quiz, `${file}: ${result.errors.join('; ')}`); count++;
    }
  }
  assert.ok(count >= 21);
});

test('checker blocks oversized/malformed JSON, missing fields and wrong metadata', () => {
  assert.match(validateContribution(' '.repeat(MAX_QUIZ_BYTES + 1), course).errors[0], /2 MB/);
  assert.match(validateContribution('{', course).errors[0], /Invalid JSON/);
  for (const field of ['title', 'date', 'subject', 'year', 'year_level', 'semester', 'questions']) {
    const quiz = starter(); delete quiz[field]; assert.ok(check(quiz).errors.length, field);
  }
  for (const patch of [{ subject: 'Other course' }, { year: 2025 }, { semester: 2 }, { year_level: 1 }]) {
    assert.match(check({ ...starter(), ...patch }).errors.join(' '), /Course mismatch/);
  }
});

test('question errors include useful positions and preserve the schema contract', () => {
  const quiz = starter(); quiz.questions.push({ ...quiz.questions[0], correctAnswer: 'not an option' });
  const result = check(quiz);
  assert.ok(result.errors.some(error => /Question 2: id: Question ID 1 is already used/.test(error)));
  assert.ok(result.errors.some(error => /Question 2: correctAnswer.*exactly match/.test(error)));
  quiz.questions = [{ ...quiz.questions[0], options: ['same', 'same'], correctAnswer: 'same' }];
  assert.match(check(quiz).errors.join(' '), /distinct/);
});

test('review warnings are distinct from blocking errors and source years stay strings', () => {
  const quiz = starter(); quiz.questions[0].optionsSource = 'generated'; quiz.questions.push({ ...quiz.questions[0], id: 2 });
  const result = check(quiz);
  assert.ok(result.quiz); assert.equal(result.errors.length, 0);
  for (const warning of [/inferred/, /generated answer choices/, /missing page/, /possible repeated/, /academic year/]) assert.match(result.warnings.join(' '), warning);
  quiz.sourceAcademicYear = '1445–1446'; quiz.sourceTerm = 'Second'; quiz.updatedAt = '2026-10-17';
  assert.equal(check(quiz).quiz.sourceAcademicYear, '1445–1446');
  assert.equal(check(quiz).quiz.year, course.year);
  assert.equal(quizSchema.safeParse({ ...quiz, sourceAcademicYear: 2023 }).success, false);
});

test('site links share one public form without course or correction parameters', () => {
  assert.equal(getContributionFormUrl(config), config.responderUrl);
  assert.equal(getContributionFormUrl({responderUrl:'https://forms.gle/Example123'}), 'https://forms.gle/Example123');
  assert.equal(getContributionFormUrl({responderUrl:config.responderUrl+'?entry.1=private#fragment'}),config.responderUrl);
  for (const responderUrl of ['', 'javascript:alert(1)', 'https://example.com/form', 'https://docs.google.com/forms/d/example/edit', 'https://forms.gle.evil.test/foo', 'https://user:password@forms.gle/example']) {
    assert.equal(getContributionFormUrl({responderUrl}), null);
  }
});

test('filenames reject contributor paths and reserve the generated aggregate', () => {
  assert.equal(safeQuizFilename('chapter-01.json'), 'chapter-01.json');
  for (const name of ['../file.json', 'folder/file.json', 'all-questions.json', 'all-questions', 'file name.json', '.json', 'FILE.JSON']) assert.throws(() => safeQuizFilename(name));
});

test('corrections target an existing quiz, preserve dates/IDs and accept new IDs', () => {
  const quiz = starter();
  const target = { id: `${courseKey(course)}/chapter-01`, title: quiz.title, date: quiz.date,
    questions: quiz.questions.map(q => ({ id: q.id, signature: JSON.stringify([q.question, q.code || '']) })) };
  const validate = value => validateContribution(JSON.stringify(value), course, target);
  assert.ok(validate({ ...quiz, updatedAt: '2026-10-18' }).quiz);
  assert.match(validate({ ...quiz, date: '2026-10-17' }).errors.join(' '), /publication date/);
  assert.match(validate({ ...quiz, questions: [{ ...quiz.questions[0], id: 8 }] }).errors.join(' '), /Preserve question ID|removed question ID/);
  assert.ok(validate({ ...quiz, questions: [...quiz.questions, { ...quiz.questions[0], id: 2, question: 'New question' }] }).quiz);
  assert.ok(validateContribution(JSON.stringify(quiz), course, { ...target, id: 'other/2026/quiz' }).errors.length);
});

test('shareable volunteer files match the catalog and validate without a website tool', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../contributions/course-catalog.json',import.meta.url),'utf8'));
  assert.deepEqual(snapshot.map(c=>c.course_key),courses.map(courseKey));
  for (const course of courses) {
    const base = new URL(`../contributions/volunteer-kit/${course.slug}-${course.year}`,import.meta.url);
    const json = await readFile(new URL(base.href+'.example.json'),'utf8');
    const instructions = await readFile(new URL(base.href+'.instructions.md'),'utf8');
    assert.ok(validateContribution(json,course).quiz);
    assert.match(instructions,/shared Google Form/);
    assert.doesNotMatch(instructions,/Validate and preview on the contribution page/);
  }
});
