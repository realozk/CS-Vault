import { completePomodoroPhase, createDefaultPomodoroState, formatPomodoroTime, getPomodoroPhaseDuration, getPomodoroRemainingSeconds, readPomodoroState, type PomodoroState } from './pomodoro-state';

const STORAGE_KEY = 'cs-vault-pomodoro-v1';

const initPomodoro = () => {
  const widget = document.getElementById('pomodoro-widget');
  if (!widget) return;
  const panel = document.getElementById('pomodoro-panel');
  const openButton = document.getElementById('pomodoro-open') as HTMLButtonElement | null;
  const phaseText = document.getElementById('pomodoro-phase');
  const timeText = document.getElementById('pomodoro-time');
  const studyInput = document.getElementById('pomodoro-study-minutes') as HTMLInputElement | null;
  const breakInput = document.getElementById('pomodoro-break-minutes') as HTMLInputElement | null;
  const toggleButton = document.getElementById('pomodoro-toggle') as HTMLButtonElement | null;
  const resetButton = document.getElementById('pomodoro-reset');
  const skipButton = document.getElementById('pomodoro-skip');
  const storageStatus = document.getElementById('pomodoro-storage-status');
  const notice = document.getElementById('pomodoro-notice');
  if (!panel || !openButton || !phaseText || !timeText || !studyInput || !breakInput
    || !toggleButton || !resetButton || !skipButton || !storageStatus || !notice) {
    throw new Error('Pomodoro timer markup is incomplete.');
  }

  let translations: Record<string, string>;
  try {
    translations = JSON.parse(widget.dataset.translations || '{}');
  } catch (error) {
    throw new Error('Pomodoro timer translations are invalid.', { cause: error });
  }
  const t = (key: string) => {
    const translation = translations[key];
    if (!translation) throw new Error(`Pomodoro translation is missing: ${key}`);
    return translation;
  };

  let state = createDefaultPomodoroState();
  try {
    state = readPomodoroState(localStorage.getItem(STORAGE_KEY));
  } catch {
    storageStatus.textContent = t('storageUnavailable');
    storageStatus.classList.remove('hidden');
  }

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageStatus.classList.add('hidden');
    } catch {
      storageStatus.textContent = t('storageUnavailable');
      storageStatus.classList.remove('hidden');
    }
  };
  const duration = (phase: PomodoroState['phase']) => getPomodoroPhaseDuration(state, phase);
  const remaining = () => getPomodoroRemainingSeconds(state, Date.now());
  const render = () => {
    phaseText.textContent = t(state.phase === 'study' ? 'studyPhase' : 'breakPhase');
    timeText.textContent = formatPomodoroTime(remaining());
    toggleButton.textContent = state.deadline === null ? t('start') : t('pause');
    toggleButton.setAttribute('aria-label', toggleButton.textContent);
  };
  const switchPhase = (continueRunning = state.deadline !== null) => {
    state.phase = state.phase === 'study' ? 'break' : 'study';
    state.remainingSeconds = duration(state.phase);
    state.deadline = continueRunning ? Date.now() + state.remainingSeconds * 1000 : null;
    render();
    save();
  };
  let audioContext: AudioContext | undefined;
  const ensureAudioContext = () => {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) throw new Error('Audio playback is not supported by this browser.');
    audioContext ||= new AudioContextConstructor();
    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(error => console.warn('Pomodoro audio could not resume.', error));
    }
    return audioContext;
  };
  const playTransitionSound = (phase: PomodoroState['phase']) => {
    try {
      const context = ensureAudioContext();
      const notes = phase === 'break' ? [660, 880] : [880, 660];
      const startAt = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const noteStart = startAt + index * 0.18;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.17);
      });
    } catch (error) {
      console.warn('Pomodoro transition sound could not be played.', error);
    }
  };
  const completePhase = () => {
    state = completePomodoroPhase(state, Date.now());
    notice.textContent = t(state.phase === 'break' ? 'breakStarted' : 'studyReady');
    notice.classList.remove('hidden');
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    render();
    save();
    playTransitionSound(state.phase);
  };
  const tick = () => {
    if (state.deadline !== null && state.deadline <= Date.now()) completePhase();
    else render();
  };

  render();
  if (state.deadline !== null) tick();
  window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick);

  openButton.addEventListener('click', () => {
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !opening);
    panel.setAttribute('aria-hidden', String(!opening));
    openButton.setAttribute('aria-expanded', String(opening));
    if (opening) toggleButton.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.classList.contains('hidden')) return;
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (panel.classList.contains('hidden') || widget.contains(event.target as Node)) return;
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
  });

      return;
    }
    state.remainingSeconds = duration(state.phase);
    if (state.deadline !== null) state.deadline = Date.now() + state.remainingSeconds * 1000;
    notice.classList.add('hidden');
    render();
    save();
  };

  toggleButton.addEventListener('click', () => {
    if (state.deadline === null) {
      try {
        ensureAudioContext();
      } catch (error) {
        console.warn('Pomodoro transition sound could not be enabled.', error);
      }
      state.deadline = Date.now() + state.remainingSeconds * 1000;
      notice.classList.add('hidden');
    } else {
      state.remainingSeconds = remaining();
      state.deadline = null;
    }
    render();
    save();
  });
  resetButton.addEventListener('click', () => {
    state.phase = 'study';
    state.remainingSeconds = duration('study');
    state.deadline = null;
    notice.classList.add('hidden');
    render();
    save();
  });
  skipButton.addEventListener('click', () => {
    switchPhase();
    notice.classList.add('hidden');
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPomodoro);
else initPomodoro();
