import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { courseKey, courseLabel, courseSearchNames, hasMultipleCollections, resolveCourse } from '../src/lib/course-catalog.ts';

const oldCourse = { slug: 'operating-systems', name: 'Operating Systems', name_ar: 'نظم التشغيل', subject_code: 'CS3608', year: 2026, year_level: 3, semester: 1 };
const nextCourse = { ...oldCourse, name: 'Operating Systems II', name_ar: 'نظم التشغيل ٢', subject_code: 'CS4608', year: 2027 };
const earlierYear = { ...oldCourse, slug: 'introduction', name: 'Introduction', name_ar: 'مقدمة', subject_code: 'CS1001', year_level: 1 };
const catalog = [earlierYear, oldCourse, nextCourse];

const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const withoutImports = source => source.replace(/^import .*;\n/gm, '');

test('catalog lookup and exported choices distinguish future collection editions', () => {
  assert.equal(resolveCourse('operating-systems', '2027', catalog), nextCourse);
  assert.equal(resolveCourse('CS3608', 2026, catalog), oldCourse);
  assert.equal(resolveCourse('نظم التشغيل', 2026, catalog), oldCourse);
  assert.equal(resolveCourse('operating-systems', 2025, catalog), undefined);
  assert.equal(resolveCourse('Operating Systems', undefined, catalog), oldCourse);
  assert.ok(courseLabel(oldCourse).includes(courseKey(oldCourse)));
  assert.notEqual(courseLabel(oldCourse), courseLabel({ ...oldCourse, year: 2027 }));
  assert.deepEqual(courseSearchNames(oldCourse), ['Operating Systems', 'نظم التشغيل']);
  assert.equal(hasMultipleCollections('operating-systems', catalog), true);
  assert.equal(hasMultipleCollections('introduction', catalog), false);
});

test('module names use their own collection edition and default to a year with material', async () => {
  const source = withoutImports(await readFile(new URL('../src/lib/modules.ts', import.meta.url), 'utf8'));
  const exports = {};
  vm.runInNewContext(transpile(source), {
    exports,
    subjects: catalog,
    resolveCourse: (name, year) => resolveCourse(name, year, catalog),
    getCollection: async name => name === 'summaries' ? [{ id: 'operating-systems/2027/chapter-01', data: { date: new Date('2026-10-18') } }] : [],
    validateContentMetadata() {},
  });
  const modules = await exports.getModules('ar');
  assert.equal(modules.find(module => module.subject === 'operating-systems' && module.year === '2027').subjectName, nextCourse.name_ar);
  assert.equal(exports.getSubjectName('operating-systems', 'en', 2026), oldCourse.name);
  assert.equal(exports.getDefaultStudyYear(modules), 3);
  assert.equal(exports.getDefaultStudyYear(modules.map(module => ({ ...module, summariesCount: 0, quizzesCount: 0 }))), 1);
  assert.equal(exports.getDefaultStudyYear([]), 1);
});

const node = (attrs = {}) => {
  const listeners = new Map();
  const classes = new Set();
  const element = {
    attrs, listeners, classes, children: [], value: '', textContent: '',
    getAttribute: name => attrs[name] ?? null,
    setAttribute: (name, value) => { attrs[name] = value; },
    addEventListener: (name, callback) => { listeners.set(name, callback); },
    appendChild(child) { this.children.push(child); },
    classList: {
      add: (...values) => values.forEach(value => classes.add(value)),
      remove: (...values) => values.forEach(value => classes.delete(value)),
      toggle: (value, force) => force ? classes.add(value) : classes.delete(value),
    },
  };
  Object.defineProperty(element, 'innerHTML', { set(value) { this.html = value; this.children = []; }, get() { return this.html; } });
  return element;
};

