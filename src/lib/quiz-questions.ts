import type { Question } from '../types';

// Source wording and answers remain available for inspection while a disputed
// item is withheld from practice, scores, saved reviews, and exam sessions.
export function getPracticeQuestions<T extends Question>(questions: T[]): T[] {
  return questions.filter(question => question.status !== 'disputed');
}

export function selectPracticeQuestions<T extends Question>(
  bank: T[], { topic = '', limit }: { topic?: string; limit?: 10 } = {}, shuffle: (questions: T[]) => T[],
): T[] {
  const eligible = getPracticeQuestions(bank).filter(question => !topic || (question.topic || 'general') === topic);
  const selected = shuffle([...eligible]);
  return limit === 10 ? selected.slice(0, 10) : selected;
}

export function canShuffleOptions(question: Question): boolean {
  if (question.shuffleOptions === false) return false;
  const referencesPosition = /\b(?:all|none|both|neither|either)\s+(?:of\s+)?(?:the\s+)?(?:above|below)\b|\b(?:options?|choices?)\s+[A-H]\b|\b(?:the\s+)?(?:first|second|third|fourth)\s+(?:option|choice|answer)\b|\b(?:both|either|neither)\s+[A-H]\s+(?:and|or|nor|&)\s+[A-H]\b/i;
  const referencesLetters = /\b[A-H]\b(?!\+)\s*(?:,\s*[A-H]\b\s*)*(?:,\s*)?(?:[Aa][Nn][Dd]|[Oo][Rr]|[Nn][Oo][Rr]|&)\s+[A-H]\b(?!\+)/;
  const referencesArabicPosition = /(?:جميع|كل)\s+ما\s+سبق|لا\s+شيء\s+مما\s+سبق/u;
  if ([question.question, ...question.options].some(text => referencesPosition.test(text) || referencesLetters.test(text) || referencesArabicPosition.test(text))) return false;
  // Already lettered source choices keep those labels aligned with their text.
  // Requiring two labels avoids treating a single language name such as C as a
  // position reference; the punctuation also distinguishes labels from prose.
  const labels = question.options.flatMap(option => {
    const match = option.match(/^\s*(?:\(([A-H])\)|([A-H])[.):])\s+/i);
    return match ? [(match[1] || match[2]).toUpperCase()] : [];
  });
  return new Set(labels).size < 2;
}

export function prepareQuestionOptions(question: Question, shuffle: (options: string[]) => string[]): string[] {
  return canShuffleOptions(question) ? shuffle(question.options) : [...question.options];
}

export function getQuizQuestionPath(quizId: string): string {
  const [subject, year, ...parts] = quizId.split('/');
  const slug = parts.join('-').replace(/\.(md|json)$/, '');
  return `/${subject}/${year}/quiz/${slug}/`;
}
