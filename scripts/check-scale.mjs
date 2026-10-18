import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), 'cs-vault-scale-'));
const run = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: fixture, encoding: 'utf8', timeout: 120_000 });
  if (result.status !== 0) throw new Error(result.error?.message ?? `${result.stdout}\n${result.stderr}`);
};
const attributes = (html, predicate) => {
  const found = [];
  const visit = node => {
    const attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    if (predicate(attrs, node)) found.push(attrs);
    for (const child of node.childNodes ?? []) visit(child);
  };
  visit(parse(html));
  return found;
};

try {
  for (const name of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(path.join(root, name), path.join(fixture, name), {
      recursive: true, filter: filename => !path.basename(filename).startsWith('._'),
    });
  }
  await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
  const catalogPath = path.join(fixture, 'src/data/subjects.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const courses = [
    { slug: 'fixture-foundations', name: 'Fixture Foundations 2026', year: 2026, year_level: 1, semester: 1 },
    { slug: 'fixture-foundations', name: 'Fixture Foundations 2027', year: 2027, year_level: 1, semester: 1 },
    { slug: 'fixture-year-two', name: 'Fixture Year Two', year: 2026, year_level: 2, semester: 2 },
    { slug: 'fixture-year-four', name: 'Fixture Year Four', year: 2026, year_level: 4, semester: 2 },
  ].map((course, index) => ({ ...course, subject_code: index < 2 ? 'FIX100' : `FIX${index}00`, name_ar: `مادة تجريبية ${course.year_level} ${course.year}` }));
  await writeFile(catalogPath, JSON.stringify([...catalog, ...courses]));
  for (const course of courses) {
    const key = `${course.slug}/${course.year}`;
    const summaries = path.join(fixture, 'src/content/summaries', key);
    const quizzes = path.join(fixture, 'src/content/quizzes', key);
    await Promise.all([mkdir(summaries, { recursive: true }), mkdir(quizzes, { recursive: true })]);
    const quiz = {
      title: 'Fixture question', date: '2026-10-18', subject: course.name,
      year: course.year, year_level: course.year_level, semester: course.semester,
      lang: 'en', sourceKind: 'generated', source: 'Synthetic software test fixture',
      questions: [{ id: 1, question: 'Which option is marked in this software fixture?', options: ['Fixture answer', 'Other'], correctAnswer: 'Fixture answer', answerSource: 'manual' }],
    };
    await writeFile(path.join(quizzes, 'lecture-01.json'), JSON.stringify(quiz));
    for (const number of [1, 2]) {
      await writeFile(path.join(summaries, `lecture-0${number}.md`), `---\ntitle: "Fixture lecture ${number}"\ndescription: "Synthetic software test fixture."\nauthor: "Test fixture"\ndate: 2026-10-18\nsubject_code: "${course.subject_code}"\nyear_level: ${course.year_level}\nsemester: ${course.semester}\nlang: en\n---\n\n## Shared heading\n\nSynthetic content used only to verify routes and anchors.\n\n[Local heading](#shared-heading)\n`);
    }
  }
  const astroPackage = JSON.parse(await readFile(path.join(root, 'node_modules/astro/package.json'), 'utf8'));
  const astroBin = typeof astroPackage.bin === 'string' ? astroPackage.bin : astroPackage.bin.astro;
  run(path.join(root, 'node_modules/astro', astroBin), ['build']);
  run(path.join(root, 'scripts/check-links.mjs'), [path.join(fixture, 'dist')]);
  const home = await readFile(path.join(fixture, 'dist/index.html'), 'utf8');
  const index = JSON.parse(attributes(home, attrs => !!attrs['data-search-index'])[0]['data-search-index']);
  for (const course of courses) {
    assert.ok(index.some(item => item.type === 'subject' && item.title === course.name && item.subjectCode === course.subject_code));
    for (const locale of ['', 'ar/']) {
      const directory = path.join(fixture, 'dist', locale, course.slug, String(course.year));
      const subject = await readFile(path.join(directory, 'index.html'), 'utf8');
      assert.ok(subject.includes(locale ? course.name_ar : course.name));
      assert.ok(subject.includes('summary-content-lecture-01--shared-heading'));
      assert.ok(subject.includes('summary-content-lecture-02--shared-heading'));
      await readFile(path.join(directory, 'quiz/lecture-01/index.html'));
      await readFile(path.join(directory, 'quiz/all-questions/index.html'));
    }
  }
  assert.ok(attributes(home, attrs => attrs['data-year-tab'] === '1' && attrs['aria-pressed'] === 'true').length);
  console.log('Expansion build passed: Years 1–4, both semesters, multiple collection years, EN/AR routes, search metadata and summary anchors.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
