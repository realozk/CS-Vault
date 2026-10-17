import test from 'node:test';
import assert from 'node:assert/strict';
import { createAllQuestionsQuiz } from '../src/lib/quiz-routes.ts';

test('combined practice keeps its collection year without claiming one source edition', () => {
  const entries = ['2023–2024', '2024–2025'].map((sourceAcademicYear, index) => ({
    id: `operating-systems/2026/practice-${index + 1}`,
    collection: 'quizzes',
    data: {
      title: `Practice ${index + 1}`,
      date: new Date('2026-10-01'),
      subject: 'Operating Systems',
      year: 2026,
      year_level: 3,
      semester: 1,
      sourceAcademicYear,
      sourceTerm: `Term ${index + 1}`,
      updatedAt: new Date('2026-10-17'),
      sourceKind: 'provided',
      questions: [{
        id: 1,
        question: `Question from source ${index + 1}`,
        options: ['A', 'B'],
        correctAnswer: 'A',
      }],
    },
  }));

  const combined = createAllQuestionsQuiz(entries);

  assert.equal(combined.id, 'operating-systems/2026/all-questions');
  assert.equal(combined.data.year, 2026);
  assert.equal(combined.data.questions.length, 2);
  assert.equal(combined.data.sourceAcademicYear, undefined);
  assert.equal(combined.data.sourceTerm, undefined);
  assert.equal(combined.data.updatedAt, undefined);
  assert.equal(entries[0].data.sourceAcademicYear, '2023–2024');
});
