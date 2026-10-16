import { createPreparationExample, createPreparationInstructions } from '../../lib/contribution-kit';
import { quizSchema } from '../../lib/quiz-schema';

export function getStaticPaths() {
  const example = createPreparationExample();
  // The downloadable example is checked against the site's actual schema on every build.
  quizSchema.parse(example);
  return [
    { params: { file: 'instructions.md' }, props: { body: createPreparationInstructions(), type: 'text/markdown; charset=utf-8' } },
    { params: { file: 'example.json' }, props: { body: JSON.stringify(example, null, 2) + '\n', type: 'application/json; charset=utf-8' } },
  ];
}

export function GET({ props }: { props: { body: string; type: string } }) {
  return new Response(props.body, { headers: { 'Content-Type': props.type } });
}
