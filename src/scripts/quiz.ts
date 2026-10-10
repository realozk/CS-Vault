import type { Question, QuizData } from '../types';
import { readReview, updateReview, topicResults, secondsRemaining, questionSignature, readAttempt, type ReviewItem, type QuizAttempt } from './quiz-state';

const shuffle = <T>(values: T[]): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const initQuizWidget = () => {
  const widget = document.getElementById('quiz-widget');
  if (!widget) return;
  const quiz: QuizData = JSON.parse(widget.dataset.quiz || '{}');
  if (!quiz.questions?.length) return;
  const translations: Record<string, string> = JSON.parse(widget.dataset.translations || '{}');
  const t = (key: string) => translations[key] || key;
  const el = (id: string) => document.getElementById(`quiz-${id}`)!;
  const button = (id: string) => el(id) as HTMLButtonElement;
  const screens = { setup: el('start-screen'), active: el('active-screen'), results: el('result-screen') };
  const show = (name: keyof typeof screens) => {
    for (const [key, screen] of Object.entries(screens)) screen.classList.toggle('hidden', key !== name);
    document.body.classList.toggle('quiz-running', name === 'active');
  };
  const storageKey = `cs-vault-review-v1:${widget.dataset.quizId}`;
  const attemptKey = `cs-vault-attempt-v1:${widget.dataset.quizId}`;
  let saved: ReviewItem[] = [];
  const storageWarning = () => { el('storage-status').textContent = t('storageUnavailable'); };
  const loadSaved = () => {
    try { saved = readReview(localStorage.getItem(storageKey), quiz.questions); }
    catch { storageWarning(); }
  };
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch { storageWarning(); }
  };
  loadSaved();

  const selectedMode = () => (widget.querySelector('input[name="quiz-mode"]:checked') as HTMLInputElement).value;
  const updateSettings = () => {
    const exam = selectedMode() === 'exam';
    el('timer-settings').classList.toggle('hidden', !exam);
    el('mode-help').textContent = t(exam ? 'examHelp' : 'practiceHelp');
    (el('minutes') as HTMLInputElement).disabled = !(el('use-timer') as HTMLInputElement).checked;
    el('mode-subtext').textContent = t(exam ? 'examSubtext' : 'subtext');
  };
  widget.querySelectorAll('input[name="quiz-mode"]').forEach(input => input.addEventListener('change', updateSettings));
  el('use-timer').addEventListener('change', updateSettings);
  updateSettings();

  let questions: Question[] = [];
  let answers = new Map<number, string>();
  let currentIndex = 0;
  let examMode = false;
  let running = false;
  let deadline: number | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let missed: Question[] = [];
  let shortSession = false;
  const persistAttempt = (phase: QuizAttempt['phase'] = 'active', expired = false) => {
    const attempt: QuizAttempt = {
      version: 1, phase, examMode, short: shortSession, currentIndex, deadline, expired,
      questions: questions.map(q => ({ id: q.id, signature: questionSignature(q), options: q.options })),
      answers: [...answers],
    };
    try { sessionStorage.setItem(attemptKey, JSON.stringify(attempt)); }
    catch { storageWarning(); }
  };
  const stopTimer = () => { if (timer !== undefined) clearInterval(timer); timer = undefined; };
  const checkExpiry = () => {
    if (running && deadline !== null && secondsRemaining(deadline, Date.now()) === 0) {
      finish(true);
      return true;
    }
    return false;
  };
  const tick = () => {
    if (!running || deadline === null || checkExpiry()) return;
    const seconds = secondsRemaining(deadline, Date.now());
    el('timer').textContent = `${t('timeRemaining')}: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const startTimer = () => { stopTimer(); if (deadline !== null && running) { tick(); if (running) timer = setInterval(tick, 1000); } };

  const sourceReference = (q: Question) => q.sourcePage ? t('sourcePage').replace('{page}', String(q.sourcePage)) : q.sourceSlide ? t('sourceSlide').replace('{slide}', String(q.sourceSlide)) : '';
  const answerNotice = (q: Question) => [q.answerSource === 'inferred' ? t('inferred') : '', q.optionsSource === 'generated' ? t('generatedOptions') : ''].filter(Boolean).join(' ');
  const showExplanation = (q: Question) => {
    el('explanation-text').textContent = q.explanation || '';
    el('source-slide').textContent = sourceReference(q);
    el('answer-warning').textContent = answerNotice(q);
    el('explanation-box').classList.toggle('hidden', !q.explanation && !sourceReference(q) && !answerNotice(q));
  };
  const paintOptions = () => {
    const q = questions[currentIndex];
    const selected = answers.get(q.id);
    el('options-container').querySelectorAll('button').forEach(option => {
      const value = option.dataset.option;
      const answered = selected !== undefined;
      option.disabled = !examMode && answered;
      option.setAttribute('aria-pressed', String(value === selected));
      option.className = 'w-full text-left p-4 rounded border transition-colors cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';
      if (!examMode && answered && value === q.correctAnswer) {
        option.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-950/20');
      } else if (!examMode && answered && value === selected) {
        option.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-950/20');
      } else if (value === selected) {
        option.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/20');
      } else {
        option.classList.add('border-gray-200', 'dark:border-zinc-800', 'hover:border-blue-500');
      }
    });
    button('next-btn').disabled = !examMode && selected === undefined;
  };
  const selectAnswer = (option: string) => {
    if (!running || checkExpiry()) return;
    const q = questions[currentIndex];
    if (!examMode && answers.has(q.id)) return;
    answers.set(q.id, option);
    paintOptions();
    if (examMode) el('answer-status').textContent = t('answerSaved');
    else {
      el('answer-status').textContent = t(option === q.correctAnswer ? 'correctFeedback' : 'incorrectFeedback');
      showExplanation(q);
    }
    persistAttempt();
  };
  const renderQuestion = () => {
    const q = questions[currentIndex];
    el('current-question-num').textContent = String(currentIndex + 1);
    el('question-text').textContent = q.question;
    el('question-code').textContent = q.code || '';
    el('question-code').classList.toggle('hidden', !q.code);
    el('progress-bar').style.width = `${currentIndex / questions.length * 100}%`;
    el('explanation-box').classList.add('hidden');
    const selected = answers.get(q.id);
    el('answer-status').textContent = selected === undefined
      ? ''
      : examMode
        ? t('answerSaved')
        : t(selected === q.correctAnswer ? 'correctFeedback' : 'incorrectFeedback');
    if (!examMode && selected !== undefined) showExplanation(q);
    button('next-btn').textContent = t(currentIndex === questions.length - 1 ? (examMode ? 'submit' : 'finish') : 'next');
    button('previous-btn').classList.toggle('hidden', currentIndex === 0);
    button('previous-btn').disabled = currentIndex === 0;
    button('submit-btn').classList.toggle('hidden', !examMode || currentIndex === questions.length - 1);
    el('options-container').replaceChildren();
    q.options.forEach((option, index) => {
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.dataset.option = option;
      // Text-only rendering keeps authored content out of HTML parsing.
      choice.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
      choice.addEventListener('click', () => selectAnswer(option));
      el('options-container').append(choice);
    });
    paintOptions();
    persistAttempt();
    el('active-screen').scrollIntoView({ behavior: 'instant', block: 'start' });
    el('question-text').focus({ preventScroll: true });
  };

  function begin(source: Question[], short = false) {
    stopTimer();
    questions = shuffle(source).map(q => ({ ...q, options: shuffle(q.options) }));
    if (!questions.length) return;
    answers = new Map();
    currentIndex = 0;
    examMode = !short && selectedMode() === 'exam';
    shortSession = short;
    const minutes = el('minutes') as HTMLInputElement;
    const timed = examMode && (el('use-timer') as HTMLInputElement).checked;
    if (timed && !minutes.reportValidity()) { show('setup'); return; }
    deadline = timed ? Date.now() + Number(minutes.value) * 60_000 : null;
    running = true;
    missed = [];
    el('total-questions-num').textContent = String(questions.length);
    el('timer').textContent = t(short ? 'shortActive' : examMode ? 'exam' : 'active');
    show('active');
    renderQuestion();
    startTimer();
  }

  const paragraph = (text: string, classes = '') => {
    const p = document.createElement('p'); p.textContent = text; p.className = classes; return p;
  };
  function finish(expired = false, restoring = false) {
    if (!running) return;
    running = false;
    stopTimer();
    const score = questions.filter(q => answers.get(q.id) === q.correctAnswer).length;
    const percentage = Math.round(score / questions.length * 100);
    missed = questions.filter(q => answers.get(q.id) !== q.correctAnswer);
    el('score-ratio').textContent = `${score}/${questions.length}`;
    el('score-percentage').textContent = `${percentage}%`;
    el('performance-desc').textContent = t(`score.${percentage === 100 ? 100 : percentage >= 80 ? 80 : percentage >= 50 ? 50 : 0}`);
    el('expired-message').classList.toggle('hidden', !expired);
    el('progress-bar').style.width = '100%';
    el('topic-results').replaceChildren();
    for (const result of topicResults(questions, answers)) {
      const row = document.createElement('tr'); row.className = 'border-b border-gray-200 dark:border-zinc-800';
      const topic = document.createElement('th'); topic.scope = 'row'; topic.className = 'text-start py-3 font-medium';
      topic.textContent = translations[`topic.${result.topic}`] || result.topic;
      const value = document.createElement('td'); value.className = 'text-start py-3';
      value.textContent = `${result.correct}/${result.total} · ${t(result.correct === result.total ? 'allCorrect' : 'needsReview')}`;
      row.append(topic, value); el('topic-results').append(row);
    }
    el('mistake-list').replaceChildren();
    if (!missed.length) el('mistake-list').append(paragraph(t('noMistakes')));
    for (const q of missed) {
      const card = document.createElement('article'); card.dir = 'ltr';
      card.className = 'border border-gray-200 dark:border-zinc-800 rounded-md p-4 text-start space-y-2';
      const heading = document.createElement('h4'); heading.textContent = q.question; heading.className = 'font-bold'; card.append(heading);
      if (q.code) { const code = document.createElement('pre'); code.textContent = q.code; code.className = 'overflow-x-auto text-sm'; card.append(code); }
      card.append(paragraph(`${t('yourAnswer')}: ${answers.get(q.id) || t('unanswered')}`, 'text-sm text-red-700 dark:text-red-300'));
      card.append(paragraph(`${t('correctAnswer')}: ${q.correctAnswer}`, 'text-sm text-green-700 dark:text-green-300'));
      if (q.explanation) card.append(paragraph(q.explanation, 'text-sm text-gray-600 dark:text-gray-300'));
      if (sourceReference(q)) card.append(paragraph(sourceReference(q), 'text-xs text-gray-500'));
      if (answerNotice(q)) card.append(paragraph(answerNotice(q), 'text-xs text-amber-800 dark:text-amber-300'));
      el('mistake-list').append(card);
    }
    button('retry-missed-btn').classList.toggle('hidden', !missed.length);
    if (!restoring) {
      loadSaved();
      saved = updateReview(saved, questions, answers, Date.now());
      save();
    }
    persistAttempt('results', expired);
    show('results');
    el('result-title').focus({ preventScroll: false });
  }

  document.getElementById('start-quiz-btn')!.addEventListener('click', () => begin(quiz.questions));
  button('next-btn').addEventListener('click', () => {
    if (!running || checkExpiry() || button('next-btn').disabled) return;
    if (currentIndex === questions.length - 1) finish();
    else { currentIndex++; renderQuestion(); }
  });
  button('previous-btn').addEventListener('click', () => {
    if (!running || checkExpiry() || currentIndex === 0) return;
    currentIndex--; renderQuestion();
  });
  button('submit-btn').addEventListener('click', () => { if (!checkExpiry()) finish(); });
  button('restart-btn').addEventListener('click', () => begin(quiz.questions));
  button('retry-missed-btn').addEventListener('click', () => begin(shuffle(missed).slice(0, 5), true));
  button('settings-btn').addEventListener('click', () => {
    try { sessionStorage.removeItem(attemptKey); } catch { storageWarning(); }
    show('setup'); document.getElementById('start-quiz-btn')!.focus();
  });
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('pagehide', stopTimer);
  window.addEventListener('pageshow', () => { if (running) startTimer(); });
  document.addEventListener('keydown', event => {
    if (!running || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target as HTMLElement;
    if (target.matches('input, textarea, select, [contenteditable="true"]')) return;
    const key = event.key.toUpperCase();
    if (key >= 'A' && key <= 'Z') {
      const choice = el('options-container').querySelectorAll('button')[key.charCodeAt(0) - 65];
      if (choice && !choice.disabled) { event.preventDefault(); choice.click(); }
    } else if (key === 'ENTER' && target.tagName !== 'BUTTON' && !button('next-btn').disabled) {
      event.preventDefault(); button('next-btn').click();
    }
  });

  const restoreAttempt = () => {
    let attempt: QuizAttempt | null = null;
    try { attempt = readAttempt(sessionStorage.getItem(attemptKey), quiz.questions); }
    catch { storageWarning(); }
    if (!attempt) {
      running = false;
      show('setup');
      return;
    }
    const byId = new Map(quiz.questions.map(q => [q.id, q]));
    questions = attempt.questions.map(item => ({ ...byId.get(item.id)!, options: item.options }));
    answers = new Map(attempt.answers);
    currentIndex = attempt.currentIndex;
    examMode = attempt.examMode;
    shortSession = attempt.short;
    deadline = attempt.deadline;
    running = true;
    (widget.querySelector(`input[name="quiz-mode"][value="${examMode ? 'exam' : 'practice'}"]`) as HTMLInputElement).checked = true;
    (el('use-timer') as HTMLInputElement).checked = deadline !== null;
    updateSettings();
    el('total-questions-num').textContent = String(questions.length);
    el('timer').textContent = t(shortSession ? 'shortActive' : examMode ? 'exam' : 'active');
    if (attempt.phase === 'results') finish(attempt.expired, true);
    else if (!checkExpiry()) {
      show('active');
      renderQuestion();
      startTimer();
    }
  };
  restoreAttempt();
  // A browser Back navigation may revive an older page from the back/forward
  // cache; reconcile it with the attempt saved by the other language route.
  window.addEventListener('pageshow', event => {
    if (event.persisted) { stopTimer(); restoreAttempt(); }
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initQuizWidget);
else initQuizWidget();
