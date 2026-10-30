import type { Question, QuizData } from '../types';
import { getPracticeQuestions, prepareQuestionOptions, selectPracticeQuestions } from '../lib/quiz-questions';
import type { PackedStudyResources } from '../lib/study-resources';
import { getQuestionReportHref, getQuestionReportTarget } from '../lib/question-report';
import { attemptProgress, bestScoreStorageKey, questionBankFingerprint, readBestScore, readReview, updateBestScore, updateReview, shortReview, topicResults, secondsRemaining, readAttempt, createAttemptPlan, compactAttempt, type ReviewItem, type QuizAttempt, type AttemptPlan, type SessionKind } from './quiz-state';

const shuffle = <T>(values: T[]): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const renderInlineCode = (element: HTMLElement, text: string) => {
  const parts = text.split(/(`[^`]+`)/g);
  element.replaceChildren(...parts.map(part => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = document.createElement('code');
      code.className = 'quiz-inline-code';
      code.textContent = part.slice(1, -1);
      return code;
    }
    return document.createTextNode(part);
  }));
};

let cleanupQuizWidget: (() => void) | undefined;

const initQuizWidget = () => {
  const widget = document.getElementById('quiz-widget');
  if (!widget || widget.dataset.quizBound === 'true') return;
  widget.dataset.quizBound = 'true';
  cleanupQuizWidget?.();
  const abortController = new AbortController();
  const { signal } = abortController;
  const quiz: QuizData = JSON.parse(widget.dataset.quiz || '{}');
  if (!quiz.questions?.length) return;
  const questionBank = getPracticeQuestions(quiz.questions);
  const quizId = widget.dataset.quizId;
  if (!quizId) throw new Error('Quiz widget is missing its quiz ID.');
  const questionReporting = { base: widget.dataset.questionReportBase || '', quizId };
  const translations: Record<string, string> = JSON.parse(widget.dataset.translations || '{}');
  const originUrls: Record<string, string> = JSON.parse(widget.dataset.originUrls || '{}');
  const packedResources: PackedStudyResources = JSON.parse(widget.dataset.studyResources || '{"resources":[],"questions":{}}');
  type StudyLink = PackedStudyResources['resources'][number];
  const studyResources: Record<number, StudyLink> = Object.fromEntries(Object.entries(packedResources.questions).map(([id, index]) => [id, packedResources.resources[index]]));
  const t = (key: string) => translations[key] || key;
  const el = (id: string) => document.getElementById(`quiz-${id}`)!;
  const button = (id: string) => el(id) as HTMLButtonElement;
  const screens = {
    setup: el('start-screen'),
    resume: el('resume-screen'),
    active: el('active-screen'),
    results: el('result-screen'),
  };
  const footer = document.querySelector<HTMLElement>('.site-footer');
  const setFooterHidden = (hidden: boolean) => {
    if (!footer) return;
    footer.hidden = hidden;
    footer.style.display = hidden ? 'none' : '';
  };
  const show = (name: keyof typeof screens) => {
    for (const [key, screen] of Object.entries(screens)) screen.classList.toggle('hidden', key !== name);
    const isActive = name === 'active';
    document.body.classList.toggle('quiz-running', isActive);
    setFooterHidden(isActive);
  };
  const storageKey = `cs-vault-review-v1:${quizId}`;
  const attemptKey = `cs-vault-attempt-v1:${quizId}`;
  const langSwitchKey = 'cs-vault-quiz-lang-switch';
  const bestScoreKey = bestScoreStorageKey(quizId);
  const bankFingerprint = questionBankFingerprint(questionBank);
  let saved: ReviewItem[] = [];
  let persistedReview: ReviewItem[] = [];
  let pendingReview = new Map<number, ReviewItem | null>();
  let pendingClear = false;
  const storageWarning = () => { el('storage-status').textContent = t('storageUnavailable'); };
  const readStoredAttempt = (): QuizAttempt | null => {
    let local: QuizAttempt | null = null;
    let session: QuizAttempt | null = null;
    try {
      local = readAttempt(localStorage.getItem(attemptKey), questionBank, bankFingerprint);
    } catch { storageWarning(); }
    try { session = readAttempt(sessionStorage.getItem(attemptKey), questionBank, bankFingerprint); }
    catch { storageWarning(); }
    // A quota failure may leave an older local value behind after the session
    // fallback succeeds. Other tabs can also publish a newer local attempt.
    if (!local) return session;
    return session && (session.savedAt ?? 0) > (local.savedAt ?? 0) ? session : local;
  };
  const clearStoredAttempt = () => {
    try { localStorage.removeItem(attemptKey); } catch { storageWarning(); }
    try { sessionStorage.removeItem(attemptKey); } catch { storageWarning(); }
  };
  const loadSaved = () => {
    try {
      persistedReview = readReview(localStorage.getItem(storageKey), questionBank);
      if (!pendingClear) {
        const merged = new Map(persistedReview.map(item => [item.id, item]));
        for (const [id, item] of pendingReview) {
          if (item) merged.set(id, item);
          else merged.delete(id);
        }
        saved = [...merged.values()];
      }
    }
    catch { storageWarning(); }
    updateSavedReview();
  };
  const save = (cleared = false) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
      persistedReview = saved.map(item => ({ ...item }));
      pendingReview.clear();
      pendingClear = false;
    } catch {
      // Quota/read-only storage can still return the old value. Retain local
      // changes over that value; merge unrelated updates made by other tabs.
      const previous = new Map(persistedReview.map(item => [item.id, item]));
      const next = new Map(saved.map(item => [item.id, item]));
      pendingReview = new Map();
      for (const id of previous.keys()) if (!next.has(id)) pendingReview.set(id, null);
      for (const [id, item] of next) {
        const old = previous.get(id);
        if (!old || old.signature !== item.signature || old.dueAt !== item.dueAt || old.streak !== item.streak) pendingReview.set(id, item);
      }
      pendingClear ||= cleared;
      storageWarning();
    }
  };
  function updateSavedReview() {
    const due = saved.filter(item => item.dueAt <= Date.now()).length;
    el('saved-count').textContent = saved.length
      ? t('reviewCount').replace('{saved}', String(saved.length)).replace('{due}', String(due))
      : t('noSaved');
    button('review-saved-btn').disabled = !saved.length;
    button('clear-saved-btn').disabled = !saved.length;
    el('saved-section').classList.toggle('hidden', !saved.length);
  }
  loadSaved();

  const selectedMode = () => (widget.querySelector('input[name="quiz-mode"]:checked') as HTMLInputElement).value;
  const updateSettings = () => {
    const exam = selectedMode() === 'exam';
    el('timer-settings').classList.toggle('hidden', !exam);
    el('mode-help').textContent = t(exam ? 'examHelp' : 'practiceHelp');
    (el('minutes') as HTMLInputElement).disabled = !(el('use-timer') as HTMLInputElement).checked;
  };
  widget.querySelectorAll('input[name="quiz-mode"]').forEach(input => input.addEventListener('change', updateSettings, { signal }));
  el('use-timer').addEventListener('change', updateSettings, { signal });
  updateSettings();
  const sessionSelection = () => {
    const topic = (el('topic') as HTMLSelectElement).value || '';
    const quick = (el('length') as HTMLSelectElement).value === 'quick';
    const eligible = questionBank.filter(question => !topic || (question.topic || 'general') === topic);
    return { topic, quick, count: quick ? Math.min(10, eligible.length) : eligible.length };
  };
  const updateSessionSize = () => {
    const { count } = sessionSelection();
    el('session-size').textContent = t('sessionSize').replace('{count}', String(count));
    (document.getElementById('start-quiz-btn') as HTMLButtonElement).disabled = count === 0;
  };
  el('topic').addEventListener('change', updateSessionSize, { signal });
  el('length').addEventListener('change', updateSessionSize, { signal });
  updateSessionSize();

  let questions: Question[] = [];
  let answers = new Map<number, string>();
  let currentIndex = 0;
  let examMode = false;
  let running = false;
  let deadline: number | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let missed: Question[] = [];
  let sessionKind: SessionKind = 'full';
  let attemptPlan: AttemptPlan | undefined;
  let lastSavedAt = 0;
  const persistAttempt = (phase: QuizAttempt['phase'] = 'active', expired = false) => {
    lastSavedAt = Math.max(Date.now(), lastSavedAt + 1);
    if (!attemptPlan) return;
    const attempt = compactAttempt(attemptPlan, { savedAt: lastSavedAt, phase, examMode, sessionKind, currentIndex, deadline, expired, answers });
    const serialized = JSON.stringify(attempt);
    try {
      if (phase === 'active') localStorage.setItem(attemptKey, serialized);
      else localStorage.removeItem(attemptKey);
    } catch { storageWarning(); }
    try { sessionStorage.setItem(attemptKey, serialized); } catch { storageWarning(); }
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

  const pageReference = (q: Question) => {
    const lecturePrefix = q.sourceLecture ? `${t('lectureGroup').replace('{number}', String(q.sourceLecture))} · ` : '';
    if (q.sourcePage) return `${lecturePrefix}${t('sourcePage').replace('{page}', String(q.sourcePage))}`;
    const slides = q.sourceSlides || (q.sourceSlide ? [q.sourceSlide] : []);
    if (!slides.length) return q.sourceLecture ? t('lectureGroup').replace('{number}', String(q.sourceLecture)) : '';
    const ranges: string[] = [];
    for (const slide of [...new Set(slides)].sort((a, b) => a - b)) {
      const lastRange = ranges[ranges.length - 1]?.match(/^(\d+)[–-](\d+)$/);
      if (lastRange && Number(lastRange[2]) + 1 === slide) {
        ranges[ranges.length - 1] = `${lastRange[1]}–${slide}`;
      } else if (ranges.length && Number(ranges[ranges.length - 1]) + 1 === slide) {
        ranges[ranges.length - 1] = `${ranges[ranges.length - 1]}–${slide}`;
      } else {
        ranges.push(String(slide));
      }
    }
    const slideRef = q.sourceSlides
      ? t('sourceSlides').replace('{slides}', ranges.join(', '))
      : t('sourceSlide').replace('{slide}', ranges[0]);
    return `${lecturePrefix}${slideRef}`;
  };
  const sourceReference = (q: Question) => [q.origin?.source, pageReference(q)].filter(Boolean).join(' · ');
  const originLink = (q: Question) => {
    if (!q.origin || !originUrls[q.origin.quizId]) return null;
    const link = document.createElement('a');
    link.href = originUrls[q.origin.quizId];
    link.className = 'underline underline-offset-4';
    link.textContent = `${t('originalQuestion').replace('{id}', String(q.origin.questionId))} — ${q.origin.title}`;
    return link;
  };
  const answerNotice = (q: Question) => [q.answerSource === 'inferred' ? t('inferred') : '', q.optionsSource === 'generated' ? t('generatedOptions') : ''].filter(Boolean).join(' ');
  const showExplanation = (q: Question, revealed: boolean) => {
    const explanationBox = el('explanation-box');
    const resource = studyResources[q.id];
    const hasContent = Boolean(q.explanation || sourceReference(q) || answerNotice(q) || resource);
    if (examMode || !revealed || !hasContent) {
      explanationBox.classList.add('hidden');
      explanationBox.classList.remove('is-blurred');
      explanationBox.removeAttribute('aria-hidden');
      return;
    }
    renderInlineCode(el('explanation-text'), q.explanation || '');
    el('source-slide').textContent = sourceReference(q);
    const link = originLink(q);
    el('origin').replaceChildren(...(link ? [link] : []));
    el('origin').className = 'mt-2 text-xs';
    el('answer-warning').textContent = answerNotice(q);
    const studyLink = resource ? document.createElement('a') : null;
    if (studyLink && resource) { studyLink.href = resource.href; studyLink.textContent = `${t('readRelevantNotes')} — ${resource.title}`; }
    el('study-resource').replaceChildren(...(studyLink ? [studyLink] : []));
    el('study-resource').classList.toggle('hidden', !studyLink);
    explanationBox.classList.remove('hidden');
    explanationBox.classList.toggle('is-blurred', !revealed);
    if (revealed) explanationBox.removeAttribute('aria-hidden');
    else explanationBox.setAttribute('aria-hidden', 'true');
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
    button('next-btn').disabled = false;
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
      showExplanation(q, true);
    }
    persistAttempt();
  };
  const renderQuestion = (animate = true) => {
    const q = questions[currentIndex];
    widget.dataset.currentQuestionId = String(q.id);
    const contentLang = q.origin?.lang || quiz.lang || 'en';
    el('question-content').dir = contentLang === 'ar' ? 'rtl' : 'ltr';
    el('question-content').lang = contentLang;
    el('explanation-text').dir = contentLang === 'ar' ? 'rtl' : 'ltr';
    el('explanation-text').lang = contentLang;
    el('current-question-num').textContent = String(currentIndex + 1);
    renderInlineCode(el('question-text'), q.question);
    el('question-code').textContent = q.code || '';
    el('question-code').classList.toggle('hidden', !q.code);
    el('progress-bar').style.width = `${currentIndex / questions.length * 100}%`;
    const selected = answers.get(q.id);
    el('answer-status').textContent = selected === undefined
      ? ''
      : examMode
        ? t('answerSaved')
        : t(selected === q.correctAnswer ? 'correctFeedback' : 'incorrectFeedback');
    showExplanation(q, selected !== undefined);
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
      renderInlineCode(choice, `${String.fromCharCode(65 + index)}. ${option}`);
      choice.addEventListener('click', () => selectAnswer(option));
      el('options-container').append(choice);
    });
    const questionContent = widget.querySelector<HTMLElement>('.quiz-question-content');
    if (questionContent) {
      questionContent.classList.remove('quiz-question-animate');
      if (animate && document.documentElement?.dataset.studyMotion !== 'off') {
        void questionContent.offsetWidth;
        questionContent.classList.add('quiz-question-animate');
      }
    }
    paintOptions();
    persistAttempt();
    el('active-screen').scrollIntoView({ behavior: 'instant', block: 'start' });
    el('question-text').focus({ preventScroll: true });
  };

  function begin(source: Question[], kind: SessionKind = 'full') {
    stopTimer();
    questions = shuffle(getPracticeQuestions(source)).map(q => ({ ...q, options: prepareQuestionOptions(q, shuffle) }));
    if (!questions.length) return;
    answers = new Map();
    currentIndex = 0;
    examMode = kind !== 'review' && selectedMode() === 'exam';
    sessionKind = kind;
    attemptPlan = createAttemptPlan(questionBank, questions, bankFingerprint);
    const minutes = el('minutes') as HTMLInputElement;
    const timed = examMode && (el('use-timer') as HTMLInputElement).checked;
    if (timed && !minutes.reportValidity()) { show('setup'); return; }
    deadline = timed ? Date.now() + Number(minutes.value) * 60_000 : null;
    running = true;
    missed = [];
    el('total-questions-num').textContent = String(questions.length);
    el('timer').classList.toggle('hidden', deadline === null);
    el('timer').textContent = '';
    show('active');
    renderQuestion(false);
    startTimer();
  }

  const paragraph = (text: string, classes = '') => {
    const p = document.createElement('p'); renderInlineCode(p, text); p.className = classes; return p;
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
    el('custom-score-notice').classList.toggle('hidden', sessionKind === 'full' || sessionKind === 'review');
    el('progress-bar').style.width = '100%';
    el('topic-results').replaceChildren();
    const resultsByTopic = topicResults(questions, answers);
    const linkedResources = new Map<string, StudyLink>();
    for (const question of missed) {
      const resource = studyResources[question.id];
      if (resource) linkedResources.set(resource.href, resource);
    }
    el('study-next-links').replaceChildren();
    for (const resource of linkedResources.values()) {
      const link = document.createElement('a'); link.href = resource.href; link.textContent = resource.title;
      el('study-next-links').append(link);
    }
    el('study-next').classList.toggle('hidden', linkedResources.size === 0);
    for (const result of resultsByTopic) {
      const row = document.createElement('tr'); row.className = 'border-b border-gray-200 dark:border-zinc-800';
      const topic = document.createElement('th'); topic.scope = 'row'; topic.className = 'text-start py-3 font-medium';
      topic.textContent = translations[`topic.${result.topic}`] || result.topic.replaceAll('-', ' ');
      const value = document.createElement('td'); value.className = 'text-start py-3';
      value.textContent = `${result.correct}/${result.total} · ${Math.round(result.correct / result.total * 100)}% · ${t(result.correct === result.total ? 'allCorrect' : 'needsReview')}`;
      row.append(topic, value); el('topic-results').append(row);
    }
    el('mistake-list').replaceChildren();
    if (!missed.length) el('mistake-list').append(paragraph(t('noMistakes')));
    for (const q of missed) {
      const card = document.createElement('article');
      card.lang = q.origin?.lang || quiz.lang || 'en';
      card.dir = card.lang === 'ar' ? 'rtl' : 'ltr';
      card.className = 'border border-gray-200 dark:border-zinc-800 rounded-md p-4 text-start space-y-2';
      const heading = document.createElement('h4'); renderInlineCode(heading, q.question); heading.className = 'font-bold'; card.append(heading);
      if (q.code) { const code = document.createElement('pre'); code.textContent = q.code; code.dir = 'ltr'; code.className = 'overflow-x-auto text-sm text-left'; card.append(code); }
      card.append(paragraph(`${t('yourAnswer')}: ${answers.get(q.id) || t('unanswered')}`, 'text-sm text-red-700 dark:text-red-300'));
      card.append(paragraph(`${t('correctAnswer')}: ${q.correctAnswer}`, 'text-sm text-green-700 dark:text-green-300'));
      if (q.explanation) card.append(paragraph(q.explanation, 'text-sm text-gray-600 dark:text-gray-300'));
      if (sourceReference(q)) card.append(paragraph(sourceReference(q), 'text-xs text-gray-500'));
      const link = originLink(q);
      if (link) { const source = document.createElement('p'); source.className = 'text-xs'; source.append(link); card.append(source); }
      if (answerNotice(q)) card.append(paragraph(answerNotice(q), 'text-xs text-amber-800 dark:text-amber-300'));
      const resource = studyResources[q.id];
      if (resource) {
        const link = document.createElement('a'); link.href = resource.href; link.textContent = `${t('readRelevantNotes')} — ${resource.title}`;
        const reading = document.createElement('p'); reading.append(link); reading.className = 'quiz-reading-link'; card.append(reading);
      }
      const reportTarget = questionReporting.base && getQuestionReportTarget(questionReporting.quizId, quiz, q.id);
      if (reportTarget) {
        const report = document.createElement('a');
        report.href = getQuestionReportHref(questionReporting.base, reportTarget);
        report.textContent = t('reportQuestion');
        const reporting = document.createElement('p'); reporting.className = 'quiz-reading-link'; reporting.append(report); card.append(reporting);
      }
      el('mistake-list').append(card);
    }
    button('retry-missed-btn').classList.toggle('hidden', !missed.length);
    if (!restoring) {
      loadSaved();
      saved = updateReview(saved, questions, answers, Date.now());
      save();
      updateSavedReview();
      if (sessionKind === 'full') {
        try {
          const previous = readBestScore(localStorage.getItem(bestScoreKey), questions.length, bankFingerprint);
          const best = updateBestScore(previous, score, questions.length, bankFingerprint);
          localStorage.setItem(bestScoreKey, JSON.stringify(best));
        } catch {
          storageWarning();
        }
      }
    }
    persistAttempt('results', expired);
    show('results');
    el('result-title').focus({ preventScroll: false });
  }

  document.getElementById('start-quiz-btn')!.addEventListener('click', () => {
    const { topic, quick } = sessionSelection();
    const selected = selectPracticeQuestions(questionBank, { topic, ...(quick ? { limit: 10 } : {}) }, shuffle);
    begin(selected, quick ? 'quick' : topic ? 'topic' : 'full');
  }, { signal });
  button('next-btn').addEventListener('click', () => {
    if (!running || checkExpiry() || button('next-btn').disabled) return;
    if (currentIndex === questions.length - 1) finish();
    else { currentIndex++; renderQuestion(); }
  }, { signal });
  button('previous-btn').addEventListener('click', () => {
    if (!running || checkExpiry() || currentIndex === 0) return;
    currentIndex--; renderQuestion();
  }, { signal });
  button('submit-btn').addEventListener('click', () => { if (!checkExpiry()) finish(); }, { signal });
  button('restart-btn').addEventListener('click', () => begin(questionBank), { signal });
  button('retry-missed-btn').addEventListener('click', () => begin(shuffle(missed).slice(0, 5), 'review'), { signal });
  button('review-saved-btn').addEventListener('click', () => {
    loadSaved();
    const review = shortReview(questionBank, saved);
    if (review.length) begin(review, 'review');
  }, { signal });
  button('clear-saved-btn').addEventListener('click', () => {
    saved = [];
    save(true);
    updateSavedReview();
  }, { signal });
  button('settings-btn').addEventListener('click', () => {
    clearStoredAttempt();
    show('setup'); document.getElementById('start-quiz-btn')!.focus();
  }, { signal });
  button('continue-btn').addEventListener('click', () => {
    if (answers.has(questions[currentIndex]?.id) && answers.size < questions.length) {
      for (let offset = 1; offset < questions.length; offset++) {
        const candidate = (currentIndex + offset) % questions.length;
        if (!answers.has(questions[candidate].id)) {
          currentIndex = candidate;
          break;
        }
      }
    }
    running = true;
    el('total-questions-num').textContent = String(questions.length);
    el('timer').classList.toggle('hidden', deadline === null);
    el('timer').textContent = '';
    if (!checkExpiry()) {
      show('active');
      renderQuestion(false);
      startTimer();
    }
  }, { signal });
  button('redo-btn').addEventListener('click', () => {
    clearStoredAttempt();
    begin(questions, sessionKind);
  }, { signal });
  button('resume-settings-btn').addEventListener('click', () => {
    clearStoredAttempt();
    running = false;
    show('setup');
    document.getElementById('start-quiz-btn')!.focus();
  }, { signal });
  cleanupQuizWidget = () => {
    stopTimer();
    abortController.abort();
    delete widget.dataset.quizBound;
    document.body.classList.remove('quiz-running');
    setFooterHidden(false);
  };
  document.addEventListener('astro:before-preparation', (event) => {
    const navEvent = event as Event & { from?: URL; to?: URL };
    const normalize = (pathname = '') => pathname.replace(/\/ar(?=\/|$)/, '').replace(/\/+$/, '') || '/';
    const isSameQuizDifferentLang = Boolean(
      navEvent.from && navEvent.to
      && navEvent.from.pathname !== navEvent.to.pathname
      && normalize(navEvent.from.pathname) === normalize(navEvent.to.pathname)
    );
    try {
      if (isSameQuizDifferentLang && (running || !screens.results.classList.contains('hidden'))) {
        sessionStorage.setItem(langSwitchKey, quizId);
      } else {
        sessionStorage.removeItem(langSwitchKey);
      }
    } catch { /* Ignore storage errors on navigation. */ }
  }, { signal });
  document.addEventListener('astro:before-swap', () => cleanupQuizWidget?.(), { signal });
  document.addEventListener('visibilitychange', () => {
    tick();
    if (!document.hidden) loadSaved();
  }, { signal });
  window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) loadSaved(); }, { signal });
  window.addEventListener('pagehide', stopTimer, { signal });
  window.addEventListener('pageshow', () => { if (running) startTimer(); }, { signal });
  document.addEventListener('keydown', event => {
    if (!running || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, a, summary, [contenteditable="true"]')) return;
    const key = event.key.toUpperCase();
    if (key >= 'A' && key <= 'Z') {
      const choice = el('options-container').querySelectorAll('button')[key.charCodeAt(0) - 65];
      if (choice && !choice.disabled) { event.preventDefault(); choice.click(); }
    } else if (key === 'ENTER' && target.tagName !== 'BUTTON' && !button('next-btn').disabled) {
      event.preventDefault(); button('next-btn').click();
    }
  }, { signal });

  const restoreAttempt = () => {
    let isLangSwitch = false;
    try {
      isLangSwitch = sessionStorage.getItem(langSwitchKey) === quizId;
      sessionStorage.removeItem(langSwitchKey);
    } catch { /* Ignore storage errors. */ }

    const attempt = readStoredAttempt();
    if (!attempt) {
      running = false;
      show('setup');
      return;
    }
    const byId = new Map(questionBank.map(q => [q.id, q]));
    lastSavedAt = Math.max(lastSavedAt, attempt.savedAt ?? 0);
    questions = attempt.questions.map(item => ({ ...byId.get(item.id)!, options: item.options }));
    answers = new Map(attempt.answers);
    currentIndex = attempt.currentIndex;
    examMode = attempt.examMode;
    sessionKind = attempt.sessionKind ?? (attempt.short ? 'review' : 'full');
    attemptPlan = createAttemptPlan(questionBank, questions, bankFingerprint);
    (el('length') as HTMLSelectElement).value = sessionKind === 'quick' ? 'quick' : 'full';
    const sessionTopics = [...new Set(questions.map(question => question.topic || 'general'))];
    (el('topic') as HTMLSelectElement).value = sessionKind !== 'full' && sessionTopics.length === 1 ? sessionTopics[0] : '';
    updateSessionSize();
    deadline = attempt.deadline;
    (widget.querySelector(`input[name="quiz-mode"][value="${examMode ? 'exam' : 'practice'}"]`) as HTMLInputElement).checked = true;
    (el('use-timer') as HTMLInputElement).checked = deadline !== null;
    updateSettings();
    el('total-questions-num').textContent = String(questions.length);
    el('timer').classList.toggle('hidden', deadline === null);
    el('timer').textContent = '';
    if (attempt.phase === 'results') {
      if (isLangSwitch) {
        running = true;
        finish(attempt.expired, true);
      } else {
        clearStoredAttempt();
        running = false;
        show('setup');
      }
      return;
    }
    if (answers.size === 0 && currentIndex === 0 && !isLangSwitch) {
      clearStoredAttempt();
      running = false;
      show('setup');
      return;
    }
    if (deadline !== null && secondsRemaining(deadline, Date.now()) === 0) {
      running = true;
      finish(true);
      return;
    }
    if (isLangSwitch) {
      running = true;
      show('active');
      renderQuestion(false);
      startTimer();
      return;
    }
    const progress = attemptProgress(attempt, questionBank);
    el('resume-solved').textContent = String(progress.solved);
    el('resume-left').textContent = String(progress.left);
    el('resume-correct-stat').classList.toggle('hidden', examMode);
    el('resume-wrong-stat').classList.toggle('hidden', examMode);
    el('resume-stats').style.gridTemplateColumns = examMode ? 'repeat(2, minmax(0, 1fr))' : '';
    el('resume-correct').textContent = examMode ? '' : String(progress.correct);
    el('resume-wrong').textContent = examMode ? '' : String(progress.wrong);
    el('resume-progress-bar').style.width = `${progress.solved / progress.total * 100}%`;
    el('resume-progress-text').textContent = t('resumeProgress')
      .replace('{solved}', String(progress.solved))
      .replace('{total}', String(progress.total));
    running = false;
    show('resume');
  };
  restoreAttempt();
  // A browser Back navigation may revive an older page from the back/forward
  // cache; reconcile it with the attempt saved by the other language route.
  window.addEventListener('pageshow', event => {
    if (event.persisted) { stopTimer(); restoreAttempt(); }
  }, { signal });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initQuizWidget);
else initQuizWidget();
document.addEventListener('astro:after-swap', initQuizWidget);
document.addEventListener('astro:page-load', initQuizWidget);
