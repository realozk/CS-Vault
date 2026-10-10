import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// 1. Summaries Collection (Markdown)
// Uses glob loader to scan src/content/summaries recursively
const summariesCollection = defineCollection({
  loader: glob({ 
    pattern: '**/[^._]*.md',
    base: './src/content/summaries' 
  }),
  schema: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    author: z.string().min(1, 'Author is required'),
    date: z.coerce.date(),
    subject_code: z.string().min(1, 'Subject code is required'),
    year_level: z.coerce.number().int().min(1).max(4),
    semester: z.coerce.number().int().min(1).max(2),
    lang: z.enum(['en', 'ar']).default('en'),
  }),
});

// 2. Quizzes Collection (JSON Data)
// Uses glob loader to scan src/content/quizzes recursively
const quizzesCollection = defineCollection({
  loader: glob({ 
    pattern: '**/[^._]*.json',
    base: './src/content/quizzes' 
  }),
  schema: z.object({
    title: z.string().min(1, 'Quiz title is required'),
    description: z.string().optional(),
    source: z.string().optional(),
    sourceKind: z.enum(['generated', 'provided', 'instructor']).default('generated'),
    featured: z.boolean().default(false),
    subject: z.string().min(1, 'Subject name is required'),
    year: z.number().int().positive(),
    year_level: z.coerce.number().int().min(1).max(4),
    semester: z.coerce.number().int().min(1).max(2),
    lang: z.enum(['en', 'ar']).default('en'),
    questions: z.array(
      z.object({
        id: z.number().int(),
        question: z.string().min(1, 'Question text is required'),
        code: z.string().optional(),
        options: z.array(z.string().min(1)).min(2, 'At least 2 options are required')
          .refine(options => new Set(options).size === options.length, 'Options must be distinct'),
        correctAnswer: z.string(),
        explanation: z.string().optional(),
        topic: z.string().min(1).optional(),
        sourceSlide: z.number().int().positive().optional(),
        sourcePage: z.number().int().positive().optional(),
        optionsSource: z.enum(['provided', 'generated']).optional(),
        answerSource: z.enum(['marked', 'inferred', 'manual']).default('manual'),
      })
    ).min(1, 'A quiz must contain questions').refine(
      questions => new Set(questions.map(q => q.id)).size === questions.length,
      'Question IDs must be unique within a quiz'
    ).refine(
      (questions) => {
        // Enforce that correctAnswer must be one of the options
        return questions.every((q) => q.options.includes(q.correctAnswer));
      },
      {
        message: "Every question's correctAnswer must exactly match one of its options",
      }
    ),
  }),
});

// Export collections
export const collections = {
  summaries: summariesCollection,
  quizzes: quizzesCollection,
};
