import { z } from 'zod';
import catalog from '../data/subjects.json' with { type: 'json' };

export interface Course {
  slug: string; name: string; name_ar?: string; subject_code: string;
  year: number; year_level: number; semester: number;
}
export const courseKey = (course: Course): string => `${course.slug}/${course.year}`;
// Keep the collection key in exported choices from the first edition onward.
// A course code/name may be reused when the next collection year is added.
export const courseLabel = (course: Course): string => `${course.subject_code} — ${course.name} — Year ${course.year_level} [${courseKey(course)}]`;

export const courses = z.array(z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  subject_code: z.string().min(1),
  name_ar: z.string().min(1).optional(),
  year: z.number().int().positive(),
  year_level: z.number().int().min(1).max(4),
  semester: z.number().int().min(1).max(2),
})).superRefine((items, ctx) => {
  const seen = new Set<string>();
  for (const course of items) {
    const key = courseKey(course);
    if (seen.has(key)) ctx.addIssue({ code: "custom", message: `Duplicate course: ${key}` });
    seen.add(key);
  }
}).parse(catalog);

export const findCourse = (key: string): Course | undefined => courses.find(course => courseKey(course) === key);

export function resolveCourse(nameOrSlug: string, year?: string | number, catalog: readonly Course[] = courses): Course | undefined {
  return catalog.find(course => (year === undefined || String(course.year) === String(year))
    && [course.slug, course.name, course.name_ar, course.subject_code].includes(nameOrSlug));
}

export const courseSearchNames = (course: Course): string[] => [course.name, course.name_ar || course.name];

export function hasMultipleCollections(slug: string, catalog: readonly Course[] = courses): boolean {
  return new Set(catalog.filter(course => course.slug === slug).map(course => course.year)).size > 1;
}
