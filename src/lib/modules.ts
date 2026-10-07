import { getCollection, z } from 'astro:content';
import catalog from '../data/subjects.json';
import type { ModuleItem } from '../types';

const subjects = z.array(z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  year: z.number().int().positive(),
  year_level: z.number().int().min(1).max(4),
  semester: z.number().int().min(1).max(2),
})).parse(catalog);

// Build-time only: courses exist even before their study material is uploaded.
export async function getModules(): Promise<ModuleItem[]> {
  const modules = new Map<string, ModuleItem>();
  for (const subject of subjects) {
    const key = `${subject.slug}/${subject.year}`;
    if (modules.has(key)) throw new Error(`Duplicate subject: ${key}`);
    modules.set(key, {
      subject: subject.slug, subjectName: subject.name, year: String(subject.year),
      yearLevel: subject.year_level, semester: subject.semester,
      summariesCount: 0, quizzesCount: 0,
    });
  }
  const [summaries, quizzes] = await Promise.all([
    getCollection('summaries'), getCollection('quizzes'),
  ]);
  for (const [entries, count] of [
    [summaries, 'summariesCount'], [quizzes, 'quizzesCount'],
  ] as const) {
    for (const entry of entries) {
      const [subject, year] = entry.id.split('/');
      const module = modules.get(`${subject}/${year}`);
      if (!module) throw new Error(`Register ${subject}/${year} in src/data/subjects.json first`);
      if (entry.data.year_level !== module.yearLevel || entry.data.semester !== module.semester) {
        throw new Error(`Course metadata mismatch: ${entry.id}`);
      }
      module[count]++;
    }
  }
  return [...modules.values()].sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}
