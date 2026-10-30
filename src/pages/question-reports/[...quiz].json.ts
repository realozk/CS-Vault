import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { createQuestionReportPayload } from '../../lib/question-report';

// Original quiz records only. Aggregate links resolve their original identity
// before reaching this endpoint, so a report never uses a renumbered ID.
export async function getStaticPaths() {
  return (await getCollection('quizzes')).map(quiz => ({ params: { quiz: quiz.id }, props: { quiz } }));
}

export const GET: APIRoute = ({ props }) => {
  const quiz = props.quiz as CollectionEntry<'quizzes'>;
  return new Response(JSON.stringify(createQuestionReportPayload(quiz.id, quiz.data)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
