/**
 * Shared type definitions for the CS Vault application.
 * Single source of truth — used by both Astro components and client scripts.
 */

export interface Question {
  id: number;
  question: string;
  code?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  sourceSlide?: number;
  sourceSlides?: number[];
  sourcePage?: number;
  optionsSource?: 'provided' | 'generated';
  topic?: string;
  answerSource?: 'marked' | 'inferred' | 'manual';
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
  sourceKind?: 'generated' | 'provided' | 'instructor';
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
