/**
 * Shared type definitions for the CS Vaulte application.
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
  source?: string;
  sourceKind?: 'generated' | 'provided';
  featured?: boolean;
}

export interface ModuleItem {
  subject: string;
  subjectName: string;
  year: string;
  yearLevel: number;
  semester: number;
  summariesCount: number;
  quizzesCount: number;
}
