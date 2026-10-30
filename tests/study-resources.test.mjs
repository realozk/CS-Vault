import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import summaryMarkdown from '../src/lib/summary-markdown.mjs';
import { getQuestionStudyResources, packStudyResources, STUDY_RESOURCE_MAPPINGS } from '../src/lib/study-resources.ts';
import { createSupplementaryQuizzes } from '../src/lib/quiz-routes.ts';

async function contentFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(entry => !entry.name.startsWith('._')).map(async entry => {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    return entry.isDirectory() ? contentFiles(path, extension) : entry.name.endsWith(extension) ? [path] : [];
  }));
  return nested.flat();
}

const fixtures = Promise.all([
  contentFiles(new URL('../src/content/summaries/', import.meta.url), '.md').then(files => Promise.all(files.map(async file => {
    const source = await readFile(file, 'utf8');
    const id = decodeURIComponent(file.pathname.split('/src/content/summaries/')[1]).replace(/\.md$/, '');
    const title = source.match(/^title:\s*["']?(.*?)["']?\r?$/m)?.[1] ?? id;
    return { id, file, body: source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''), data: { title } };
  }))),
  contentFiles(new URL('../src/content/quizzes/', import.meta.url), '.json').then(files => Promise.all(files.map(async file => ({
    id: decodeURIComponent(file.pathname.split('/src/content/quizzes/')[1]).replace(/\.json$/, ''),
    collection: 'quizzes',
    data: JSON.parse(await readFile(file, 'utf8')),
  })))),
]);

test('every authored resource mapping targets an existing compiled heading in its own course/year', async () => {
  const [summaries] = await fixtures;
  const processor = await createMarkdownProcessor({ rehypePlugins: [summaryMarkdown] });
  const headings = new Map(await Promise.all(summaries.map(async summary => [
    summary.id, (await processor.render(summary.body, { fileURL: summary.file })).metadata.headings,
  ])));
  const courses = new Set();
  for (const mapping of STUDY_RESOURCE_MAPPINGS) {
    courses.add(mapping.summaryId.split('/')[0]);
    assert.ok(headings.has(mapping.summaryId), `Missing notes: ${mapping.summaryId}`);
    const heading = headings.get(mapping.summaryId).find(heading => heading.text === mapping.heading);
    assert.ok(heading, `Missing heading: ${mapping.summaryId}: ${mapping.heading}`);
    assert.ok(heading.slug.startsWith(`summary-content-${mapping.summaryId.split('/').at(-1)}--`));
  }
  assert.deepEqual([...courses].sort(), ['algorithm-analysis', 'computer-networks', 'operating-systems', 'programming-languages', 'web-development']);
});

test('authored question topics resolve to real notes, except the documented topic with no matching notes', async () => {
  const [summaries, quizzes] = await fixtures;
  const missing = new Set();
  let linked = 0;
  for (const quiz of quizzes) {
    const resources = await getQuestionStudyResources({ quizId: quiz.id, questions: quiz.data.questions, summaries, section: quiz.data.section, lang: 'en', baseUrl: '/CS-Vault/' });
    for (const question of quiz.data.questions) {
      if (!question.topic) continue;
      const resource = resources[question.id];
      if (!resource) { missing.add(`${quiz.id.split('/')[0]}:${question.topic}`); continue; }
      linked++;
      assert.equal(resource.topic, question.topic);
      assert.equal(resource.matchedBy, 'topic');
      assert.ok(resource.href.startsWith(`/CS-Vault/${quiz.id.split('/').slice(0, 2).join('/')}/#summary-content-`));
      assert.equal(resource.summaryId.split('/').slice(0, 2).join('/'), quiz.id.split('/').slice(0, 2).join('/'));
    }
  }
  const authoredTopicQuestions = quizzes.reduce((total, quiz) => total + quiz.data.questions.filter(question => question.topic).length, 0);
  assert.equal(linked, authoredTopicQuestions - 1);
  // Reliability-of-information questions have no corresponding authored notes.
  assert.deepEqual([...missing], ['web-development:web-reliability']);
});

test('combined quiz questions keep lecture-specific links for shared topic labels', async () => {
  const [summaries, quizzes] = await fixtures;
  const algorithmQuizzes = quizzes.filter(quiz => quiz.id.startsWith('algorithm-analysis/2026/'));
  for (const quiz of createSupplementaryQuizzes(algorithmQuizzes)) {
    const resources = await getQuestionStudyResources({ quizId: quiz.id, questions: quiz.data.questions, summaries, lang: 'ar', baseUrl: '/CS-Vault' });
    for (const question of quiz.data.questions.filter(question => question.topic === 'proofs')) {
      const resource = resources[question.id];
      assert.ok(resource, `${quiz.id}: ${question.id}`);
      const number = question.sourceLecture ?? Number(question.origin.quizId.match(/lecture-0*(\d+)/)[1]);
      assert.match(resource.summaryId, new RegExp(`/lecture-0${number}-`));
      assert.ok(resource.href.startsWith('/CS-Vault/ar/algorithm-analysis/2026/#'));
    }
  }
});

test('questions without topics use explicit sections, and ambiguous or unknown material stays unlinked', async () => {
  const [summaries] = await fixtures;
  const options = { quizId: 'web-development/2026/all-questions', summaries, lang: 'en' };
  const resources = await getQuestionStudyResources({ ...options, questions: [
    { id: 1, origin: { quizId: 'web-development/2026/lecture-02-part-2-foundations' } },
    { id: 2, sourceLecture: 2 }, // Two separate Lecture 2 summaries: do not guess.
    { id: 3, topic: 'new-topic', sourceLecture: 1 },
    { id: 4, sourceLecture: 1 },
    { id: 5, origin: { quizId: 'algorithm-analysis/2026/lecture-01-midterm' } },
  ] });
  assert.deepEqual(Object.keys(resources), ['1', '4']);
  assert.equal(resources[1].matchedBy, 'section');
  assert.equal(resources[1].href, '/web-development/2026/#summary-content-lecture-02-part-2-tables-and-forms');
  assert.equal(resources[4].href, '/web-development/2026/#summary-content-lecture-01-introduction');
  assert.equal(resources[4].topic, undefined);
  const explicit = await getQuestionStudyResources({ quizId: 'operating-systems/2026/custom', summaries, lang: 'ar', section: { kind: 'chapter', number: 4 }, questions: [{ id: 1 }] });
  assert.equal(explicit[1].href, '/ar/operating-systems/2026/#summary-content-chapter-04');
  const sourceOverride = await getQuestionStudyResources({ quizId: 'operating-systems/2026/chapter-01-practice', summaries, lang: 'en', questions: [{ id: 1, sourceLecture: 4 }] });
  assert.equal(sourceOverride[1].href, '/operating-systems/2026/#summary-content-chapter-04');
});

test('removed or renamed notes fail closed, including after a cached render', async () => {
  const [summaries] = await fixtures;
  const options = { quizId: 'programming-languages/2026/lecture-01-practice-a', lang: 'en', questions: [{ id: 1, topic: 'evaluation' }] };
  assert.ok((await getQuestionStudyResources({ ...options, summaries }))[1]);
  assert.deepEqual(await getQuestionStudyResources({ ...options, summaries: [] }), {});
  const renamed = summaries.map(summary => summary.id === 'programming-languages/2026/lecture-01'
    ? { ...summary, body: summary.body.replace('## Evaluation criteria — slides 6–12', '## Updated assessment heading') }
    : summary);
  assert.deepEqual(await getQuestionStudyResources({ ...options, summaries: renamed }), {});
  assert.ok((await getQuestionStudyResources({ ...options, summaries }))[1]);
});

test('resource routes respect root/custom bases and reject unsafe paths or future years', async () => {
  const [summaries] = await fixtures;
  const options = { quizId: 'computer-networks/2026/chapter-02-practice', lang: 'en', summaries, questions: [{ id: 1, topic: 'dns' }] };
  assert.ok((await getQuestionStudyResources({ ...options, baseUrl: '/learning/vault/' }))[1].href.startsWith('/learning/vault/computer-networks/2026/#'));
  assert.ok((await getQuestionStudyResources({ ...options, baseUrl: '/' }))[1].href.startsWith('/computer-networks/2026/#'));
  for (const baseUrl of ['https://example.com/', '/../vault/', '/vault?x=1', '/vault#x']) {
    assert.deepEqual(await getQuestionStudyResources({ ...options, baseUrl }), {});
  }
  assert.deepEqual(await getQuestionStudyResources({ ...options, quizId: 'computer-networks/2027/chapter-02-practice' }), {});
});

test('the browser payload sends shared links once and preserves every question lookup, including index zero', async () => {
  const [summaries, quizzes] = await fixtures;
  const quiz = createSupplementaryQuizzes(quizzes.filter(quiz => quiz.id.startsWith('algorithm-analysis/2026/')))[0];
  const resources = await getQuestionStudyResources({ quizId: quiz.id, questions: quiz.data.questions, summaries, lang: 'en', baseUrl: '/CS-Vault/' });
  const packed = packStudyResources(resources);
  assert.ok(packed.resources.length < Object.keys(resources).length / 2);
  assert.equal(Object.keys(packed.questions).length, Object.keys(resources).length);
  for (const [questionId, resource] of Object.entries(resources)) {
    assert.deepEqual(packed.resources[packed.questions[questionId]], { title: resource.title, href: resource.href });
  }
  assert.ok(Object.values(packed.questions).includes(0));
  assert.deepEqual(packStudyResources({}), { resources: [], questions: {} });
  assert.ok(JSON.stringify(packed).length < JSON.stringify(resources).length / 2);
});
