import test from 'node:test';
import assert from 'node:assert/strict';
import { canShuffleOptions, prepareQuestionOptions } from '../src/lib/quiz-questions.ts';
import { questionSignature, readAttempt } from '../src/scripts/quiz-state.ts';

const question = overrides => ({ id: 1, question: 'Which is correct?', options: ['One', 'Two', 'Three'], correctAnswer: 'One', ...overrides });

test('source position references and existing option labels retain authored order', () => {
  for (const option of ['Both A and B', 'A and C', 'A, B and C', 'All of the above', 'None of the above', 'Both of the above', 'Neither A nor B', 'Option A', 'The first option', 'جميع ما سبق', 'لا شيء مما سبق']) {
    const q = question({ options: ['One', 'Two', option] });
    assert.equal(canShuffleOptions(q), false, option);
    assert.deepEqual(prepareQuestionOptions(q, () => { throw new Error('Fixed choices must not be shuffled.'); }), q.options);
  }
  for (const options of [['A. One', 'B. Two', 'C. Three'], ['(a) One', '(b) Two', '(c) Three'], ['A) One', 'B) Two']]) {
    assert.equal(canShuffleOptions(question({ options })), false);
  }
  assert.equal(canShuffleOptions(question({ question: 'Which statements are described by options A and B?' })), false);
  assert.equal(canShuffleOptions(question({ shuffleOptions: false })), false);
  assert.equal(canShuffleOptions(question({ shuffleOptions: true, options: ['One', 'All of the above'] })), false);
});

test('ordinary choices still shuffle and programming language C or prose does not imply a positional reference', () => {
  const reverse = options => [...options].reverse();
  for (const q of [question(), question({ options: ['C', 'C++', 'Java'] }), question({ question: 'For a fixed input, compare f and g.', options: ['A compiler', 'An interpreter', 'C and C++'] })]) {
    assert.equal(canShuffleOptions(q), true);
    assert.deepEqual(prepareQuestionOptions(q, reverse), [...q.options].reverse());
  }
  const fixed = question({ shuffleOptions: false });
  assert.notEqual(prepareQuestionOptions(fixed, reverse), fixed.options);
});

test('fixed-order content changes invalidate saved answers and attempts cannot restore shuffled fixed choices', () => {
  const q = question({ shuffleOptions: false });
  const reordered = { ...q, options: [...q.options].reverse() };
  assert.notEqual(questionSignature(q), questionSignature(reordered));
  assert.equal(questionSignature(question()), questionSignature(question({ options: ['Three', 'Two', 'One'] })));
  const attempt = { version: 1, phase: 'active', examMode: false, short: false, currentIndex: 0, deadline: null, expired: false, questions: [{ id: q.id, signature: questionSignature(q), options: q.options }], answers: [] };
  assert.notEqual(readAttempt(JSON.stringify(attempt), [q]), null);
  attempt.questions[0].options = reordered.options;
  assert.equal(readAttempt(JSON.stringify(attempt), [q]), null);
  assert.equal(readAttempt(JSON.stringify(attempt), [reordered]), null);
});
