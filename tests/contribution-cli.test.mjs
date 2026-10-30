import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { courses, courseKey } from '../src/lib/course-catalog.ts';
import { createStarterQuiz } from '../src/lib/contribution-kit.ts';

test('quiz checker accepts published .json names and rejects names the content loader would omit', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cs-vault-quiz-filename-'));
  const script = fileURLToPath(new URL('../scripts/check-quiz.mjs', import.meta.url));
  const course = courses[0];
  try {
    for (const filename of ['chapter-01.json', 'chapter-01.JSON', 'chapter-01']) {
      const file = join(directory, filename);
      await writeFile(file, JSON.stringify(createStarterQuiz(course, '2026-10-16')));
      const result = spawnSync(process.execPath, ['--experimental-strip-types', script, file, '--course', courseKey(course)], { encoding: 'utf8' });
      if (filename === 'chapter-01.json') {
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /Format checks passed/);
      } else {
        assert.equal(result.status, 1);
        assert.match(result.stderr, /lowercase \.json filename chapter-01\.json/);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
