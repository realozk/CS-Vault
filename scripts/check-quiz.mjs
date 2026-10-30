import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { findCourse, courseKey } from '../src/lib/course-catalog.ts';
import { safeQuizFilename, validateContribution } from '../src/lib/contributions.ts';

try {
  const [file, ...args] = process.argv.slice(2);
  const value = name => args[args.indexOf(name) + 1];
  const course = args.includes('--course') && findCourse(value('--course'));
  if (!file || !course) throw new Error('Usage: npm run check:quiz -- file.json --course subject/2026 [--original existing-file.json]');
  const filename = basename(file);
  const canonicalFilename = safeQuizFilename(filename);
  if (filename !== canonicalFilename) throw new Error(`Use the lowercase .json filename ${canonicalFilename} so the site can load it.`);
  let target;
  if (args.includes('--original')) {
    const originalPath = value('--original');
    if (basename(file) !== basename(originalPath)) throw new Error('Corrections must keep the original filename.');
    const original = JSON.parse(await readFile(originalPath, 'utf8'));
    const originalCheck = validateContribution(JSON.stringify(original), course);
    if (!originalCheck.quiz) throw new Error(`Original quiz does not match selected course: ${originalCheck.errors.join('; ')}`);
    target = { id: `${courseKey(course)}/${basename(file, '.json')}`, title: original.title, date: original.date,
      questions: original.questions.map(q => ({ id: q.id, signature: JSON.stringify([q.question, q.code || '']) })) };
  }
  const result = validateContribution(await readFile(file, 'utf8'), course, target);
  result.warnings.forEach(message => console.warn(`Warning: ${message}`));
  if (!result.quiz) throw new Error(result.errors.join('\n'));
  console.log('Format checks passed. A reviewer still needs to check the questions and answers.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
