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

export function createTutorialsQuiz(entries: QuizEntry[]): QuizEntry | null {
  const tutorials = entries.filter(entry =>
    /^algorithm-analysis\/[^/]+\/lecture-\d+-instructor-tutorial(?:\.json)?$/.test(entry.id)
    && entry.data.sourceKind === 'instructor'
  ).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  if (tutorials.length === 0) return null;

  const first = tutorials[0];
  let nextId = 1;
  const questions = tutorials.flatMap(entry => entry.data.questions.map(question => ({
    ...question,
    id: nextId++,
    explanation: [entry.data.source, question.explanation].filter(Boolean).join(' — '),
  })));

  return {
    id: `${first.id.split('/').slice(0, 2).join('/')}/all-tutorials`,
    collection: 'quizzes',
    data: {
      ...first.data,
      title: 'All Tutorials — Combined Quiz',
      description: `All ${questions.length} questions from the ${tutorials.length} Algorithm Analysis tutorials, with the original choices and marked answers.`,
      source: tutorials.map(entry => entry.data.source).filter(Boolean).join(', '),
      sourceKind: 'combined',
      featured: false,
      questions,
    },
  };
}

export function createSupplementaryQuizzes(entries: QuizEntry[]): QuizEntry[] {
  if (entries.length === 0) return [];
  const tutorials = createTutorialsQuiz(entries);
  return [createAllQuestionsQuiz(entries), ...(tutorials ? [tutorials] : [])];
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
    for (const quiz of createSupplementaryQuizzes(courseEntries)) {
      const [subject, year, slug] = quiz.id.split('/');
      paths.push({ params: { subject, year, slug }, props: { quiz } });
    }
  }

  return paths;
}
