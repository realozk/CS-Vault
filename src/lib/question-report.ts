import type { Question, QuizData } from '../types';
import { getQuizQuestionPath } from './quiz-questions.ts';

export interface QuestionReportTarget { quizId: string; questionId: number }
type ReportQuestion = Pick<Question, 'id' | 'question' | 'code' | 'options' | 'sourceLecture' | 'sourceSlide' | 'sourceSlides' | 'sourcePage'>;
export type QuestionReportQuiz = Pick<QuizData, 'title' | 'subject' | 'year' | 'source' | 'sourceKind' | 'sourceAcademicYear' | 'sourceTerm'> & { questions: ReportQuestion[] };
export interface QuestionReportPayload { id: string; quiz: QuestionReportQuiz }

export function createQuestionReportPayload(id: string, quiz: QuizData): QuestionReportPayload {
  return { id, quiz: {
    title: quiz.title, subject: quiz.subject, year: quiz.year, source: quiz.source, sourceKind: quiz.sourceKind,
    sourceAcademicYear: quiz.sourceAcademicYear, sourceTerm: quiz.sourceTerm,
    questions: quiz.questions.map(({ id, question, code, options, sourceLecture, sourceSlide, sourceSlides, sourcePage }) => ({
      id, question, code, options, sourceLecture, sourceSlide, sourceSlides, sourcePage,
    })),
  } };
}

// Only content collection identifiers are accepted: never a URL, filesystem
// traversal, arbitrary report text, or an aggregate's temporary question ID.
export function isOriginalQuizId(value: string): boolean {
  return value.length <= 300
    && /^[a-z0-9]+(?:-[a-z0-9]+)*\/[1-9]\d{0,5}\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\.json)?$/.test(value)
    && !/\/(?:all-questions|all-tutorials)(?:\.json)?$/.test(value);
}

export function parseQuestionReportTarget(search: URLSearchParams): QuestionReportTarget | null {
  const quizzes = search.getAll('reportQuiz');
  const questions = search.getAll('reportQuestion');
  if (quizzes.length !== 1 || questions.length !== 1 || !isOriginalQuizId(quizzes[0]) || !/^-?\d+$/.test(questions[0])) return null;
  const questionId = Number(questions[0]);
  return Number.isSafeInteger(questionId) ? { quizId: quizzes[0], questionId } : null;
}

export function getQuestionReportTarget(quizId: string, quiz: Pick<QuizData, 'questions'>, currentId: number): QuestionReportTarget | null {
  const question = quiz.questions.find(item => item.id === currentId);
  if (!question) return null;
  const target = { quizId: question.origin?.quizId ?? quizId, questionId: question.origin?.questionId ?? question.id };
  return isOriginalQuizId(target.quizId) && Number.isSafeInteger(target.questionId) ? target : null;
}

export function getQuestionReportHref(contributePath: string, target: QuestionReportTarget): string {
  const params = new URLSearchParams({ reportQuiz: target.quizId, reportQuestion: String(target.questionId) });
  return `${contributePath}?${params}#question-correction`;
}

export function getQuestionReportDataPath(base: string, target: QuestionReportTarget): string {
  return `${base.endsWith('/') ? base : `${base}/`}question-reports/${target.quizId}.json`;
}

export function getQuestionReportQuizPath(target: QuestionReportTarget, base: string, lang: 'en' | 'ar'): string {
  return `${base.endsWith('/') ? base : `${base}/`}${lang === 'ar' ? 'ar/' : ''}${getQuizQuestionPath(target.quizId).replace(/^\//, '')}`;
}

export function createQuestionReportText(payload: QuestionReportPayload, target: QuestionReportTarget, quizUrl: string, lang: 'en' | 'ar'): string | null {
  if (payload.id !== target.quizId || !isOriginalQuizId(payload.id) || !Array.isArray(payload.quiz?.questions)) return null;
  const question = payload.quiz.questions.find(item => item.id === target.questionId);
  if (!question || typeof question.question !== 'string' || !Array.isArray(question.options)) return null;
  const quiz = payload.quiz;
  const ar = lang === 'ar';
  const originLabels = ar
    ? { instructor: 'من المحاضر', provided: 'أسئلة سابقة أو مجمّعة', generated: 'تدريب مولّد بالذكاء الاصطناعي', combined: 'تدريب مجمّع' }
    : { instructor: 'Instructor material', provided: 'Past or collected questions', generated: 'AI-generated practice', combined: 'Combined practice' };
  const lines = [
    ar ? 'طلب تصحيح — CS Vault' : 'Correction request — CS Vault',
    `${ar ? 'المادة' : 'Course'}: ${quiz.subject}`,
    `${ar ? 'المجموعة' : 'Collection'}: ${target.quizId.split('/').slice(0, 2).join('/')}`,
    `${ar ? 'الاختبار الأصلي' : 'Original quiz'}: ${quiz.title}`,
    `${ar ? 'رابط الاختبار' : 'Quiz URL'}: ${quizUrl}`,
    `${ar ? 'معرّف السؤال الأصلي' : 'Original question ID'}: ${target.questionId}`,
    '',
    `${ar ? 'السؤال' : 'Question'}: ${question.question}`,
    ...(question.code ? ['', `${ar ? 'الشيفرة' : 'Code'}:`, question.code] : []),
    `${ar ? 'الخيارات' : 'Options'}:`,
    ...question.options.map((option, index) => `${index + 1}. ${option}`),
    ...(quiz.sourceKind ? [`${ar ? 'نوع مصدر الأسئلة' : 'Question origin'}: ${originLabels[quiz.sourceKind]}`] : []),
    ...(quiz.source ? [`${ar ? 'المصدر' : 'Source'}: ${quiz.source}`] : []),
    ...(quiz.sourceAcademicYear ? [`${ar ? 'سنة المصدر' : 'Source academic year'}: ${quiz.sourceAcademicYear}`] : []),
    ...(quiz.sourceTerm ? [`${ar ? 'فصل المصدر' : 'Source term'}: ${quiz.sourceTerm}`] : []),
    ...(question.sourceLecture !== undefined ? [`${ar ? 'المحاضرة' : 'Lecture'}: ${question.sourceLecture}`] : []),
    ...(question.sourcePage !== undefined ? [`${ar ? 'الصفحة' : 'Page'}: ${question.sourcePage}`] : []),
    ...(question.sourceSlide !== undefined ? [`${ar ? 'الشريحة' : 'Slide'}: ${question.sourceSlide}`] : []),
    ...(question.sourceSlides?.length ? [`${ar ? 'الشرائح' : 'Slides'}: ${question.sourceSlides.join(', ')}`] : []),
    '',
    ar ? 'المشكلة أو التصحيح المقترح:' : 'Issue / suggested correction:',
    '',
    ar ? 'الدليل أو مرجع المصدر:' : 'Evidence / source reference:',
    '',
  ];
  return lines.join('\n');
}
