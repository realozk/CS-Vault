import type { Course } from './course-catalog.ts';
import { courseKey } from './course-catalog.ts';

export const KIT_VERSION = '1.0';
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
- Required quiz fields: title, date, subject, year, year_level, semester, questions.
- Required question fields: id (unique integer), question, options (at least two distinct nonempty strings), correctAnswer (exactly one option).
- sourceKind describes QUESTION origin: provided (past exam/collected material), instructor (instructor material), generated (new AI practice).
- answerSource describes ANSWER origin: marked (explicit source marking), inferred (AI reasoning), manual (human verified). AI conversion does not change question origin.
- optionsSource: provided or generated. Mark any deliberately added practice choices as generated.
- Include explanation, code and topic when useful. sourcePage, sourceSlide or sourceSlides are positive page/slide numbers.
- sourceAcademicYear is an optional string (e.g. 2023–2024 or a Hijri year); sourceTerm is an optional string. Never substitute source year for catalog year.
- date is the original publication date. For NEW material the starter date is a draft; the publisher sets the actual publication date. updatedAt is an optional ISO date for a correction.
- For CORRECTIONS, download the existing quiz first. Preserve its filename, date and existing question IDs. Give genuinely new questions new IDs. Explain changes in reviewer notes.
- Keep unresolved questions and uncertainty in separate reviewer notes. Format validation does not verify answers.

Save the JSON file, open the shared Google Form, choose the course and Send prepared JSON, then attach the JSON and original source/evidence. Add uncertainties as review notes. A reviewer validates the JSON and checks content before publication. No browser checker or preview is required.
`;
}
