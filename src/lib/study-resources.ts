import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import summaryMarkdown from './summary-markdown.mjs';
import type { Question } from '../types';

/** Build-time links only: no compiler or Markdown is sent to the quiz client. */
export interface StudyResource {
  topic?: string;
  title: string;
  href: string;
  summaryId: string;
  matchedBy: 'topic' | 'section';
}

export interface PackedStudyResources {
  resources: Pick<StudyResource, 'title' | 'href'>[];
  questions: Record<number, number>;
}

/** Send each notes link once, even when hundreds of questions share it. */
export function packStudyResources(resources: Readonly<Record<number, StudyResource>>): PackedStudyResources {
  const packed: PackedStudyResources = { resources: [], questions: {} };
  const indices = new Map<string, number>();
  for (const [questionId, { title, href }] of Object.entries(resources)) {
    const key = JSON.stringify([title, href]);
    let index = indices.get(key);
    if (index === undefined) {
      index = packed.resources.length;
      indices.set(key, index);
      packed.resources.push({ title, href });
    }
    packed.questions[Number(questionId)] = index;
  }
  return packed;
}

interface SummaryEntry {
  id: string;
  body?: string;
  data: { title: string; lang?: 'en' | 'ar' };
}

interface SummaryDefinition {
  course: string;
  slug: string;
  kind: 'lecture' | 'chapter';
  number: number;
  quizPrefix: string;
}

interface ResourceMapping {
  summaryId: string;
  heading: string;
  topics: readonly string[];
  /** Reused topic labels such as "proofs" mean different things per lecture. */
  section?: number;
}

const courseYear = (subject: string) => `${subject}/2026`;
const definitions = (subject: string, kind: 'lecture' | 'chapter', slugs: string[]): SummaryDefinition[] =>
  slugs.map((slug, index) => ({ course: courseYear(subject), slug, kind, number: index + 1, quizPrefix: `${kind}-${String(index + 1).padStart(2, '0')}` }));

const summaryDefinitions: readonly SummaryDefinition[] = [
  ...definitions('algorithm-analysis', 'lecture', ['lecture-01-complexity-basics', 'lecture-02-asymptotic-proofs', 'lecture-03-summations-and-recurrences', 'lecture-04-master-theorem', 'lecture-05-randomized-algorithms']),
  ...definitions('computer-networks', 'chapter', ['chapter-01-introduction', 'chapter-02-application-layer', 'chapter-03-transport-layer']),
  ...definitions('operating-systems', 'chapter', ['chapter-01', 'chapter-02', 'chapter-03', 'chapter-04', 'chapter-05']),
  ...definitions('programming-languages', 'lecture', ['lecture-01']),
  { course: courseYear('web-development'), slug: 'lecture-01-introduction', kind: 'lecture', number: 1, quizPrefix: 'lecture-01' },
  { course: courseYear('web-development'), slug: 'lecture-02-html-basics', kind: 'lecture', number: 2, quizPrefix: 'lecture-02' },
  { course: courseYear('web-development'), slug: 'lecture-02-part-2-tables-and-forms', kind: 'lecture', number: 2, quizPrefix: 'lecture-02-part-2' },
  { course: courseYear('web-development'), slug: 'lecture-03-part-1-css-color-and-text', kind: 'lecture', number: 3, quizPrefix: 'lecture-03-part-1' },
];

const map = (subject: string, slug: string, heading: string, topics: string[], section?: number): ResourceMapping => ({
  summaryId: `${courseYear(subject)}/${slug}`, heading, topics, ...(section === undefined ? {} : { section }),
});
const algorithm = (lecture: number, heading: string, topics: string[], section?: number) =>
  map('algorithm-analysis', summaryDefinitions.find(item => item.course === courseYear('algorithm-analysis') && item.number === lecture)!.slug, heading, topics, section);
