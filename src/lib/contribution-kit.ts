import type { Course } from './course-catalog.ts';
import { courseKey, courses } from './course-catalog.ts';

export const KIT_VERSION = '1.0';
const QUIZ_FORMAT_RULES = `- Required quiz fields: title, date, subject, year, year_level, semester, questions.
- Required question fields: id (unique integer), question, options (at least two distinct nonempty strings), correctAnswer (exactly one option).
- sourceKind describes QUESTION origin: provided (past exam/collected material), instructor (instructor material), generated (new AI practice).
- answerSource describes ANSWER origin: marked (explicit source marking), inferred (AI reasoning), manual (human verified). AI conversion does not change question origin.
- optionsSource: provided or generated. Mark any deliberately added practice choices as generated.
- Include explanation, code and topic when useful. sourcePage, sourceSlide or sourceSlides are positive page/slide numbers.
- sourceAcademicYear is an optional string (e.g. 2023–2024 or a Hijri year); sourceTerm is an optional string. Never substitute source year for catalog year.
- date is the original publication date. For NEW material the starter date is a draft; the publisher sets the actual publication date. updatedAt is an optional ISO date for a correction.
- For CORRECTIONS, download the existing quiz first. Preserve its filename, date and existing question IDs. Give genuinely new questions new IDs. Explain changes in reviewer notes.
- Keep unresolved questions and uncertainty in separate reviewer notes. Format validation does not verify answers.`;

export function createStarterQuiz(course: Course, date = new Date().toISOString().slice(0, 10)) {
  return {
    title: 'Draft — replace with the material title', date,
    subject: course.name, year: course.year, year_level: course.year_level, semester: course.semester,
    lang: 'en', source: 'Replace with original filename or source description', sourceKind: 'provided',
    questions: [{ id: 1, question: 'Replace this example with a question from the source.',
      options: ['Example answer A', 'Example answer B'], correctAnswer: 'Example answer A',
      explanation: 'Replace this example explanation after checking the source.', answerSource: 'inferred', optionsSource: 'provided' }],
  };
}
export function createInstructions(course: Course): string {
  return `# CS Vault contribution kit — format ${KIT_VERSION}

Course collection: ${courseKey(course)}
Course: ${course.subject_code} — ${course.name}
Study year: ${course.year_level}; semester: ${course.semester}; catalog year: ${course.year}.
Catalog year identifies the collection, not the year of the original exam.

Convert the attached material into the supplied CS Vault quiz format. Preserve the original questions, choices, wording and code. Extract existing questions unless generated practice was deliberately requested. Do not silently invent missing choices. Do not describe an inferred answer as an answer marked in the source. If a question is unreadable or cannot be resolved, list it separately in reviewer notes. Use exactly the supplied course metadata.

Return JSON without Markdown fences. The starter contains a placeholder question; replace it completely.
${QUIZ_FORMAT_RULES}

Save the JSON file, open the shared Google Form, choose the course and Send prepared JSON, then attach the JSON and original source/evidence. Add uncertainties as review notes. A reviewer validates the JSON and checks content before publication. No browser checker or preview is required.
`;
}

export function preparationExampleCourse(): Course {
  const course = courses.find(course => course.slug === 'operating-systems') || courses[0];
  if (!course) throw new Error('Register a course before generating the contribution example.');
  return course;
}

export function createPreparationExample() {
  const course = preparationExampleCourse();
  return {
    ...createStarterQuiz(course, '2026-10-16'),
    title: 'EXAMPLE — Operating system resources',
    description: 'Illustrative format example. Replace with your own material and course metadata.',
    source: 'Illustrative practice question, not transcribed from an exam or lecture.',
    sourceKind: 'generated',
    questions: [{ id: 1, question: 'Which component manages hardware resources?',
      options: ['Operating system', 'Text editor', 'Browser', 'Spreadsheet'],
      correctAnswer: 'Operating system',
      explanation: 'An operating system manages resources such as the processor and memory.',
      answerSource: 'inferred', optionsSource: 'generated' }],
  };
}

export function createPreparationInstructions(): string {
  const exampleCourse = preparationExampleCourse();
  const example = createPreparationExample();
  return `# CS Vault — Prepare a quiz (format ${KIT_VERSION})

This package contains instructions and an illustrative JSON example. Download example.json too.
The example course is ${exampleCourse.name} (${exampleCourse.subject_code}), collection ${courseKey(exampleCourse)}.
It demonstrates the format only. Use YOUR OWN course's metadata and source material.
The example question and date are drafts, not a source exam or a publication announcement.

## Preparation steps

1. Give these instructions and example.json to your AI together with the original PDF, exam, question collection or photos.
2. Preserve the original questions, choices, wording and code. Extract existing questions unless generated practice was deliberately requested. Never silently invent missing choices.
3. Check questions and answers against the source. AI-generated or inferred answers still need human checking.
4. Save the quiz as JSON without Markdown fences. Put uncertain, unreadable or unresolved questions in separate reviewer notes; do not guess or fabricate an answer key.
5. Open the shared Google Form, choose your course and Send prepared JSON. Attach the resulting JSON AND the original source (or source link), plus reviewer notes. The website does not upload your files. Google sign-in is required for file uploads.

## Select the correct course metadata

Find your course below. Copy its name to subject, collection year to year, study year to year_level, and semester to semester. Use the actual catalog values, not the example's values. If your course is absent, choose Course missing / Not sure in the form and ask the team to register it before publication.

| Course code | Course name (subject) | Study year (year_level) | Semester | Catalog year (year) | Collection key |
| --- | --- | --- | --- | --- | --- |
${courses.map(course => `| ${course.subject_code} | ${course.name} | ${course.year_level} | ${course.semester} | ${course.year} | ${courseKey(course)} |`).join('\n')}

- Study year (year_level): position in the degree, 1–4.
- Semester (semester): position in the curriculum, 1–2.
- Catalog year (year): the course collection/folder, such as ${exampleCourse.year}; not the original exam year.
- Original exam year (sourceAcademicYear): optional text preserving labels such as 2023–2024 or a Hijri year. sourceTerm is optional text. An older exam can belong in the current collection.
- Publication date (date): when the quiz is first published on the site. Use an ISO date string. For new material the example date is a draft; the publisher sets the actual publication date. Corrections keep the original date; optional updatedAt records a separate ISO update date.

The catalog and summary format require subject_code where applicable. Quiz JSON uses subject instead; do not add subject_code as a quiz field.

## Quiz and question rules

${QUIZ_FORMAT_RULES}

correctAnswer must exactly match one option string, including capitalization, punctuation and spaces. All options must be distinct.

The quiz's sourceKind describes where the QUESTIONS came from. Transcribing an old exam with AI still uses provided, or instructor for instructor material. It does not become generated practice just because AI converted it.
A question's answerSource describes how its ANSWER was determined. Never label an inferred answer marked unless the source explicitly marks it. These describe different things.

Use sourcePage, sourceSlide or sourceSlides when the source provides page/slide references. Numbers start at 1. Do not fabricate a reference for an unresolved question or for the illustrative example. Preserve code in the optional code string.

## Valid illustrative example (replace course metadata)

${'```'}json
${JSON.stringify(example, null, 2)}
${'```'}

The separate example.json download is the same schema-checked example. It contains a generated practice question; it is not evidence for your own submission.

## Short AI prompt

Convert the attached material into the CS Vault quiz format described in the instructions. Preserve the original questions and choices. Use the correct course metadata. Clearly identify inferred answers. List unreadable or unresolved questions separately for review. Return the quiz as JSON.
`;
}
