import { quizSchema, type ValidatedQuiz } from './quiz-schema.ts';
import { courseKey, type Course } from './course-catalog.ts';
import { validateContentMetadata } from './content-metadata.ts';

export const MAX_QUIZ_BYTES = 2 * 1024 * 1024;
export interface FormConfig { responderUrl: string }
export interface CorrectionTarget { id: string; title: string; date: string; questions: { id: number; signature: string }[] }
export interface CheckResult { quiz?: ValidatedQuiz; errors: string[]; warnings: string[] }

export function safeQuizFilename(name: string): string {
  const filename = name.replace(/\.json$/i, '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(filename) || filename === 'all-questions') {
    throw new Error('Use a filename such as chapter-01-practice.json; paths and all-questions are not allowed.');
  }
  return `${filename}.json`;
}

// Every group and website entry point shares the same Google Form.
export function getContributionFormUrl(config: FormConfig): string | null {
  try {
    const url = new URL(config.responderUrl);
    const longForm = url.hostname === 'docs.google.com' && /^\/forms\/d\/(?:e\/)?[^/]+\/viewform$/.test(url.pathname);
    const shortForm = url.hostname === 'forms.gle' && /^\/[A-Za-z0-9_-]+$/.test(url.pathname);
    if (url.protocol !== 'https:' || url.username || url.password || (!longForm && !shortForm)) return null;
    url.search = ''; url.hash = '';
    return url.href;
  } catch { return null; }
}

export function validateContribution(text: string, course: Course, target?: CorrectionTarget): CheckResult {
  const errors: string[] = [], warnings: string[] = [];
  if (new TextEncoder().encode(text).length > MAX_QUIZ_BYTES) return { errors: ['File exceeds the 2 MB limit.'], warnings };
  let input: unknown;
  try { input = JSON.parse(text); } catch { return { errors: ['Invalid JSON. Check quotation marks, commas and brackets.'], warnings }; }
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map(issue => {
      const path = issue.path;
      const location = path[0] === 'questions' && typeof path[1] === 'number' ? `Question ${path[1] + 1}: ${path.slice(2).join('.')}` : path.join('.');
      return `${location}: ${issue.message}`;
    }), warnings };
  }
  const quiz = parsed.data;
  try { validateContentMetadata(`${courseKey(course)}/submission`, quiz, course); }
  catch { errors.push(`Course mismatch: the selected course is ${course.name} (${courseKey(course)}). Check subject, year, year_level and semester.`); }
  if (target) {
    if (!target.id.startsWith(`${courseKey(course)}/`) || target.id.endsWith('/all-questions')) errors.push('Select an existing quiz in this course.');
    if (quiz.date.getTime() !== new Date(target.date).getTime()) errors.push('Corrections must preserve the original publication date.');
    for (const q of quiz.questions) {
      const original = target.questions.find(old => old.signature === JSON.stringify([q.question, q.code || '']));
      if (original && original.id !== q.id) errors.push(`Preserve question ID ${original.id} for its existing question.`);
    }
    const ids = new Set(quiz.questions.map(q => q.id));
    for (const old of target.questions) {
      if (!ids.has(old.id)) errors.push(`Correction removed question ID ${old.id}. Preserve existing IDs; discuss removals with a reviewer.`);
    }
  }
  const seen = new Set<string>();
  quiz.questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    const signature = q.question.toLocaleLowerCase().trim().replace(/\s+/g, ' ');
    if (seen.has(signature)) warnings.push(`${label}: possible repeated question.`);
    seen.add(signature);
    if (q.answerSource === 'inferred') warnings.push(`${label}: AI-inferred answer; verify against the source.`);
    if (q.optionsSource === 'generated') warnings.push(`${label}: generated answer choices; verify against the source.`);
    if (!q.sourcePage && !q.sourceSlide && !q.sourceSlides?.length) warnings.push(`${label}: missing page or slide reference.`);
  });
  if (!quiz.sourceAcademicYear) warnings.push('Original academic year is missing. Record it if known.');
  return { quiz: errors.length ? undefined : quiz, errors, warnings };
}
