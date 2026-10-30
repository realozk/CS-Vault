import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { getPracticeQuestions, prepareQuestionOptions } from '../src/lib/quiz-questions.ts';
import * as quizState from '../src/scripts/quiz-state.ts';

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    this.children = [];
    this.listeners = new Map();
    this.style = {};
    this.disabled = false;
    const classes = new Set();
    this.classList = {
      add: (...values) => values.forEach(value => classes.add(value)),
      remove: (...values) => values.forEach(value => classes.delete(value)),
      contains: value => classes.has(value),
      toggle: (value, force = !classes.has(value)) => { if (force) classes.add(value); else classes.delete(value); return force; },
    };
  }
  get textContent() { return this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this.children = value ? [{ textContent: String(value) }] : []; }
  addEventListener(event, handler, { signal } = {}) {
    this.listeners.set(event, handler);
    signal?.addEventListener('abort', () => {
      if (this.listeners.get(event) === handler) this.listeners.delete(event);
    }, { once: true });
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelectorAll(selector) { return selector === 'button' ? this.children.filter(child => child.tagName === 'BUTTON') : []; }
  setAttribute(name, value) { this[name] = value; }
  removeAttribute(name) { delete this[name]; }
  focus() {}
  scrollIntoView() {}
  reportValidity() { return true; }
  click() { if (!this.disabled) this.listeners.get('click')?.({ target: this }); }
}