const networks = (chapter: number, heading: string, topics: string[]) =>
  map('computer-networks', summaryDefinitions.find(item => item.course === courseYear('computer-networks') && item.number === chapter)!.slug, heading, topics);
const os = (chapter: number, heading: string, topics: string[]) => map('operating-systems', `chapter-${String(chapter).padStart(2, '0')}`, heading, topics);
const languages = (heading: string, topics: string[]) => map('programming-languages', 'lecture-01', heading, topics);
const web = (slug: string, heading: string, topics: string[]) => map('web-development', slug, heading, topics);

/** Exact authored headings, checked against the same Markdown pipeline as the site. */
export const STUDY_RESOURCE_MAPPINGS: readonly ResourceMapping[] = [
  algorithm(1, 'Algorithm and efficiency (pages 3-7)', ['Fundamental Concepts and the Design Process', 'foundations', 'correctness', 'Time and Space Complexity', 'time-and-space']),
  algorithm(1, 'Best, worst, and average cases (page 16)', ['Case Behaviors and Asymptotic Analysis', 'case-behaviour'], 1),
  algorithm(1, 'Growth rates (pages 17-21)', ['growth-rates']),
  algorithm(1, 'Bounds and proof language (pages 19-25)', ['Big-O, Omega, and Theta Notations', 'asymptotic-bounds'], 1),
  algorithm(1, 'Proof MCQ checklist', ['proofs'], 1),
  algorithm(2, 'The main worked proof (pages 3-5)', ['Asymptotic Definitions and Logic', 'asymptotic-bounds'], 2),
  algorithm(2, 'Four practice proofs (page 6)', ['Growth Hierarchy and Proof Mechanics']),
  algorithm(2, 'Proving or disproving a claim (pages 11-13)', ['proofs'], 2),
  algorithm(2, 'Page 14 comparisons, with reasons', ['Asymptotic Comparisons', 'growth-comparisons']),
  algorithm(2, 'Case behaviour reminder (pages 7-9)', ['Case Behaviours (Insertion Sort)', 'case-behaviour'], 2),
  algorithm(3, 'Iteration versus recursion (pages 4-10)', ['Algorithm Types and Iterative Analysis']),
  algorithm(3, 'Summations to recognize (pages 5-7)', ['summations']),
  algorithm(3, 'Expansion / back-substitution (pages 11-13)', ['Recursive Analysis and Recurrence Relations', 'recurrences', 'Advanced Concepts and Definitions']),
  algorithm(3, 'Recursion-tree proof (pages 14-29)', ['The Recursion Tree Method', 'recursion-trees']),
  algorithm(3, 'Merge sort, without pseudocode (pages 30-36)', ['Merge Sort', 'merge-sort']),
  algorithm(3, 'Proof MCQ checkpoints', ['proofs'], 3),
  algorithm(4, 'Recognize the Master form (pages 4-5)', ['Master Theorem and Recurrence Relations', 'master-theorem', 'theorem-applicability']),
  algorithm(4, 'Worked lecture examples (pages 6-9)', ['master-examples']),
  algorithm(4, 'Compare f(n) with n^d', ['proofs'], 4),
  algorithm(4, 'Divide, conquer, combine (pages 11-16)', ['Divide-and-Conquer Principles', 'divide-and-conquer', 'binary-search', 'quicksort']),
  algorithm(4, 'Matrix multiplication (pages 18-23)', ['Matrix Multiplication', 'matrix-multiplication']),
  algorithm(4, 'Sorting comparisons (pages 24-25)', ['Sorting Algorithms', 'sorting-tradeoffs']),
  algorithm(5, 'Why introduce randomness? (pages 4-5)', ['Introduction and Theory of Randomization', 'randomization']),
  algorithm(5, 'Las Vegas versus Monte Carlo (page 6)', ['randomized-types']),
  algorithm(5, 'Randomized quicksort (pages 7-9)', ['Randomized Quicksort', 'randomized-quicksort', 'pivot-strategies', 'Comparative Analysis']),
  algorithm(5, 'Proof idea: comparison indicators (page 8)', ['comparison-probability', 'proofs'], 5),
  algorithm(5, 'Randomized selection / quickselect (pages 10-12)', ['Randomized Selection (Quickselect)', 'quickselect']),
  algorithm(5, 'Rank, duplicates, and memory (pages 10-12)', ['selection-pitfalls']),

  networks(1, '1. What is the Internet? [Slides 2-6]', ['internet-basics']),
  networks(1, '2. The Network Edge [Slides 8-22]', ['network-edge']),
  networks(1, '3. The Network Core [Slides 24-34]', ['network-core']),
  networks(1, '5. Performance: Delay, Loss, and Throughput [Slides 45-56]', ['delay-loss-throughput']),
  networks(1, '6. Network Security [Slides 58-62]', ['network-security']),
  networks(1, '7. Protocol Layers and Encapsulation [Slides 64-73]', ['protocol-layers']),
  networks(2, '1. Principles of Network Applications [Slides 2-14]', ['app-principles']),
  networks(2, '2. Web and HTTP [Slides 16-37]', ['web-and-http']),
  networks(2, '3. Web Caches and HTTP/2 [Slides 38-49]', ['web-caching-http2']),
  networks(2, '4. E-mail, SMTP, and IMAP [Slides 51-56]', ['email-protocols']),
  networks(2, '5. The Domain Name System (DNS) [Slides 57-70]', ['dns']),
  networks(2, '6. P2P Applications [Slides 72-80]', ['p2p-applications']),
  networks(3, '1. Transport-Layer Services and Multiplexing [Slides 2-17]', ['transport-multiplexing']),
  networks(3, '2. Connectionless Transport: UDP [Slides 18-30]', ['udp']),
  networks(3, '3. Principles of Reliable Data Transfer (RDT) [Slides 31-69]', ['reliable-data-transfer']),
  networks(3, '4. Connection-Oriented Transport: TCP [Slides 70-95]', ['tcp']),
  networks(3, '6. TCP Congestion Control [Slides 110-125]', ['congestion-control']),

  os(1, 'Chapter 1 scope', ['os-foundations', 'interrupts-io', 'storage-caching', 'scheduling-modes']),
  os(2, 'Chapter 2 scope', ['os-services', 'system-calls', 'os-structures']),
  os(3, '1. Introduction and Process Concept', ['process-concept-memory']),
  os(3, '3. Process State and PCB (Slide 9 - 12)', ['process-states-pcb']),
  os(3, '4. Process Scheduling and Context Switching (Slide 14 - 18)', ['process-scheduling-context']),
  os(3, '5. Operations on Processes (Slide 20 - 28)', ['process-operations']),
  os(3, '7. Interprocess Communication (IPC) (Slide 31 - 52)', ['ipc-shared-memory', 'ipc-message-passing']),
  os(4, '1. Threads Concept and Motivation (Slide 4 - 7)', ['threads-overview']),
  os(4, '2. Multicore Programming (Slide 9 - 11)', ['multicore-parallelism']),
  os(4, '4. Multithreading Models (Slide 14 - 19)', ['multithreading-models']),
  os(4, '5. Thread Libraries and Java Threads (Slide 20 - 24)', ['thread-libraries-java']),
  os(5, '1. Basic Concepts (Slide 4 - 5)', ['scheduling-concepts']),
  os(5, '2. The CPU Scheduler and Dispatcher (Slide 6 - 10)', ['dispatcher-criteria']),
  os(5, '4. Scheduling Algorithms (Slide 13 - 27)', ['scheduling-algorithms']),
  os(5, '5. Advanced Scheduling Architectures (Slide 28 - 34)', ['advanced-scheduling']),

  languages('Reasons and application domains — slides 3–5', ['reasons-domains']),
  languages('Evaluation criteria — slides 6–12', ['evaluation']),
  languages('Architecture, methodologies, and categories — slides 13–18', ['architecture-paradigms']),
  languages('Trade-offs — slide 19', ['design-tradeoffs']),
  languages('Implementation and tools — slides 20–32', ['implementation-tools']),

  web('lecture-01-introduction', 'Evolution of the Internet and the Web', ['internet-history']),
  web('lecture-01-introduction', 'Web standards and accessibility', ['web-standards', 'accessibility']),
  web('lecture-01-introduction', 'Networks and the client/server model', ['network-types', 'client-server']),
  web('lecture-01-introduction', 'Internet protocols', ['internet-protocols']),
  web('lecture-01-introduction', 'URIs and domain names', ['domain-names']),
  web('lecture-01-introduction', 'Markup languages', ['markup-languages']),
  web('lecture-01-introduction', 'Popular web trends', ['web-trends']),
  web('lecture-02-html-basics', 'HTML and HTML5', ['html-basics']),
  web('lecture-02-html-basics', 'Document structure', ['document-structure']),
  web('lecture-02-html-basics', 'Basic text elements', ['text-elements']),
  web('lecture-02-html-basics', 'Phrase elements', ['phrase-elements']),
  web('lecture-02-html-basics', 'HTML lists', ['lists']),
  web('lecture-02-html-basics', 'Structure and links', ['semantic-elements', 'links']),
  web('lecture-02-html-basics', 'Special characters, comments, and validation', ['entities', 'comments-validation']),
  web('lecture-02-part-2-tables-and-forms', '1. HTML Tables', ['html-table-structure', 'html-table-accessibility']),
  web('lecture-02-part-2-tables-and-forms', 'Form Configuration', ['html-form-setup']),
  web('lecture-02-part-2-tables-and-forms', 'Form Controls', ['html-form-controls']),
  web('lecture-02-part-2-tables-and-forms', 'Form Accessibility and Grouping', ['html-form-accessibility']),
  web('lecture-02-part-2-tables-and-forms', '3. Server-Side Processing', ['html-form-processing']),
  web('lecture-03-part-1-css-color-and-text', '1. Overview and Advantages of CSS', ['css-fundamentals']),
  web('lecture-03-part-1-css-color-and-text', '2. Types of CSS', ['css-stylesheets']),
  web('lecture-03-part-1-css-color-and-text', '3. CSS Syntax and Selectors', ['css-selectors']),
  web('lecture-03-part-1-css-color-and-text', '4. Configuring Color', ['css-colors']),
  web('lecture-03-part-1-css-color-and-text', '5. Configuring Text', ['css-typography', 'css-text']),
  web('lecture-03-part-1-css-color-and-text', '6. The <span> Element', ['css-inline-elements']),
  web('lecture-03-part-1-css-color-and-text', '7. The “Cascade” (Rules of Precedence)', ['css-cascade']),
  web('lecture-03-part-1-css-color-and-text', '8. Validation', ['css-validation']),
];

