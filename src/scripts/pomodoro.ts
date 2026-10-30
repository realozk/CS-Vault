import { advancePomodoroState, createDefaultPomodoroState, formatPomodoroTime, getPomodoroPhaseDuration, getPomodoroRemainingSeconds, readPomodoroState, updatePomodoroDuration, type PomodoroState } from './pomodoro-state';

const STORAGE_KEY = 'cs-vault-pomodoro-v1';
let cleanupPomodoro: (() => void) | undefined;

const initPomodoro = () => {
  const widget = document.getElementById('pomodoro-widget');
  if (!widget || widget.dataset.pomodoroBound === 'true') return;
  widget.dataset.pomodoroBound = 'true';
  cleanupPomodoro?.();
  const abortController = new AbortController();
  const { signal } = abortController;
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
  let lastStoredValue: string | null = null;
  const showStorageNotice = () => {
    storageStatus.textContent = t('storageUnavailable');
    storageStatus.classList.remove('hidden');
  };
  const syncFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Do not replace an unsaved in-memory timer with the same old value when
      // writes are blocked. A different saved value is an edit from another tab.
      if (stored !== lastStoredValue) {
        state = readPomodoroState(stored);
        lastStoredValue = stored;
        studyInput.value = String(state.studyMinutes);
        breakInput.value = String(state.breakMinutes);
        notice.classList.add('hidden');
      }
    } catch {
      showStorageNotice();
    }
  };
  const save = () => {
    try {
      const stored = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, stored);
      lastStoredValue = stored;
      storageStatus.classList.add('hidden');
    } catch {
      showStorageNotice();
    }
  };
  const duration = (phase: PomodoroState['phase']) => getPomodoroPhaseDuration(state, phase);
  const remaining = () => getPomodoroRemainingSeconds(state, Date.now());
  let previousTime = '';
  const renderTime = (nextTime: string, shouldAnimate: boolean) => {
    timeText.setAttribute('aria-label', nextTime);
    timeText.classList.toggle('is-running', state.deadline !== null);
    if (previousTime === nextTime && timeText.children.length === nextTime.length) return;
    const prevChars = previousTime.split('');
    const nextChars = nextTime.split('');
    previousTime = nextTime;

    if (timeText.children.length !== nextChars.length) {
      timeText.replaceChildren(
        ...nextChars.map((char) => {
          if (char === ':') {
            const colon = document.createElement('span');
            colon.className = 'pomodoro-colon';
            colon.textContent = ':';
            return colon;
          }
          const slot = document.createElement('span');
          slot.className = 'pomodoro-digit-slot';
          slot.dataset.prev = char;
          const current = document.createElement('span');
          current.className = 'pomodoro-digit-current';
          current.textContent = char;
          slot.append(current);
          return slot;
        }),
      );
      return;
    }

    nextChars.forEach((char, index) => {
      if (char === ':' || prevChars[index] === char) return;
      const slot = timeText.children[index] as HTMLElement | undefined;
      const current = slot?.querySelector<HTMLElement>('.pomodoro-digit-current');
      if (!slot || !current) return;
      slot.dataset.prev = prevChars[index] ?? char;
      current.textContent = char;
      if (shouldAnimate) {
        slot.classList.remove('is-ticking');
        void slot.offsetWidth;
        slot.classList.add('is-ticking');
      }
    });
  };
  const render = (shouldAnimate = true) => {
    phaseText.textContent = t(state.phase === 'study' ? 'studyPhase' : 'breakPhase');
    renderTime(formatPomodoroTime(remaining()), shouldAnimate);
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
    const advanced = advancePomodoroState(state, Date.now());
    if (advanced === state) return;
    state = advanced;
    notice.textContent = t(state.phase === 'break' ? 'breakStarted' : 'studyReady');
    notice.classList.remove('hidden');
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    render();
    save();
    playTransitionSound(state.phase);
  };
  let transitionPending = false;
  const tick = () => {
    syncFromStorage();
    if (state.deadline !== null && state.deadline <= Date.now()) {
      if (window.navigator?.locks) {
        if (!transitionPending) {
          transitionPending = true;
          void window.navigator.locks.request(STORAGE_KEY, { ifAvailable: true }, (lock) => {
            if (!lock) return;
            syncFromStorage();
            completePhase();
            render();
          }).catch((error) => {
            console.warn('Pomodoro transition could not acquire a browser lock.', error);
            syncFromStorage();
            completePhase();
            render();
          }).finally(() => { transitionPending = false; });
        }
      } else {
        completePhase();
      }
    }
    render();
  };
  const reconcileBeforeAction = () => {
    syncFromStorage();
    completePhase();
  };

  studyInput.value = String(state.studyMinutes);
  breakInput.value = String(state.breakMinutes);
  render(false);
  if (state.deadline !== null) tick();
  const intervalId = window.setInterval(tick, 1000);
  cleanupPomodoro = () => {
    window.clearInterval(intervalId);
    abortController.abort();
    delete widget.dataset.pomodoroBound;
  };
  document.addEventListener('astro:before-swap', () => cleanupPomodoro?.(), { signal });
  document.addEventListener('visibilitychange', tick, { signal });
  window.addEventListener('pageshow', tick, { signal });
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEY) tick();
  }, { signal });

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
  }, { signal });
  document.addEventListener('pointerdown', (event) => {
    if (panel.classList.contains('hidden') || widget.contains(event.target as Node)) return;
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
  }, { signal });

  const updateDuration = (phase: PomodoroState['phase'], input: HTMLInputElement) => {
    const enteredValue = input.value;
    const minutes = Number(enteredValue);
    reconcileBeforeAction();
    if (!enteredValue || !Number.isInteger(minutes) || minutes < 1) {
      input.value = String(phase === 'study' ? state.studyMinutes : state.breakMinutes);
      return;
    }
    const boundedMinutes = Math.min(minutes, 180);
    input.value = String(boundedMinutes);
    state = updatePomodoroDuration(state, phase, boundedMinutes, Date.now());
    notice.classList.add('hidden');
    render();
    save();
  };
  studyInput.addEventListener('change', () => updateDuration('study', studyInput));
  breakInput.addEventListener('change', () => updateDuration('break', breakInput));

  toggleButton.addEventListener('click', () => {
    reconcileBeforeAction();
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
    reconcileBeforeAction();
    state.phase = 'study';
    state.remainingSeconds = duration('study');
    state.deadline = null;
    notice.classList.add('hidden');
    render();
    save();
  });
  skipButton.addEventListener('click', () => {
    reconcileBeforeAction();
    switchPhase();
    notice.classList.add('hidden');
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPomodoro);
else initPomodoro();
document.addEventListener('astro:after-swap', initPomodoro);
document.addEventListener('astro:page-load', initPomodoro);