async function homeHarness(url) {
  let location = new URL(url);
  const tabs = [1, 2, 3, 4].map(year => node({ 'data-year-tab': String(year), 'aria-pressed': String(year === 3) }));
  const blocks = [1, 2, 3, 4].map(year => node({ 'data-year-content': String(year) }));
  const searchIndex = ['subject', 'summary', 'quiz'].map(type => ({
    type, title: type === 'subject' ? 'Operating Systems' : 'Chapter 1', description: 'Study material', author: '',
    subjectCode: oldCourse.subject_code, subjectNames: courseSearchNames(oldCourse), year: '2026', yearLevel: 3, semester: 1,
    url: `/CS-Vault/operating-systems/2026/${type === 'quiz' ? 'quiz/chapter-01' : ''}`,
  }));
  const nodes = Object.fromEntries(['directory-container', 'global-search-input', 'search-results-pane', 'core-tab-view', 'search-results-grid', 'search-results-count', 'search-no-results'].map(id => [id, node()]));
  nodes['directory-container'].attrs['data-search-index'] = JSON.stringify(searchIndex);
  const windowListeners = new Map();
  const window = {
    get location() { return location; },
    history: { state: { retained: true }, replaceState(state, _, next) { assert.equal(state.retained, true); location = new URL(next, location); } },
    addEventListener: (name, callback) => { windowListeners.set(name, callback); },
    dispatchEvent: event => windowListeners.get(event.type)?.(event),
  };
  const source = withoutImports(await readFile(new URL('../src/scripts/home.ts', import.meta.url), 'utf8'));
  vm.runInNewContext(transpile(source), {
    window, URL, Event, console, refreshNewContentBadges() {}, escapeHTML: value => value,
    setTimeout: callback => { callback(); return 1; }, clearTimeout() {},
    document: {
      querySelector: selector => selector === '#global-search-input' ? nodes['global-search-input'] : null,
      querySelectorAll: selector => selector === '[data-year-tab]' ? tabs : selector === '[data-year-content]' ? blocks : [],
      getElementById: id => nodes[id], addEventListener() {}, createElement: () => node(),
    },
  });
  return { tabs, blocks, nodes, window, setUrl: next => { location = new URL(next); } };
}

test('home search finds course, summaries and quizzes by code or either course language', async () => {
  const { nodes } = await homeHarness('https://example.test/CS-Vault/');
  for (const query of ['CS3608', 'cs 3608', 'CS-3608', 'نظم التشغيل', 'Operating Systems']) {
    nodes['global-search-input'].value = query;
    nodes['global-search-input'].listeners.get('input')();
    assert.equal(nodes['search-results-grid'].children.length, 3, query);
    assert.equal(nodes['search-no-results'].classes.has('hidden'), true);
  }
  nodes['global-search-input'].value = 'unrelated';
  nodes['global-search-input'].listeners.get('input')();
  assert.equal(nodes['search-results-grid'].children.length, 0);
  assert.equal(nodes['search-no-results'].classes.has('hidden'), false);
});

test('home restores shareable study-year selection and persists clicks without dropping other URL state', async () => {
  const { tabs, blocks, window, setUrl } = await homeHarness('https://example.test/CS-Vault/?year=2&source=friend#directory');
  assert.equal(tabs[1].attrs['aria-pressed'], 'true');
  assert.equal(blocks[1].classes.has('hidden'), false);
  assert.equal(blocks[2].classes.has('hidden'), true);
  let locationChanges = 0;
  window.addEventListener('locationchange', () => { locationChanges++; });
  tabs[3].listeners.get('click')();
  assert.equal(window.location.search, '?year=4&source=friend');
  assert.equal(window.location.hash, '#directory');
  assert.equal(locationChanges, 1);
  setUrl('https://example.test/CS-Vault/?year=invalid');
  window.dispatchEvent(new Event('popstate'));
  assert.equal(tabs[2].attrs['aria-pressed'], 'true');
});

test('language switching retains current query and summary fragment, including after history updates', async () => {
  const layout = await readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
  const source = layout.match(/<script>\s*(\/\/ Static pages[\s\S]*?)<\/script>/)[1];
  for (const [path, target] of [['/CS-Vault/operating-systems/2026/', '/CS-Vault/ar/operating-systems/2026/'], ['/CS-Vault/ar/', '/CS-Vault/']]) {
    let location = new URL(`https://example.test${path}?year=3#summary-content-chapter-02`);
    const link = node({ href: target });
    const windowListeners = new Map();
    vm.runInNewContext(transpile(source), {
      URL, document: { querySelector: () => link },
      window: { get location() { return location; }, addEventListener: (name, callback) => { windowListeners.set(name, callback); } },
    });
    assert.equal(link.href, `https://example.test${target}?year=3#summary-content-chapter-02`);
    location = new URL(`https://example.test${path}?year=1#summary-content-chapter-03`);
    link.listeners.get('click')();
    assert.equal(link.href, `https://example.test${target}?year=1#summary-content-chapter-03`);
    location.hash = '#summary-content-chapter-04';
    windowListeners.get('locationchange')();
    assert.equal(link.href, `https://example.test${target}?year=1#summary-content-chapter-04`);
  }
});
