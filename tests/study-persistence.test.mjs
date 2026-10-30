import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import * as pomodoro from '../src/scripts/pomodoro-state.ts';

const progressKey = 'cs-vault-progress-os-2026';
const timerKey = 'cs-vault-pomodoro-v1';
const dashboardSource = ts.transpile((await readFile(new URL('../src/scripts/subject-dashboard.ts', import.meta.url), 'utf8'))
  .replace(/^import .* from '\.\/quiz-state';\n/, ''), { target: ts.ScriptTarget.ES2022 });
const timerSource = ts.transpile((await readFile(new URL('../src/scripts/pomodoro.ts', import.meta.url), 'utf8'))
  .replace(/^import .* from '\.\/pomodoro-state';\n/, ''), { target: ts.ScriptTarget.ES2022 });

function eventTarget(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || [];
      callbacks.push(callback);
      listeners.set(type, callbacks);
    },
    dispatchEvent(event) {
      for (const callback of listeners.get(event.type) || []) callback(event);
      return true;
    },
  };
}

function element(extra = {}) {
  const classNames = new Set();
  const attributes = new Map();
  let text = '';
  const node = eventTarget({
    dataset: {}, style: {}, children: [], value: '',
    classList: {
      add: (...names) => names.forEach(name => classNames.add(name)),
      remove: (...names) => names.forEach(name => classNames.delete(name)),
      contains: name => classNames.has(name),
      toggle(name, force = !classNames.has(name)) {
        if (force) classNames.add(name);
        else classNames.delete(name);
      },
    },
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: name => attributes.get(name) ?? null,
    removeAttribute: name => attributes.delete(name),
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; text = ''; },
    querySelector(selector) { return this.children.find(child => child.className?.split(' ').includes(selector.slice(1))) ?? null; },
    focus() {}, contains: () => false,
    ...extra,
  });
  Object.defineProperty(node, 'textContent', {
    get: () => node.children.length ? node.children.map(child => child.textContent).join('') : text,
    set: value => { text = String(value); node.children = []; },
  });
  return node;
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values, failReads: false, failWrites: false, writes: 0,
    getItem(key) {
      if (this.failReads) throw new Error('Storage blocked');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (this.failWrites) throw new Error('Quota exceeded');
      values.set(key, value);
      this.writes++;
    },
  };
}

function dashboard(saved, enhanced = false) {
  const slugs = ['chapter-01', 'chapter-02'];
  const checkboxes = slugs.map(slug => element({
    checked: false, dataset: { summaryCheck: slug },
    getAttribute: () => slug,
  }));
  const tabs = slugs.map(slug => element({ dataset: { summarySlug: slug } }));
  const contents = slugs.map(slug => element({ id: `summary-content-${slug}`, scrollIntoView() {} }));
  const modeButtons = ['quizzes', 'summaries'].map(mode => element({ dataset: { studyMode: mode } }));
  const modePanels = ['quizzes', 'summaries'].map(mode => element({ dataset: { studyPanel: mode } }));
  const nodes = Object.fromEntries(['subject-progress-card', 'subject-progress-fill', 'progress-percentage-text', 'progress-status-desc', 'progress-storage-status'].map(id => [id, element()]));
  if (enhanced) {
    nodes['subject-page'] = element({ dataset: { defaultStudyMode: 'quizzes' } });
    nodes['subject-mode-switch'] = element();
    contents.forEach(content => { nodes[content.id] = content; });
  }
  nodes['subject-progress-card'].dataset = { subject: 'os', year: '2026' };
  nodes['subject-progress-card'].getAttribute = () => JSON.stringify({ progressStatus: '{checked}/{total}', storageUnavailable: 'Cannot save' });
  const location = { hash: '' };
  const window = eventTarget({ location, history: { pushState: (_state, _unused, hash) => { location.hash = hash; } }, matchMedia: () => ({ matches: true }) });
  const document = eventTarget({
    readyState: 'complete', body: element(), getElementById: id => nodes[id] || null,
    querySelectorAll: selector => ({
      '.summary-checkbox': checkboxes, '.summary-tab-btn': tabs,
      '.summary-content-block': enhanced ? contents : [],
      '[data-study-mode]': enhanced ? modeButtons : [],
      '[data-study-panel]': enhanced ? modePanels : [],
    })[selector] || [],
  });
  vm.runInNewContext(dashboardSource, { document, window, localStorage: saved, console, setTimeout, Event, requestAnimationFrame: callback => callback() });
  return {
    window, nodes, checkboxes, tabs, modeButtons,
    check(index, checked) {
      checkboxes[index].checked = checked;
      checkboxes[index].dispatchEvent({ type: 'change' });
    },
  };
}