type CompiledHeadings = Awaited<ReturnType<Awaited<ReturnType<typeof createMarkdownProcessor>>['render']>>['metadata']['headings'];
let processor: ReturnType<typeof createMarkdownProcessor> | undefined;
const headingsCache = new Map<string, { body: string; headings: Promise<CompiledHeadings> }>();
const cleanId = (id: string) => id.replace(/\.(md|json)$/, '');

async function getHeadings(entry: SummaryEntry): Promise<CompiledHeadings> {
  const id = cleanId(entry.id);
  const body = entry.body ?? '';
  const cached = headingsCache.get(id);
  if (cached?.body === body) return cached.headings;
  processor ??= createMarkdownProcessor({ rehypePlugins: [summaryMarkdown] });
  const headings = processor.then(markdown => markdown.render(body, {
    // The plugin only needs a stable source path, independent of the build cwd.
    fileURL: new URL(`/src/content/summaries/${id}.md`, 'file:///'),
  })).then(output => output.metadata.headings);
  headingsCache.set(id, { body, headings });
  return headings;
}

interface StudyResourceOptions {
  quizId: string;
  questions: readonly Pick<Question, 'id' | 'topic' | 'sourceLecture' | 'origin'>[];
  summaries: readonly SummaryEntry[];
  section?: { kind: 'lecture' | 'chapter' | 'mixed'; number?: number };
  lang: 'en' | 'ar';
  /** Astro's BASE_URL. Defaults to root for consumers without a deployment base. */
  baseUrl?: string;
}

