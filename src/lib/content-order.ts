import { z } from 'zod';

export const studyPlacementSchema = z.object({
  order: z.number().nonnegative().optional(),
  section: z.object({
    kind: z.enum(['lecture', 'chapter', 'mixed']),
    number: z.number().int().positive().optional(),
  }).superRefine((section, ctx) => {
    if (section.kind !== 'mixed' && section.number === undefined) {
      ctx.addIssue({ code: 'custom', path: ['number'], message: 'A lecture or chapter needs its number.' });
    }
    if (section.kind === 'mixed' && section.number !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['number'], message: 'Mixed material has no section number.' });
    }
  }).optional(),
});

type Section = NonNullable<z.infer<typeof studyPlacementSchema>['section']>;
interface StudyEntry {
  id: string;
  data: {
    title: string;
    section?: Section;
    order?: number;
    sourceKind?: 'instructor' | 'provided' | 'generated' | 'combined';
    featured?: boolean;
  };
}

export function getStudySection(entry: StudyEntry): Section {
  if (entry.id.endsWith('/all-questions')) return { kind: 'mixed' };
  if (entry.data.section) return entry.data.section;
  const title = entry.data.title.replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const match = title.match(/^(Lecture|Chapter|المحاضرة|محاضرة|الفصل|فصل)\s+(\d+)/i)
    ?? entry.id.split('/').at(-1)?.match(/^(lecture|chapter)-(\d+)/i);
  if (!match) return { kind: 'mixed' };
  return {
    kind: /^(chapter|الفصل|فصل)$/i.test(match[1]) ? 'chapter' : 'lecture',
    number: Number(match[2]),
  };
}

export function compareStudyEntries(a: StudyEntry, b: StudyEntry): number {
  const left = getStudySection(a), right = getStudySection(b);
  const sourcePriority = { instructor: 2, provided: 1, generated: 0, combined: 0 };
  return Number(left.kind === 'mixed') - Number(right.kind === 'mixed')
    || (left.number ?? 0) - (right.number ?? 0)
    || left.kind.localeCompare(right.kind)
    || (a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER)
    || sourcePriority[b.data.sourceKind ?? 'generated'] - sourcePriority[a.data.sourceKind ?? 'generated']
    || Number(b.data.featured ?? false) - Number(a.data.featured ?? false)
    || a.id.localeCompare(b.id, 'en', { numeric: true });
}
