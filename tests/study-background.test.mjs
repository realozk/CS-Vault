import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpile((await readFile(new URL('../src/scripts/study-background.ts', import.meta.url), 'utf8'))
  .replace(/^export \{\};\s*$/m, ''), { target: ts.ScriptTarget.ES2022 });

function mountBackground({ quiz = false, reduced = false, motion = 'on', width = 390, height = 844 } = {}) {
  const events = new Map();
  const frames = new Map();
  let nextFrame = 0;
  let quizPage = quiz;
  let resize;
  const classes = () => {
    const values = new Set();
    return { contains: name => values.has(name), add: name => values.add(name),
      remove: name => values.delete(name), toggle: (name, enabled) => enabled ? values.add(name) : values.delete(name) };
  };
  const listen = (type, handler) => events.set(type, [...events.get(type) ?? [], handler]);
  const fire = (type, detail = {}) => [...events.get(type) ?? []].forEach(handler => handler(detail));
  const metrics = { paints: 0 };
  const context = { clearRect() {}, fillRect() { if (context.globalCompositeOperation === 'destination-out') metrics.paints++; }, fillText() {}, drawImage() {} };
  const makeCanvas = () => ({ width: 0, height: 0, dataset: {}, style: {}, getContext: () => context });
  const canvas = makeCanvas();
  const bounds = { width, height: 12000 };
  const grid = { style: {} };
  const gridStyle = {};
  const container = { classList: classes(), style: { setProperty(name, value) { gridStyle[name] = value; } }, querySelector: () => grid, getBoundingClientRect: () => bounds };
  canvas.parentElement = container;
  const deviceMotion = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  const window = { innerWidth: width, innerHeight: height, location: { pathname: '/', origin: 'https://example.test' },
    matchMedia: () => deviceMotion, addEventListener: listen };
  const document = { hidden: false, documentElement: { classList: classes(), dataset: { studyMotion: motion } },
    querySelector: () => canvas, getElementById: () => quizPage ? {} : null,
    createElement: makeCanvas, contains: element => element === canvas,
    addEventListener: listen, removeEventListener() {} };
  vm.runInNewContext(source, {
    window, document, URL, console,
    ResizeObserver: class { constructor(callback) { resize = callback; } observe() {} disconnect() {} },
    IntersectionObserver: class { observe() {} disconnect() {} },
    MutationObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  return { canvas, bounds, window, document, frames, metrics, gridStyle, resize: () => resize(), fire,
    setQuiz: value => { quizPage = value; },
    advance() {
      for (let time = 100; time <= 1200; time += 100) {
        const pending = [...frames.values()]; frames.clear();
        pending.forEach(callback => callback(time));
      }
    },
    advanceSecond() {
      for (let time = 16; time <= 1000; time += 16) {
        const pending = [...frames.values()]; frames.clear();
        pending.forEach(callback => callback(time));
      }
    },
  };
}

test('long reading pages never allocate a document-sized animated canvas', () => {
  const page = mountBackground();
  assert.equal(page.canvas.width, 390);
  assert.equal(page.canvas.height, 844);
  page.bounds.height = 60000;
  page.resize();
  assert.equal(page.canvas.height, 844);
  assert.equal(page.window.__csVaultStudyBg.height, 844);
});

test('rotating and resizing a phone retains viewport-bounded canvas dimensions', () => {
  const page = mountBackground();
  page.window.innerWidth = page.bounds.width = 844;
  page.window.innerHeight = 390;
  page.resize();
  assert.equal(page.canvas.width, 844);
  assert.equal(page.canvas.height, 390);
  page.bounds.width = 240;
  page.bounds.height = 200;
  page.resize();
  assert.equal(page.canvas.width, 240);
  assert.equal(page.canvas.height, 200);
});

test('quiz navigation still collapses and stops the background, then resumes on return', () => {
  const page = mountBackground();
  page.fire('astro:before-preparation', { to: new URL('https://example.test/course/2026/quiz/practice/') });
  page.advance();
  assert.equal(page.window.__csVaultStudyBg.collapseProgress, 1);
  assert.equal(page.frames.size, 0);
  page.fire('astro:after-swap');
  page.advance();
  assert.equal(page.window.__csVaultStudyBg.collapseProgress, 0);
  assert.equal(page.frames.size, 1);
});

test('reduced-motion and initial quiz visits do not start the decorative animation loop', () => {
  assert.equal(mountBackground({ reduced: true }).frames.size, 0);
  assert.equal(mountBackground({ quiz: true }).frames.size, 0);
});

test('quiet appearance cancels canvas work and can resume without a reload', () => {
  const page = mountBackground({ motion: 'off' });
  assert.equal(page.frames.size, 0);
  page.document.documentElement.dataset.studyMotion = 'on';
  page.fire('cs-vault:motion-change');
  assert.equal(page.frames.size, 1);
  page.document.documentElement.dataset.studyMotion = 'off';
  page.fire('cs-vault:motion-change');
  assert.equal(page.frames.size, 0);
});

test('wide displays retain a bounded pixel grid and matching CSS texture', () => {
  const page = mountBackground({ width: 3840, height: 2160 });
  const cell = Number.parseInt(page.gridStyle['--study-grid-size'], 10);
  assert.ok(cell > 13);
  assert.ok(Math.ceil(page.canvas.width / cell) * Math.ceil(page.canvas.height / cell) <= 8000);
  page.window.innerWidth = page.bounds.width = 390;
  page.window.innerHeight = 844;
  page.resize();
  assert.equal(page.gridStyle['--study-grid-size'], '13px');
});

test('the restored background paints immediately and phones use a lower decorative frame budget', () => {
  const mobile = mountBackground();
  const desktop = mountBackground({ width: 1440, height: 900 });
  assert.ok(mobile.metrics.paints > 0);
  assert.ok(mobile.window.__csVaultStudyBg.waves.every(wave => wave.radius > 0));
  mobile.advanceSecond();
  desktop.advanceSecond();
  assert.ok(mobile.metrics.paints < desktop.metrics.paints);
  assert.ok(mobile.metrics.paints <= 14);
  assert.ok(desktop.metrics.paints <= 26);
});

test('hidden tabs and cached-page departures stop painting, then safely resume', () => {
  const page = mountBackground();
  page.document.hidden = true;
  page.fire('visibilitychange');
  assert.equal(page.frames.size, 0);
  page.document.hidden = false;
  page.fire('visibilitychange');
  assert.equal(page.frames.size, 1);
  page.fire('pagehide', { persisted: true });
  assert.equal(page.frames.size, 0);
  page.fire('pageshow', { persisted: true });
  assert.equal(page.frames.size, 1);
});
