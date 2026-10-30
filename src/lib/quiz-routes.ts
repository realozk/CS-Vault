import type { CollectionEntry } from 'astro:content';
import type { Question } from '../types';
import { canShuffleOptions } from './quiz-questions.ts';

type QuizEntry = CollectionEntry<'quizzes'>;
type QuizQuestion = QuizEntry['data']['questions'][number] & Pick<Question, 'origin'>;

function combinedQuestionId(signature: string): number {
  // A content-based ID survives new source quizzes and reordered source files.
  // Keep it within JS's exact integer range so JSON and browser storage agree.
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(signature)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  }
  return Number(hash & 0x1fffffffffffffn) || 1;
}

export function createAllQuestionsQuiz(entries: QuizEntry[]) {
  if (entries.length === 0) {
    throw new Error('Cannot create an all-questions quiz without source quizzes.');
  }

  // Content loaders do not promise a filesystem order. Keep aggregate IDs and
  // their saved answers stable when the same inputs arrive in a different order.
  const ordered = [...entries].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const first = ordered[0];
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  const ids = new Set<number>();

  for (const entry of ordered) {
    const lectureMatch = entry.data.title.match(/^(?:Lecture|Chapter)\s+(\d+)/i)
      ?? entry.id.match(/\/(?:lecture|chapter)-0*(\d+)(?:-|$)/i);
    const inferredLecture = lectureMatch ? Number(lectureMatch[1]) : undefined;

    for (const question of [...entry.data.questions].sort((a, b) => a.id - b.id)) {
      // Code, case, and whitespace can change a programming question's meaning.
      // Only remove exact copies; option display order is shuffled separately.
      const signature = JSON.stringify([
        question.question,
        question.code ?? '',
        canShuffleOptions(question) ? [...question.options].sort() : question.options,
        question.correctAnswer,
        question.status === 'disputed',
        ...(!canShuffleOptions(question) ? [false] : []),
      ]);
      if (seen.has(signature)) continue;

      seen.add(signature);
      const id = combinedQuestionId(signature);
      if (ids.has(id)) throw new Error('Distinct combined questions produced the same ID. Review their source questions before publishing.');
      ids.add(id);
      questions.push({
        ...question,
        ...(question.sourceLecture === undefined && inferredLecture !== undefined ? { sourceLecture: inferredLecture } : {}),
        id,
        answerSource: question.answerSource ?? 'manual',
        origin: {
          quizId: entry.id,
          questionId: question.id,
          title: entry.data.title,
          source: entry.data.source,
          lang: entry.data.lang,
        },
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
    order: undefined,
    section: { kind: 'mixed' },
    sourceKind: 'combined',
    featured: false,
    questions,
  };

  return {
    id: `${first.id.split('/').slice(0, 2).join('/')}/all-questions`,
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
  const questions = tutorials.flatMap(entry => {
    const lectureMatch = entry.data.title.match(/^(?:Lecture|Chapter)\s+(\d+)/i)
      ?? entry.id.match(/\/(?:lecture|chapter)-0*(\d+)(?:-|$)/i);
    const inferredLecture = lectureMatch ? Number(lectureMatch[1]) : undefined;
    return entry.data.questions.map(question => ({
      ...question,
      ...(question.sourceLecture === undefined && inferredLecture !== undefined ? { sourceLecture: inferredLecture } : {}),
      id: nextId++,
      explanation: [entry.data.source, question.explanation].filter(Boolean).join(' — '),
    }));
  });

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
