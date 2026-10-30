import { getCollection } from 'astro:content';
import { safeQuizFilename } from './contributions';
import { createSupplementaryQuizzes } from './quiz-routes';
import { validateContentMetadata } from './content-metadata';
import { courses as subjects, resolveCourse } from './course-catalog';
import type { ModuleItem } from '../types';

// Build-time only: courses exist even before their study material is uploaded.
export function getSubjectName(nameOrSlug: string, lang: 'en' | 'ar' = 'en', year?: string | number) {
  const subject = resolveCourse(nameOrSlug, year);
  return subject ? (lang === 'ar' ? subject.name_ar || subject.name : subject.name) : nameOrSlug;
}

export function getDefaultStudyYear(modules: readonly ModuleItem[]): number {
  const withContent = modules.filter(module => module.summariesCount + module.quizzesCount > 0);
  const years = (withContent.length ? withContent : modules).map(module => module.yearLevel);
  return years.length ? Math.min(...years) : 1;
}

export function getCourseRoutes() {
  return subjects.map(s => ({ params: { subject: s.slug, year: String(s.year) } }));
}

export function getCourseMeta(subjectSlug: string, year: string, lang: 'en' | 'ar' = 'en') {
  const course = subjects.find(s => s.slug === subjectSlug && String(s.year) === year);
  if (!course) throw new Error(`Register ${subjectSlug}/${year} in src/data/subjects.json first`);
  return {
    subject: course.slug,
    subjectName: getSubjectName(course.slug, lang, course.year),
    subjectCode: course.subject_code,
    year: String(course.year),
    yearLevel: course.year_level,
    semester: course.semester,
  };
}

export async function getModules(lang: 'en' | 'ar' = 'en'): Promise<ModuleItem[]> {
  const modules = new Map<string, ModuleItem>();
  for (const subject of subjects) {
    const key = `${subject.slug}/${subject.year}`;
    if (modules.has(key)) throw new Error(`Duplicate subject: ${key}`);
    modules.set(key, {
      subject: subject.slug, subjectName: getSubjectName(subject.slug, lang, subject.year), subjectCode: subject.subject_code,
      year: String(subject.year),
      yearLevel: subject.year_level, semester: subject.semester,
      summariesCount: 0, quizzesCount: 0, latestContentAt: null,
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
      if (count === 'quizzesCount') safeQuizFilename(entry.id.split('/').slice(2).join('/'));
      module[count]++;
      const date = entry.data.date.getTime();
      module.latestContentAt = Math.max(module.latestContentAt ?? date, date);
    }
  }
  for (const module of modules.values()) {
    const courseQuizzes = quizzes.filter(entry => {
      const [subject, year] = entry.id.split('/');
      return subject === module.subject && year === module.year;
    });
    module.quizzesCount += createSupplementaryQuizzes(courseQuizzes).length;
  }
  return [...modules.values()].sort((a, b) =>
    (b.latestContentAt ?? 0) - (a.latestContentAt ?? 0)
      || a.subjectName.localeCompare(b.subjectName)
  );
}
