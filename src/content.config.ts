import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 1. Summaries Collection (Markdown)
// Uses glob loader to scan src/content/summaries recursively
const summariesCollection = defineCollection({
  loader: glob({ 
    pattern: '**/[^_]*.md', 
    base: './src/content/summaries' 
  }),
  schema: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    author: z.string().min(1, 'Author is required'),
    date: z.coerce.date(),
    subject_code: z.string().min(1, 'Subject code is required'),
  }),
});

// 2. Quizzes Collection (JSON Data)
// Uses glob loader to scan src/content/quizzes recursively
const quizzesCollection = defineCollection({
  loader: glob({ 
    pattern: '**/[^_]*.json', 
    base: './src/content/quizzes' 
  }),
  schema: z.object({
    title: z.string().min(1, 'Quiz title is required'),
    subject: z.string().min(1, 'Subject name is required'),
    year: z.number().int().positive(),
    questions: z.array(
      z.object({
        id: z.number().int(),
        question: z.string().min(1, 'Question text is required'),
        code: z.string().optional(),
        options: z.array(z.string()).min(2, 'At least 2 options are required'),
        correctAnswer: z.string(),
        explanation: z.string().optional(),
      })
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
