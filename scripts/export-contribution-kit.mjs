import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { courses, courseKey, courseLabel } from '../src/lib/course-catalog.ts';
import { createInstructions, createStarterQuiz } from '../src/lib/contribution-kit.ts';
import { quizSchema } from '../src/lib/quiz-schema.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2] ? resolve(process.argv[2]) : join(root, 'contributions');
await mkdir(join(output, 'volunteer-kit'), { recursive: true });
await mkdir(join(output, 'google-apps-script'), { recursive: true });
const snapshot = courses.map(course => ({ course_key: courseKey(course), name: course.name,
  name_ar: course.name_ar, subject_code: course.subject_code, year_level: course.year_level, semester: course.semester }));
await writeFile(join(output, 'google-apps-script', 'Catalog.gs'), `// Generated from src/data/subjects.json. Run npm run contribution:kit after catalog changes.\nconst INITIAL_COURSES = ${JSON.stringify(snapshot, null, 2)};\n`);
await writeFile(join(output, 'course-choices.txt'), courses.map(courseLabel).concat('Course missing / Not sure').join('\n') + '\n');
await writeFile(join(output, 'course-catalog.json'), JSON.stringify(snapshot, null, 2) + '\n');
for (const course of courses) {
  const filename = `${course.slug}-${course.year}`;
  // This fixed example date is a draft, never an automatic publication date.
  const quiz = createStarterQuiz(course, '2026-10-16');
  quizSchema.parse(quiz);
  await writeFile(join(output, 'volunteer-kit', `${filename}.instructions.md`), createInstructions(course));
  await writeFile(join(output, 'volunteer-kit', `${filename}.example.json`), JSON.stringify(quiz, null, 2) + '\n');
}
console.log(`Exported course choices, Apps Script catalog, and ${courses.length} volunteer kits to ${output}`);
