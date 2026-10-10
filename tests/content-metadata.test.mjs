import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContentMetadata } from '../src/lib/content-metadata.ts';
const course = { slug: 'operating-systems', name: 'Operating Systems', name_ar: 'نظم التشغيل', subject_code: 'CS3608', year: 2026, year_level: 3, semester: 1 };
const data = { subject: course.name, year: 2026, year_level: 3, semester: 1 };
test('existing course names and short codes are valid metadata', () => {
  validateContentMetadata('operating-systems/2026/chapter-01', data, course);
  validateContentMetadata('operating-systems/2026/chapter-01', { subject_code: 'CS3608', year_level: 3, semester: 1 }, course);
});
test('rejects wrong folder, subject, year or academic placement', () => {
  for (const id of ['programming-languages/2026/chapter-01', 'operating-systems/2025/chapter-01', 'operating-systems/2026']) {
    assert.throws(() => validateContentMetadata(id, data, course), /metadata mismatch/);
  }
  for (const patch of [{ subject: 'Programming Languages' }, { year: 2025 }, { year_level: 2 }, { semester: 2 }]) {
    assert.throws(() => validateContentMetadata('operating-systems/2026/chapter-01', { ...data, ...patch }, course), /metadata mismatch/);
  }
});