test('summary edits reconcile tabs before writes and refresh cached/language pages without losing removals', () => {
  const saved = storage();
  const english = dashboard(saved);
  const arabic = dashboard(saved);
  english.check(0, true);
  // No storage event has reached this stale tab yet.
  arabic.check(1, true);
  assert.deepEqual(JSON.parse(saved.getItem(progressKey)), ['chapter-01', 'chapter-02']);
  english.window.dispatchEvent({ type: 'pageshow', persisted: true });
  assert.equal(english.nodes['progress-percentage-text'].textContent, '100%');
  assert.ok(english.checkboxes.every(input => input.checked));
  arabic.check(0, false);
  english.window.dispatchEvent({ type: 'storage', key: progressKey });
  assert.deepEqual(english.checkboxes.map(input => input.checked), [false, true]);
  assert.equal(english.tabs[0].classList.contains('is-reviewed'), false);
  assert.equal(english.nodes['progress-status-desc'].textContent, '1/2');
  const reloadedLanguagePage = dashboard(saved);
  assert.deepEqual(reloadedLanguagePage.checkboxes.map(input => input.checked), [false, true]);
  saved.values.clear();
  english.window.dispatchEvent({ type: 'storage', key: null });
  assert.deepEqual(english.checkboxes.map(input => input.checked), [false, false]);
  arabic.check(0, true);
  assert.deepEqual(JSON.parse(saved.getItem(progressKey)), ['chapter-01']);
});

test('summary mode retains the selected deep link and notifies language links after pushState', () => {
  const page = dashboard(storage(), true);
  let locationChanges = 0;
  page.window.addEventListener('locationchange', () => locationChanges++);
  const click = { type: 'click', button: 0, preventDefault() {} };
  page.tabs[1].dispatchEvent(click);
  assert.equal(page.window.location.hash, '#summary-content-chapter-02');
  page.modeButtons[0].dispatchEvent(click);
  assert.equal(page.window.location.hash, '#subject-quizzes');
  page.modeButtons[1].dispatchEvent(click);
  assert.equal(page.window.location.hash, '#summary-content-chapter-02');
  assert.equal(page.tabs[1].getAttribute('aria-current'), 'true');
  assert.equal(locationChanges, 3);
});

test('summary fallback keeps multiple unsaved edits and unchecks across refreshes, then saves after recovery', () => {
  for (const failReads of [false, true]) {
    const saved = storage();
    saved.failReads = failReads;
    saved.failWrites = true;
    const page = dashboard(saved);
    page.check(0, true);
    page.check(1, true);
    page.window.dispatchEvent({ type: 'pageshow' });
    assert.equal(page.nodes['progress-percentage-text'].textContent, '100%');
    page.check(0, false);
    page.window.dispatchEvent({ type: 'storage', key: null });
    assert.deepEqual(page.checkboxes.map(input => input.checked), [false, true]);
    assert.equal(page.nodes['progress-storage-status'].textContent, 'Cannot save');
    saved.failReads = false;
    saved.failWrites = false;
    page.check(0, true);
    assert.deepEqual(JSON.parse(saved.getItem(progressKey)), ['chapter-01', 'chapter-02']);
    assert.equal(page.nodes['progress-storage-status'].classList.contains('hidden'), true);
  }
});

function timer(saved, clock, locks) {
  const names = ['widget', 'panel', 'open', 'phase', 'time', 'study-minutes', 'break-minutes', 'toggle', 'reset', 'skip', 'storage-status', 'notice'];
  const nodes = Object.fromEntries(names.map(name => [`pomodoro-${name}`, element()]));
  nodes['pomodoro-widget'].dataset.translations = JSON.stringify(Object.fromEntries([
    'storageUnavailable', 'studyPhase', 'breakPhase', 'start', 'pause', 'breakStarted', 'studyReady',
  ].map(key => [key, key])));
  let interval;
  const window = eventTarget({ navigator: { locks }, setInterval: callback => { interval = callback; }, clearInterval() {} });
  const document = eventTarget({ readyState: 'complete', getElementById: id => nodes[id], createElement: () => element() });
  vm.runInNewContext(timerSource, {
    ...pomodoro, document, window, localStorage: saved, AbortController,
    Date: { now: () => clock.now }, console: { warn() {} },
  });
  return {
    nodes, window, tick: () => interval(),
    click(name) { nodes[`pomodoro-${name}`].dispatchEvent({ type: 'click' }); },
    change(name, value) {
      nodes[`pomodoro-${name}-minutes`].value = String(value);
      nodes[`pomodoro-${name}-minutes`].dispatchEvent({ type: 'change' });
    },
  };
}

