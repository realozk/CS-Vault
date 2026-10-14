import { z } from 'astro/zod';
import { getCollection } from 'astro:content';
import { validateContentMetadata } from './content-metadata';
import catalog from '../data/subjects.json';
import type { ModuleItem } from '../types';

const subjects = z.array(z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  subject_code: z.string().min(1),
  name_ar: z.string().min(1).optional(),
  year: z.number().int().positive(),
  year_level: z.number().int().min(1).max(4),
  semester: z.number().int().min(1).max(2),
  is_new: z.boolean().default(false),
})).parse(catalog);

// Build-time only: courses exist even before their study material is uploaded.
export function getSubjectName(nameOrSlug: string, lang: 'en' | 'ar' = 'en') {
  const subject = subjects.find(s => s.slug === nameOrSlug || s.name === nameOrSlug || s.name_ar === nameOrSlug || s.subject_code === nameOrSlug);
  return subject ? (lang === 'ar' ? subject.name_ar || subject.name : subject.name) : nameOrSlug;
}

export async function getModules(lang: 'en' | 'ar' = 'en'): Promise<ModuleItem[]> {
  const modules = new Map<string, ModuleItem>();
  const latestContentDates = new Map<string, number>();
  for (const subject of subjects) {
    const key = `${subject.slug}/${subject.year}`;
    if (modules.has(key)) throw new Error(`Duplicate subject: ${key}`);
    modules.set(key, {
      subject: subject.slug, subjectName: getSubjectName(subject.slug, lang), subjectCode: subject.subject_code,
      year: String(subject.year),
      yearLevel: subject.year_level, semester: subject.semester,
      summariesCount: 0, quizzesCount: 0, isNew: subject.is_new,
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
      const course = subjects.find(s => s.slug === subject && String(s.year) === year)!;
      validateContentMetadata(entry.id, entry.data, course);
      module[count]++;
      const date = entry.data.date.getTime();
      const key = `${subject}/${year}`;
      latestContentDates.set(key, Math.max(latestContentDates.get(key) ?? 0, date));
    }
  }
  for (const module of modules.values()) {
    if (module.quizzesCount > 0) module.quizzesCount++;
  }
  return [...modules.values()].sort((a, b) =>
    (latestContentDates.get(`${b.subject}/${b.year}`) ?? 0) - (latestContentDates.get(`${a.subject}/${a.year}`) ?? 0)
      || a.subjectName.localeCompare(b.subjectName)
  );
}
