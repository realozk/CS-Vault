import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpile((await readFile(new URL('../src/scripts/appearance-settings.ts', import.meta.url), 'utf8'))
  .replace(/^export \{\};\s*$/m, ''), { target: ts.ScriptTarget.ES2022 });

function mountSettings({ saved = null, reduced = false, blocked = false } = {}) {
  const listeners = new Map();
  const listen = (type, callback) => listeners.set(type, [...listeners.get(type) ?? [], callback]);
  const fire = (type, event = {}) => [...listeners.get(type) ?? []].forEach(callback => callback(event));
  const control = () => ({ checked: false, dataset: {}, listeners: [],
    addEventListener(_type, callback) { this.listeners.push(callback); },
    change(value) { this.checked = value; this.listeners.forEach(callback => callback()); } });
  let toggle = control();
  const status = { textContent: '', dataset: { storageMessage: 'Storage unavailable' },
    classList: { toggle(_name, hidden) { status.hidden = hidden; } } };
  const root = { dataset: { studyMotion: 'on' } };
  const media = { matches: reduced, addEventListener: listen };
  const writes = [];
  const emitted = [];
  vm.runInNewContext(source, {
    Event, document: { documentElement: root, addEventListener: listen,
      dispatchEvent: event => { emitted.push(event.type); fire(event.type, event); },
      getElementById: id => id === 'study-motion-toggle' ? toggle : status },
    window: { matchMedia: () => media, addEventListener: listen },
    localStorage: {
      getItem() { if (blocked) throw new Error('Denied'); return saved; },
      setItem(key, value) { if (blocked) throw new Error('Denied'); writes.push([key, value]); },
    },
  });
  return { root, media, status, writes, emitted, fire, get toggle() { return toggle; },
    replaceControl() { toggle = control(); } };
}

test('the original background is on by default while saved quiet mode and device preferences are respected', () => {
  assert.equal(mountSettings().root.dataset.studyMotion, 'on');
  assert.equal(mountSettings({ saved: 'off' }).root.dataset.studyMotion, 'off');
  assert.equal(mountSettings({ reduced: true }).root.dataset.studyMotion, 'off');
  const page = mountSettings({ saved: 'on' });
  assert.equal(page.root.dataset.studyMotion, 'on');
  assert.equal(page.toggle.checked, true);
  page.media.matches = true;
  page.fire('change');
  assert.equal(page.root.dataset.studyMotion, 'off');
  assert.equal(page.toggle.checked, true, 'Keep the choice while device reduced motion takes precedence');
  page.media.matches = false;
  page.fire('change');
  assert.equal(page.root.dataset.studyMotion, 'on');
});

test('changing motion persists one choice and notifies the canvas once', () => {
  const page = mountSettings();
  page.fire('astro:after-swap');
  page.fire('astro:page-load');
  page.toggle.change(false);
  assert.equal(page.toggle.listeners.length, 1);
  assert.deepEqual(page.writes, [['cs-vault-motion', 'off']]);
  assert.equal(page.root.dataset.studyMotion, 'off');
  assert.deepEqual(page.emitted, ['cs-vault:motion-change']);
});

test('blocked storage keeps a usable setting across replaced and restored pages', () => {
  const page = mountSettings({ blocked: true });
  page.toggle.change(true);
  assert.equal(page.root.dataset.studyMotion, 'on');
  assert.equal(page.status.hidden, false);
  const newDocument = { documentElement: { dataset: {} } };
  page.fire('astro:before-swap', { newDocument });
  assert.equal(newDocument.documentElement.dataset.studyMotion, 'on');
  page.replaceControl();
  page.fire('astro:after-swap');
  page.fire('astro:page-load');
  page.fire('pageshow');
  assert.equal(page.toggle.checked, true);
  assert.equal(page.toggle.listeners.length, 1);
  assert.equal(page.status.textContent, 'Storage unavailable');
});

test('settings follow changes from another tab and a cleared storage area restores the background', () => {
  const page = mountSettings({ saved: 'off' });
  page.fire('storage', { key: 'theme', newValue: 'on' });
  assert.equal(page.root.dataset.studyMotion, 'off');
  page.fire('storage', { key: 'cs-vault-motion', newValue: 'on' });
  assert.equal(page.toggle.checked, true);
  page.fire('storage', { key: null, newValue: null });
  assert.equal(page.root.dataset.studyMotion, 'on');
  assert.equal(page.toggle.checked, true);
});
