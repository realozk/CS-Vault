export interface PomodoroState {
  version: 1;
  studyMinutes: number;
  breakMinutes: number;
  phase: 'study' | 'break';
  remainingSeconds: number;
  deadline: number | null;
}

export const createDefaultPomodoroState = (): PomodoroState => ({
  version: 1,
  studyMinutes: 50,
  breakMinutes: 10,
  phase: 'study',
  remainingSeconds: 50 * 60,
  deadline: null,
});

export function readPomodoroState(raw: string | null): PomodoroState {
  const fallback = createDefaultPomodoroState();
  if (!raw) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return fallback;
    const candidate = value as Partial<PomodoroState>;
    const validMinutes = (minutes: unknown): minutes is number =>
      typeof minutes === 'number' && Number.isInteger(minutes) && minutes >= 1 && minutes <= 180;
    if (candidate.version !== 1
      || !validMinutes(candidate.studyMinutes)
      || !validMinutes(candidate.breakMinutes)
      || !['study', 'break'].includes(candidate.phase || '')
      || typeof candidate.remainingSeconds !== 'number'
      || !Number.isInteger(candidate.remainingSeconds)
      || candidate.remainingSeconds < 0
      || candidate.remainingSeconds > 180 * 60
      || (candidate.deadline !== null && (typeof candidate.deadline !== 'number' || !Number.isFinite(candidate.deadline) || candidate.deadline < 0))) {
      return fallback;
    }
    return candidate as PomodoroState;
  } catch {
    return fallback;
  }
}

export function getPomodoroPhaseDuration(state: PomodoroState, phase: PomodoroState['phase']): number {
  return (phase === 'study' ? state.studyMinutes : state.breakMinutes) * 60;
}

export function getPomodoroRemainingSeconds(state: PomodoroState, now: number): number {
  return state.deadline === null
    ? state.remainingSeconds
    : Math.max(0, Math.ceil((state.deadline - now) / 1000));
}

export function completePomodoroPhase(state: PomodoroState, now: number): PomodoroState {
  if (!Number.isFinite(now) || now < 0) throw new Error('Pomodoro phase completion time must be valid.');
  const phase = state.phase === 'study' ? 'break' : 'study';
  const remainingSeconds = getPomodoroPhaseDuration(state, phase);
  return {
    ...state,
    phase,
    remainingSeconds,
    deadline: phase === 'break' ? now + remainingSeconds * 1000 : null,
  };
}

export function formatPomodoroTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}
