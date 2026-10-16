import { z } from 'zod';
import { quizSchema } from './lib/quiz-schema';
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
  schema: quizSchema,
});

// Export collections
export const collections = {
  summaries: summariesCollection,
  quizzes: quizzesCollection,
};