function sectionNumber(id: string): number | undefined {
  const match = cleanId(id).split('/').at(-1)?.match(/^(?:lecture|chapter)-0*(\d+)(?:-|$)/);
  return match ? Number(match[1]) : undefined;
}

/**
 * Returns only links whose summary and exact heading exist in this build.
 * Unknown topics stay unlinked; a question with no topic may open its explicitly
 * identified lecture/chapter. Combined quizzes retain each question's origin.
 */
export async function getQuestionStudyResources(options: StudyResourceOptions): Promise<Record<number, StudyResource>> {
  const { questions, lang, section } = options;
  const quizId = cleanId(options.quizId);
  const course = quizId.split('/').slice(0, 2).join('/');
  if (!/^[a-z0-9-]+\/\d+$/.test(course)) return {};
  const base = `/${(options.baseUrl ?? '/').split('/').filter(Boolean).join('/')}`.replace(/\/$/, '');
  // BASE_URL is a pathname; fail closed on URL/query/hash inputs.
  if (/[?#:\\]/.test(base) || base.split('/').includes('..')) return {};
  const courseUrl = `${base}/${lang === 'ar' ? 'ar/' : ''}${course}/`;
  const available = new Map(options.summaries.map(entry => [cleanId(entry.id), entry]));
  const result: Record<number, StudyResource> = {};

  for (const question of questions) {
    const originId = cleanId(question.origin?.quizId ?? quizId);
    if (originId.split('/').slice(0, 2).join('/') !== course) continue;
    const number = question.sourceLecture ?? sectionNumber(originId) ?? section?.number;
    const topic = question.topic?.trim();
    if (topic) {
      const candidates = STUDY_RESOURCE_MAPPINGS.filter(mapping => mapping.summaryId.startsWith(`${course}/`)
        && mapping.topics.includes(topic) && (mapping.section === undefined || mapping.section === number));
      if (candidates.length !== 1) continue;
      const mapping = candidates[0];
      const summary = available.get(mapping.summaryId);
      if (!summary?.body) continue;
      const heading = (await getHeadings(summary)).find(heading => heading.text === mapping.heading);
      if (!heading) continue;
      result[question.id] = { topic, title: heading.text, href: `${courseUrl}#${encodeURIComponent(heading.slug)}`, summaryId: summary.id, matchedBy: 'topic' };
      continue;
    }

    const definitions = summaryDefinitions.filter(definition => definition.course === course);
    const originSlug = originId.split('/').at(-1) ?? '';
    const byPrefix = definitions.filter(definition => (number === undefined || definition.number === number)
      && (originSlug === definition.quizPrefix || originSlug.startsWith(`${definition.quizPrefix}-`)))
      .sort((a, b) => b.quizPrefix.length - a.quizPrefix.length);
    const byNumber = definitions.filter(definition => definition.number === number && (section?.kind !== 'chapter' && section?.kind !== 'lecture' || definition.kind === section.kind));
    const definition = byPrefix[0] ?? (byNumber.length === 1 ? byNumber[0] : undefined);
    if (!definition) continue;
    const summaryId = `${course}/${definition.slug}`;
    const summary = available.get(summaryId);
    if (!summary?.body || (await getHeadings(summary)).length === 0) continue;
    result[question.id] = { title: summary.data.title, href: `${courseUrl}#summary-content-${definition.slug}`, summaryId: summary.id, matchedBy: 'section' };
  }
  return result;
}
