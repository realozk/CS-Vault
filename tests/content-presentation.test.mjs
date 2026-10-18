import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { parse } from 'parse5';
import summaryMarkdown from '../src/lib/summary-markdown.mjs';
import { compareStudyEntries, getStudySection, studyPlacementSchema } from '../src/lib/content-order.ts';

test('rendered summaries have unique scoped headings, working local links and unchanged code', async () => {
  const processor = await createMarkdownProcessor({ rehypePlugins: [summaryMarkdown] });
  const markdown = '# Introduction\n\n## Shared heading\n\n[Read](#shared-heading)\n\n```html\n<h1 id="literal">Example</h1>\n```';
  const render = filename => processor.render(markdown, { fileURL: new URL(`../src/content/summaries/example/2026/${filename}.md`, import.meta.url) });
  const [first, second] = await Promise.all([render('lecture-01'), render('lecture-02')]);
  assert.match(first.code, /id="summary-content-lecture-01--shared-heading"/);
  assert.match(second.code, /id="summary-content-lecture-02--shared-heading"/);
  assert.match(first.code, /href="#summary-content-lecture-01--shared-heading"/);
  const headings = [];
  const visit = node => {
    if (/^h[1-6]$/.test(node.tagName ?? '')) headings.push(node.tagName);
    for (const child of node.childNodes ?? []) visit(child);
  };
  visit(parse(first.code));
  assert.deepEqual(headings, ['h3', 'h4']);
  assert.match(first.code, /literal/);
  assert.doesNotMatch(first.code, /id="summary-content-lecture-01--literal"/);
});

test('study ordering supports arbitrary courses, explicit sections and natural lecture order', () => {
  const entry = (id, title, extra = {}) => ({ id: `new-course/2027/${id}`, data: { title, ...extra } });
  const entries = [entry('lecture-10', 'Lecture 10'), entry('mixed-review', 'Mixed review'), entry('lecture-02', 'Lecture 2')];
  assert.deepEqual(entries.sort(compareStudyEntries).map(item => item.id.split('/').at(-1)), ['lecture-02', 'lecture-10', 'mixed-review']);
  assert.deepEqual(getStudySection(entry('different-title', 'أساسيات', { section: { kind: 'chapter', number: 4 } })), { kind: 'chapter', number: 4 });
  assert.deepEqual(getStudySection(entry('different-title', 'المحاضرة ٣ — مقدمة')), { kind: 'lecture', number: 3 });
  assert.equal(studyPlacementSchema.safeParse({ section: { kind: 'lecture' } }).success, false);
  assert.equal(studyPlacementSchema.safeParse({ section: { kind: 'mixed', number: 1 } }).success, false);
  const variants = [entry('applications', 'Lecture 1', { order: 2 }), entry('foundations', 'Lecture 1', { order: 1 })];
  assert.equal(variants.sort(compareStudyEntries)[0].id.endsWith('/foundations'), true);
});

test('authored HTML summary headings and accessibility references share the namespace', async () => {
  const processor = await createMarkdownProcessor({ rehypePlugins: [summaryMarkdown] });
  const output = await processor.render('<h1 id="intro">Intro</h1>\n\n<a href="#intro" aria-describedby="intro">Read intro</a>', {
    fileURL: new URL('../src/content/summaries/example/2026/html-summary.md', import.meta.url),
  });
  assert.match(output.code, /<h3 id="summary-content-html-summary--intro"/);
  assert.match(output.code, /href="#summary-content-html-summary--intro"/);
  assert.match(output.code, /aria-describedby="summary-content-html-summary--intro"/);
});
