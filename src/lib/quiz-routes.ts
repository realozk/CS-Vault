import type { CollectionEntry } from 'astro:content';

type QuizEntry = CollectionEntry<'quizzes'>;
type QuizQuestion = QuizEntry['data']['questions'][number];

export function createAllQuestionsQuiz(entries: QuizEntry[]) {
  if (entries.length === 0) {
    throw new Error('Cannot create an all-questions quiz without source quizzes.');
  }

  const first = entries[0];
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    for (const question of entry.data.questions) {
      const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
      const signature = JSON.stringify([
        normalize(question.question),
        question.options.map(normalize),
        normalize(question.correctAnswer),
      ]);
      if (seen.has(signature)) continue;

      seen.add(signature);
      questions.push({
        ...question,
        id: questions.length + 1,
        answerSource: question.answerSource ?? 'manual',
      });
    }
  }

  const data: QuizEntry['data'] = {
    ...first.data,
    title: 'All Questions',
    description: 'A combined practice quiz containing every distinct question available for this subject.',
    source: 'Combined from all available quizzes for this subject.',
    // The first quiz's source details do not describe the full collection.
    sourceAcademicYear: undefined,
    sourceTerm: undefined,
    updatedAt: undefined,
    sourceKind: 'generated',
    featured: false,
    questions,
  };

  return {
    id: `${entries[0].id.split('/').slice(0, 2).join('/')}/all-questions`,
    collection: 'quizzes' as const,
    data,
  };
}

export function getQuizStaticPaths(entries: QuizEntry[]) {
  const paths = entries.map((quiz) => {
    const [subject, year, ...parts] = quiz.id.split('/');
    const slug = parts.join('-').replace(/\.(md|json)$/, '');
    return { params: { subject, year, slug }, props: { quiz } };
  });

  const courses = new Map<string, QuizEntry[]>();
  for (const entry of entries) {
    const [subject, year] = entry.id.split('/');
    const key = `${subject}/${year}`;
    const courseEntries = courses.get(key) ?? [];
    courseEntries.push(entry);
    courses.set(key, courseEntries);
  }

  for (const courseEntries of courses.values()) {
    const quiz = createAllQuestionsQuiz(courseEntries);
    const [subject, year] = quiz.id.split('/');
    paths.push({
      params: { subject, year, slug: 'all-questions' },
      props: { quiz },
    });
  }

  return paths;
}
