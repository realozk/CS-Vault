import { z } from 'zod';

export const quizSchema = z.object({
    title: z.string().min(1, 'Quiz title is required'),
    date: z.coerce.date(),
    description: z.string().optional(),
    sourceAcademicYear: z.string().min(1).optional(),
    sourceTerm: z.string().min(1).optional(),
    updatedAt: z.coerce.date().optional(),
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
        sourceSlides: z.array(z.number().int().positive()).min(1).optional(),
        sourcePage: z.number().int().positive().optional(),
        optionsSource: z.enum(['provided', 'generated']).optional(),
        answerSource: z.enum(['marked', 'inferred', 'manual']).default('manual'),
      })
    ).min(1, 'A quiz must contain questions').superRefine((questions, ctx) => {
      const ids = new Set<number>();
      questions.forEach((q, index) => {
        if (ids.has(q.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: `Question ID ${q.id} is already used.` });
        ids.add(q.id);
        if (!q.options.includes(q.correctAnswer)) ctx.addIssue({ code: 'custom', path: [index, 'correctAnswer'], message: 'correctAnswer must exactly match one option.' });
      });
    }),
  });

export type ValidatedQuiz = z.infer<typeof quizSchema>;
