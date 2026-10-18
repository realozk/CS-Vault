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

// Advance from the saved deadline, not from the moment a sleeping tab wakes up.
// Identical expired snapshots therefore produce the same next phase in every tab.
export function advancePomodoroState(state: PomodoroState, now: number): PomodoroState {
  if (!Number.isFinite(now) || now < 0) throw new Error('Pomodoro time must be valid.');
  let next = state;
  while (next.deadline !== null && next.deadline <= now) {
    next = completePomodoroPhase(next, next.deadline);
  }
  return next;
}

export function updatePomodoroDuration(state: PomodoroState, phase: PomodoroState['phase'], minutes: number, now: number): PomodoroState {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) throw new Error('Pomodoro duration must be between 1 and 180 minutes.');
  if (!Number.isFinite(now) || now < 0) throw new Error('Pomodoro time must be valid.');
  const key = phase === 'study' ? 'studyMinutes' : 'breakMinutes';
  if (state[key] === minutes) return state;
  return {
    ...state,
    [key]: minutes,
    ...(phase === state.phase ? {
      remainingSeconds: minutes * 60,
      deadline: state.deadline === null ? null : now + minutes * 60_000,
    } : {}),
  };
}

export function formatPomodoroTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}
