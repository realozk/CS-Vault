import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const classes = () => ({ add() {}, remove() {} });
test('blocked progress storage still updates the checkbox and progress bar', async () => {
  let onChange;
  const checkbox = { checked: false, dataset: { summaryCheck: 'chapter-01' }, getAttribute: () => 'chapter-01', addEventListener: (event, cb) => { if (event === 'change') onChange = cb; } };
  const nodes = {
    'subject-progress-card': { dataset: { subject: 'os', year: '2026' }, getAttribute: () => JSON.stringify({ progressStatus: '{checked}/{total}', storageUnavailable: 'Cannot save' }) },
    'subject-progress-fill': { style: {} },
    'progress-percentage-text': { textContent: '' },
    'progress-status-desc': { textContent: '' },
    'progress-storage-status': { textContent: '', classList: classes() },
  };
  const document = { readyState: 'complete', getElementById: id => nodes[id], querySelectorAll: selector => selector === '.summary-checkbox' ? [checkbox] : [], body: { getAttribute: () => null }, addEventListener() {} };
  const source = await readFile(new URL('../src/scripts/subject-dashboard.ts', import.meta.url), 'utf8');
  const dashboardSource = source.replace(/^import \{ bestScoreStorageKey, bestScoreTone, readBestScore \} from '\.\/quiz-state';\n/, '');
  for (const storage of [() => { throw new Error('Blocked getter'); }, () => ({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } })]) {
    const context = {
      document,
      console,
      setTimeout,
      window: { addEventListener() {} },
      bestScoreStorageKey: id => `cs-vault-best-score-v1:${id}`,
      bestScoreTone: () => 'green',
      readBestScore: () => null,
    };
    Object.defineProperty(context, 'localStorage', { get: storage });
    vm.runInNewContext(ts.transpile(dashboardSource, { target: ts.ScriptTarget.ES2022 }), context);
    checkbox.checked = true;
    assert.doesNotThrow(() => onChange());
    assert.equal(nodes['progress-percentage-text'].textContent, '100%');
    assert.equal(nodes['subject-progress-fill'].style.width, '100%');
    assert.equal(nodes['progress-storage-status'].textContent, 'Cannot save');
    checkbox.checked = false;
  }
});

test('theme initialization falls back to system theme when storage access throws', async () => {
  const layout = await readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
  const source = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
  let dark = false;
  const context = { window: { matchMedia: () => ({ matches: true }) }, document: { documentElement: { classList: { add: () => { dark = true; }, remove: () => { dark = false; } } } } };
  Object.defineProperty(context, 'localStorage', { get() { throw new Error('Blocked'); } });
  assert.doesNotThrow(() => vm.runInNewContext(source, context));
  assert.equal(dark, true);
});

test('course dashboard hides a stale best score after an answer correction with unchanged count', async () => {
  const { questionBankFingerprint, updateBestScore, bestScoreStorageKey, bestScoreTone, readBestScore } = await import('../src/scripts/quiz-state.ts');
  const bank = [{ id: 1, question: 'Which answer?', options: ['A','B'], correctAnswer: 'A' }];
  const stored = JSON.stringify(updateBestScore(null, 1, 1, questionBankFingerprint(bank)));
  const source = (await readFile(new URL('../src/scripts/subject-dashboard.ts', import.meta.url), 'utf8'))
    .replace(/^import \{ bestScoreStorageKey, bestScoreTone, readBestScore \} from '\.\/quiz-state';\n/, '');
  for (const changed of [false,true]) {
    const set = new Set(['hidden']);
    const badge = { textContent: '', dataset: { bestScore:'os/2026/quiz', bestScoreTotal:'1', bestScoreFingerprint:questionBankFingerprint(changed ? [{ ...bank[0], correctAnswer:'B' }] : bank) },
      classList: { add: (...values) => values.forEach(value => set.add(value)), remove: (...values) => values.forEach(value => set.delete(value)) } };
    const document = { readyState:'complete', getElementById:() => null, querySelectorAll:selector => selector === '[data-best-score]' ? [badge] : [], body:{getAttribute:() => null}, addEventListener() {} };
    const context = { document, console, setTimeout, window:{addEventListener() {}}, localStorage:{getItem:() => stored}, bestScoreStorageKey,bestScoreTone,readBestScore };
    vm.runInNewContext(ts.transpile(source,{target:ts.ScriptTarget.ES2022}),context);
    assert.equal(set.has('hidden'), changed);
    assert.equal(badge.textContent, changed ? '' : 'Best score: 1/1 (100%)');
  }
});