async function mountQuiz(questions, { saved = [], lang = 'en', mode = 'practice', originUrls = {}, failWrites = false, failReads = false, localValues: storedLocalValues, sessionValues: storedSessionValues } = {}) {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, new Element(id.includes('-btn') ? 'button' : 'div'));
    return nodes.get(id);
  };
  const quizId = 'programming-languages/2026/all-questions';
  const reviewKey = `cs-vault-review-v1:${quizId}`;
  const attemptKey = `cs-vault-attempt-v1:${quizId}`;
  const localValues = storedLocalValues ?? new Map([[reviewKey, JSON.stringify(saved)]]);
  const sessionValues = storedSessionValues ?? new Map();
  const storage = (values, blocked = false, blockedReads = false) => ({ getItem: key => { if (blockedReads) throw new Error('Storage blocked'); return values.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw new Error('Quota exceeded'); values.set(key, value); }, removeItem: key => values.delete(key) });
  const listeners = { document: new Map(), window: new Map() };
  const listen = target => (event, handler, { signal } = {}) => {
    listeners[target].set(event, [...(listeners[target].get(event) || []), handler]);
    signal?.addEventListener('abort', () => {
      listeners[target].set(event, listeners[target].get(event).filter(callback => callback !== handler));
    }, { once: true });
  };
  const fire = (target, event, detail = {}) => listeners[target].get(event)?.forEach(handler => handler(detail));
  const modes = ['practice', 'exam'].map(value => Object.assign(new Element('input'), { value, checked: value === mode }));
  const widget = node('quiz-widget');
  widget.dataset = {
    quizId,
    quiz: JSON.stringify({ title: 'Combined practice', subject: 'Programming Languages', year: 2026, lang, questions }),
    translations: JSON.stringify({ reviewCount: '{saved} saved questions · {due} due now', noSaved: 'No saved mistakes', originalQuestion: 'Original quiz · question {id}', sourcePage: 'Source page: {page}' }),
    originUrls: JSON.stringify(originUrls),
  };
  widget.querySelectorAll = () => modes;
  widget.querySelector = selector => selector.includes(':checked')
    ? modes.find(input => input.checked)
    : modes.find(input => selector.includes(`value="${input.value}"`));
  node('quiz-use-timer').checked = true;
  node('quiz-minutes').value = '20';
  const context = {
    ...quizState, getPracticeQuestions, prepareQuestionOptions, AbortController,
    document: {
      readyState: 'complete', hidden: false, body: new Element('body'),
      getElementById: node, querySelector: () => null, createElement: tag => new Element(tag), createTextNode: textContent => ({ textContent }), addEventListener: listen('document'),
    },
    window: { addEventListener: listen('window') },
    localStorage: storage(localValues, failWrites, failReads), sessionStorage: storage(sessionValues),
    setInterval: () => 1, clearInterval() {},
  };
  const source = (await readFile(new URL('../src/scripts/quiz.ts', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  vm.runInNewContext(ts.transpile(source, { target: ts.ScriptTarget.ES2022 }), context);
  return { node, localValues, sessionValues, reviewKey, attemptKey, fire };
}

const question = id => ({ id, question: `Question ${id}?`, options: ['Yes', 'No'], correctAnswer: 'Yes' });

test('saved review opens at most five earliest-due questions as practice even when exam is selected', async () => {
  const questions = Array.from({ length: 8 }, (_, index) => question(index + 1));
  const now = Date.now();
  const saved = questions.map(q => ({ id: q.id, signature: quizState.questionSignature(q), dueAt: now - q.id * quizState.DAY_MS, streak: 0 }));
  const widget = await mountQuiz(questions, { saved, mode: 'exam' });
  assert.equal(widget.node('quiz-saved-count').textContent, '8 saved questions · 8 due now');
  widget.node('quiz-review-saved-btn').click();
  const attempt = JSON.parse(widget.sessionValues.get(widget.attemptKey));
  assert.equal(attempt.short, true);
  assert.equal(attempt.examMode, false);
  assert.equal(attempt.deadline, null);
  assert.deepEqual(attempt.questions.map(q => q.id).sort(), [4, 5, 6, 7, 8]);
  widget.node('quiz-settings-btn').click();
  widget.node('quiz-clear-saved-btn').click();
  assert.equal(widget.node('quiz-saved-count').textContent, 'No saved mistakes');
  assert.equal(widget.node('quiz-review-saved-btn').disabled, true);
  assert.deepEqual(JSON.parse(widget.localValues.get(widget.reviewKey)), []);
});

test('quota failure retains new mistakes for the current visit after visibility refresh and reopening review', async () => {
  const questions = [question(1), question(2)];
  const widget = await mountQuiz(questions, { failWrites: true });
  widget.node('start-quiz-btn').click();
  for (let index = 0; index < questions.length; index++) {
    widget.node('quiz-options-container').children.find(choice => choice.dataset.option === 'No').click();
    widget.node('quiz-next-btn').click();
  }
  assert.match(widget.node('quiz-saved-count').textContent, /^2 saved questions/);
  assert.deepEqual(JSON.parse(widget.localValues.get(widget.reviewKey)), []);
  widget.fire('document', 'visibilitychange');
  assert.match(widget.node('quiz-saved-count').textContent, /^2 saved questions/);
  widget.node('quiz-settings-btn').click();
  widget.node('quiz-review-saved-btn').click();
  assert.equal(JSON.parse(widget.sessionValues.get(widget.attemptKey)).questions.length, 2);
});

test('failed clearing never resurrects saved mistakes on reload and unrelated external additions merge with local changes', async () => {
  const questions = [question(1), question(2)];
  const first = { id: 1, signature: quizState.questionSignature(questions[0]), dueAt: Date.now() - 1, streak: 0 };
  const widget = await mountQuiz(questions, { saved: [first], failWrites: true });
  widget.node('quiz-clear-saved-btn').click();
  widget.fire('document', 'visibilitychange');
  widget.fire('window', 'storage', { key: widget.reviewKey });
  assert.equal(widget.node('quiz-saved-count').textContent, 'No saved mistakes');
  assert.equal(widget.node('quiz-review-saved-btn').disabled, true);
  assert.deepEqual(JSON.parse(widget.localValues.get(widget.reviewKey)), [first]);

  const merging = await mountQuiz(questions, { failWrites: true });
  merging.node('start-quiz-btn').click();
  const attempt = JSON.parse(merging.sessionValues.get(merging.attemptKey));
  // Make only question 1 wrong, regardless of the randomized display order.
  for (const q of attempt.questions) {
    merging.node('quiz-options-container').children.find(choice => choice.dataset.option === (q.id === 1 ? 'No' : 'Yes')).click();
    merging.node('quiz-next-btn').click();
  }
  const second = { id: 2, signature: quizState.questionSignature(questions[1]), dueAt: Date.now() - 1, streak: 0 };
  merging.localValues.set(merging.reviewKey, JSON.stringify([second]));
  merging.fire('window', 'storage', { key: merging.reviewKey });
  assert.match(merging.node('quiz-saved-count').textContent, /^2 saved questions/);
  merging.node('quiz-settings-btn').click();
  merging.node('quiz-review-saved-btn').click();
  assert.deepEqual(JSON.parse(merging.sessionValues.get(merging.attemptKey)).questions.map(q => q.id).sort(), [1, 2]);
});

test('source-position choices retain their original displayed order in full and restored sessions', async () => {
  const q = { ...question(1), options: ['First statement', 'Second statement', 'Both A and B'], correctAnswer: 'Both A and B' };
  const widget = await mountQuiz([q]);
  widget.node('start-quiz-btn').click();
  const attempt = JSON.parse(widget.sessionValues.get(widget.attemptKey));
  assert.deepEqual(attempt.questions[0].options, q.options);
  assert.deepEqual(widget.node('quiz-options-container').children.map(choice => choice.dataset.option), q.options);
  assert.notEqual(quizState.readAttempt(JSON.stringify(attempt), [q]), null);
});

test('disputed questions cannot enter full sessions, saved review, or the stored score', async () => {
  const bank = [question(1), { ...question(22), status: 'disputed', reviewNote: 'Awaiting clarification.' }];
  const saved = [{ id: 22, signature: quizState.questionSignature(bank[1]), dueAt: Date.now() - 1, streak: 0 }];
  const widget = await mountQuiz(bank, { saved });
  assert.equal(widget.node('quiz-review-saved-btn').disabled, true);
  widget.node('start-quiz-btn').click();
  let attempt = JSON.parse(widget.sessionValues.get(widget.attemptKey));
  assert.deepEqual(attempt.questions.map(q => q.id), [1]);
  const option = widget.node('quiz-options-container').children.find(choice => choice.dataset.option === 'Yes');
  option.click();
  widget.node('quiz-next-btn').click();
  assert.equal(widget.node('quiz-score-ratio').textContent, '1/1');
  const best = JSON.parse(widget.localValues.get(quizState.bestScoreStorageKey('programming-languages/2026/all-questions')));
  assert.equal(best.total, 1);
  assert.equal(best.fingerprint, quizState.questionBankFingerprint([bank[0]]));
});

test('combined explanations and mistakes retain filename, original ID, localized source link, and Arabic direction', async () => {
  const sourceId = 'programming-languages/2026/tutorial';
  const q = { ...question(5), question: 'ما الإجابة؟', sourcePage: 4, explanation: 'شرح الإجابة', origin: { quizId: sourceId, questionId: 22, title: 'Original tutorial', source: 'Tutorial.pdf', lang: 'ar' } };
  const widget = await mountQuiz([q], { originUrls: { [sourceId]: '/CS-Vault/ar/programming-languages/2026/quiz/tutorial/' } });
  widget.node('start-quiz-btn').click();
  assert.equal(widget.node('quiz-question-content').dir, 'rtl');
  widget.node('quiz-options-container').children.find(choice => choice.dataset.option === 'No').click();
  assert.equal(widget.node('quiz-source-slide').textContent, 'Tutorial.pdf · Source page: 4');
  assert.equal(widget.node('quiz-origin').children[0].href, '/CS-Vault/ar/programming-languages/2026/quiz/tutorial/');
  assert.equal(widget.node('quiz-origin').children[0].textContent, 'Original quiz · question 22 — Original tutorial');
  widget.node('quiz-next-btn').click();
  const card = widget.node('quiz-mistake-list').children[0];
  assert.equal(card.dir, 'rtl');
  assert.equal(card.lang, 'ar');
  assert.ok(card.children.some(child => child.textContent === 'Tutorial.pdf · Source page: 4'));
  assert.ok(card.children.some(child => child.children?.[0]?.href === '/CS-Vault/ar/programming-languages/2026/quiz/tutorial/'));
});

test('unfinished quizzes resume across visits while disputed questions stay outside progress and scoring', async () => {
  const questions = [question(1), question(2), { ...question(22), status: 'disputed', reviewNote: 'Awaiting clarification.' }];
  const first = await mountQuiz(questions);
  first.node('start-quiz-btn').click();
  first.node('quiz-options-container').children.find(choice => choice.dataset.option === 'Yes').click();
  first.node('quiz-next-btn').click();
  const original = JSON.parse(first.localValues.get(first.attemptKey));
  const resumed = await mountQuiz(questions, { localValues: first.localValues });
  assert.equal(resumed.node('quiz-resume-screen').classList.contains('hidden'), false);
  assert.equal(resumed.node('quiz-resume-solved').textContent, '1');
  assert.equal(resumed.node('quiz-resume-left').textContent, '1');
  assert.equal(resumed.node('quiz-resume-correct').textContent, '1');
  resumed.node('quiz-continue-btn').click();
  const continued = JSON.parse(resumed.sessionValues.get(resumed.attemptKey));
  assert.deepEqual(continued.questions, original.questions);
  assert.deepEqual(continued.answers, original.answers);
  resumed.node('quiz-options-container').children.find(choice => choice.dataset.option === 'Yes').click();
  resumed.node('quiz-next-btn').click();
  assert.equal(resumed.node('quiz-score-ratio').textContent, '2/2');
});

test('language switching preserves results without applying saved-review updates twice', async () => {
  const questions = [question(1)];
  const first = await mountQuiz(questions);
  first.node('start-quiz-btn').click();
  first.node('quiz-options-container').children.find(choice => choice.dataset.option === 'No').click();
  first.node('quiz-next-btn').click();
  const reviewBefore = first.localValues.get(first.reviewKey);
  first.fire('document', 'astro:before-preparation', {
    from: new URL('https://example.test/CS-Vault/programming-languages/2026/quiz/all-questions/'),
    to: new URL('https://example.test/CS-Vault/ar/programming-languages/2026/quiz/all-questions/'),
  });
  const arabic = await mountQuiz(questions, { lang: 'ar', localValues: first.localValues, sessionValues: first.sessionValues });
  assert.equal(arabic.node('quiz-result-screen').classList.contains('hidden'), false);
  assert.equal(arabic.node('quiz-score-ratio').textContent, '0/1');
  assert.equal(arabic.localValues.get(arabic.reviewKey), reviewBefore);
});

test('resume falls back to session storage when local storage reads and writes are blocked', async () => {
  const questions = [question(1), question(2)];
  const first = await mountQuiz(questions, { failWrites: true });
  first.node('start-quiz-btn').click();
  first.node('quiz-options-container').children.find(choice => choice.dataset.option === 'Yes').click();
  first.node('quiz-next-btn').click();
  const resumed = await mountQuiz(questions, { failReads: true, failWrites: true, sessionValues: first.sessionValues });
  assert.equal(resumed.node('quiz-resume-screen').classList.contains('hidden'), false);
  assert.equal(resumed.node('quiz-resume-solved').textContent, '1');
  resumed.node('quiz-continue-btn').click();
  assert.equal(JSON.parse(resumed.sessionValues.get(resumed.attemptKey)).answers.length, 1);
});

test('page swaps release quiz handlers and allow the widget to initialize again once', async () => {
  const mounted = await mountQuiz([question(1)]);
  mounted.fire('document', 'astro:before-swap');
  assert.equal(mounted.node('quiz-widget').dataset.quizBound, undefined);
  mounted.node('start-quiz-btn').click();
  assert.equal(mounted.sessionValues.has(mounted.attemptKey), false);
  mounted.fire('document', 'astro:after-swap');
  mounted.node('start-quiz-btn').click();
  assert.equal(JSON.parse(mounted.sessionValues.get(mounted.attemptKey)).questions.length, 1);
});

test('active quizzes survive language switches when equivalent routes differ by a trailing slash', async () => {
  for (const [from, to] of [
    ['/CS-Vault/programming-languages/2026/quiz/all-questions', '/CS-Vault/ar/programming-languages/2026/quiz/all-questions/'],
    ['/CS-Vault/ar/programming-languages/2026/quiz/all-questions/', '/CS-Vault/programming-languages/2026/quiz/all-questions'],
  ]) {
    const questions = [question(1), question(2)];
    const first = await mountQuiz(questions);
    first.node('start-quiz-btn').click();
    first.node('quiz-options-container').children.find(choice => choice.dataset.option === 'Yes').click();
    first.node('quiz-next-btn').click();
    const before = JSON.parse(first.sessionValues.get(first.attemptKey));
    first.fire('document', 'astro:before-preparation', { from: new URL(from, 'https://example.test'), to: new URL(to, 'https://example.test') });
    const switched = await mountQuiz(questions, { localValues: first.localValues, sessionValues: first.sessionValues });
    assert.equal(switched.node('quiz-active-screen').classList.contains('hidden'), false);
    assert.equal(switched.node('quiz-resume-screen').classList.contains('hidden'), true);
    assert.equal(switched.node('quiz-current-question-num').textContent, '2');
    assert.deepEqual(JSON.parse(switched.sessionValues.get(switched.attemptKey)), before);
  }
});