test('changing the inactive Pomodoro duration preserves running and paused time in both phases', () => {
  const clock = { now: 1_800_000_000_000 };
  for (const phase of ['study', 'break']) {
    for (const running of [true, false]) {
      const initial = { ...pomodoro.createDefaultPomodoroState(), phase, remainingSeconds: 120, deadline: running ? clock.now + 120_000 : null };
      const saved = storage({ [timerKey]: JSON.stringify(initial) });
      const page = timer(saved, clock);
      const inactivePhase = phase === 'study' ? 'break' : 'study';
      page.change(inactivePhase, 15);
      const changed = JSON.parse(saved.getItem(timerKey));
      assert.equal(changed.deadline, initial.deadline);
      assert.equal(changed.remainingSeconds, initial.remainingSeconds);
      assert.equal(changed[`${inactivePhase}Minutes`], 15);
      assert.equal(page.nodes['pomodoro-time'].textContent, '02:00');
    }
  }
});

test('Pomodoro synchronizes stale tabs before actions and refreshes on pageshow/storage clear', () => {
  const saved = storage();
  const clock = { now: 1_800_000_000_000 };
  const first = timer(saved, clock);
  const second = timer(saved, clock);
  first.click('toggle');
  clock.now += 120_000;
  // The second tab still displays Start, but its click pauses the shared timer.
  second.click('toggle');
  let shared = JSON.parse(saved.getItem(timerKey));
  assert.equal(shared.deadline, null);
  assert.equal(shared.remainingSeconds, 48 * 60);
  first.window.dispatchEvent({ type: 'pageshow', persisted: true });
  assert.equal(first.nodes['pomodoro-time'].textContent, '48:00');
  assert.equal(first.nodes['pomodoro-toggle'].textContent, 'start');
  second.change('break', 15);
  first.click('toggle');
  shared = JSON.parse(saved.getItem(timerKey));
  assert.equal(shared.breakMinutes, 15);
  assert.equal(shared.deadline, clock.now + 48 * 60_000);
  saved.values.clear();
  first.window.dispatchEvent({ type: 'storage', key: null });
  assert.equal(first.nodes['pomodoro-time'].textContent, '50:00');
  assert.equal(first.nodes['pomodoro-toggle'].textContent, 'start');
  assert.equal(first.nodes['pomodoro-break-minutes'].value, '10');
});

test('only one tab completes a shared expired phase, including with browser transition locks', async () => {
  for (const locks of [undefined, { request: (_key, _options, callback) => Promise.resolve().then(() => callback({})) }]) {
    const clock = { now: 1_800_000_000_000 };
    const initial = { ...pomodoro.createDefaultPomodoroState(), deadline: clock.now + 1000 };
    const saved = storage({ [timerKey]: JSON.stringify(initial) });
    const first = timer(saved, clock, locks);
    const second = timer(saved, clock, locks);
    clock.now += 1000;
    first.tick();
    second.tick();
    await new Promise(resolve => setImmediate(resolve));
    second.tick();
    assert.equal(saved.writes, 1);
    assert.equal(JSON.parse(saved.getItem(timerKey)).deadline, initial.deadline + 600_000);
    assert.equal(first.nodes['pomodoro-phase'].textContent, 'breakPhase');
    assert.equal(second.nodes['pomodoro-phase'].textContent, 'breakPhase');
  }
});

test('Pomodoro keeps its in-memory timer when browser reads or writes are blocked', () => {
  for (const failReads of [false, true]) {
    const clock = { now: 1_800_000_000_000 };
    const saved = storage();
    saved.failReads = failReads;
    saved.failWrites = true;
    const page = timer(saved, clock);
    page.click('toggle');
    clock.now += 1000;
    page.tick();
    assert.equal(page.nodes['pomodoro-time'].textContent, '49:59');
    page.change('break', 15);
    page.window.dispatchEvent({ type: 'pageshow' });
    assert.equal(page.nodes['pomodoro-time'].textContent, '49:59');
    page.click('toggle');
    clock.now += 1000;
    page.tick();
    assert.equal(page.nodes['pomodoro-time'].textContent, '49:59');
    assert.equal(page.nodes['pomodoro-toggle'].textContent, 'start');
    assert.equal(page.nodes['pomodoro-storage-status'].textContent, 'storageUnavailable');
  }
});

test('expired Pomodoro snapshots advance from their deadlines and stop after an overdue break', () => {
  const initial = { ...pomodoro.createDefaultPomodoroState(), deadline: 1000 };
  assert.equal(pomodoro.advancePomodoroState(initial, 999), initial);
  const activeBreak = pomodoro.advancePomodoroState(initial, 2000);
  assert.equal(activeBreak.phase, 'break');
  assert.equal(activeBreak.deadline, 601_000);
  const studyReady = pomodoro.advancePomodoroState(initial, 700_000);
  assert.equal(studyReady.phase, 'study');
  assert.equal(studyReady.deadline, null);
  assert.equal(studyReady.remainingSeconds, 3000);
  assert.deepEqual(pomodoro.advancePomodoroState(initial, 701_000), studyReady);
});
