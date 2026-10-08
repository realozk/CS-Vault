const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function getAcademicWeekNumber(date: Date, firstWeekSaturday: string): number {
  const [year, month, day] = firstWeekSaturday.split('-').map(Number);
  const start = Date.UTC(year, month - 1, day);
  const currentDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((currentDate - start) / MILLISECONDS_PER_WEEK) + 1;
}
