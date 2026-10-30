/**
 * Shared type definitions for the CS Vault application.
 * Single source of truth — used by both Astro components and client scripts.
 */

export interface Question {
  id: number;
  question: string;
  code?: string;
  options: string[];
  shuffleOptions?: boolean;
  correctAnswer: string;
  explanation?: string;
  sourceLecture?: number;
  sourceSlide?: number;
  sourceSlides?: number[];
  sourcePage?: number;
  optionsSource?: 'provided' | 'generated';
  topic?: string;
  answerSource?: 'marked' | 'inferred' | 'manual';
  status?: 'reviewed' | 'disputed';
  reviewNote?: string;
  origin?: {
    quizId: string;
    questionId: number;
    title: string;
    source?: string;
    lang?: 'en' | 'ar';
  };
}

export interface QuizData {
  lang?: 'en' | 'ar';
  title: string;
  subject: string;
  year: number;
  questions: Question[];
  description?: string;
  sourceAcademicYear?: string;
  sourceTerm?: string;
  updatedAt?: Date | string;
  source?: string;
  sourceKind?: 'generated' | 'provided' | 'instructor' | 'combined';
  featured?: boolean;
}

export interface ModuleItem {
  subject: string;
  subjectName: string;
  subjectCode: string;
  latestContentAt: number | null;
  year: string;
  yearLevel: number;
  semester: number;
  summariesCount: number;
  quizzesCount: number;
}
