import { bestScoreStorageKey, bestScoreTone, readBestScore } from './quiz-state';

const initDashboard = () => {
  const tabs = document.querySelectorAll<HTMLAnchorElement>('.summary-tab-btn');
  const contents = document.querySelectorAll<HTMLElement>('.summary-content-block');
  const checkboxes = document.querySelectorAll('.summary-checkbox') as NodeListOf<HTMLInputElement>;
  const progressFill = document.getElementById('subject-progress-fill');
  const progressPercentText = document.getElementById('progress-percentage-text');
  const progressStatusDesc = document.getElementById('progress-status-desc');

  const tracker = document.getElementById('subject-progress-card');
  const quizzesSection = document.getElementById('subject-quizzes');
  const scoreStorageStatus = document.getElementById('quiz-score-storage-status');
  const bestScoreBadges = document.querySelectorAll<HTMLElement>('[data-best-score]');
  const showScoreStorageNotice = () => {
    if (!scoreStorageStatus || !quizzesSection) return;
    scoreStorageStatus.textContent = quizzesSection.dataset.scoreStorageUnavailable || 'Quiz scores cannot be saved in this browser.';
    scoreStorageStatus.classList.remove('hidden');
  };
  const renderBestScores = () => {
    try {
      bestScoreBadges.forEach((badge) => {
        const quizId = badge.dataset.bestScore;
        const total = Number(badge.dataset.bestScoreTotal);
        if (!quizId || !Number.isInteger(total) || total < 1) {
          throw new Error('Quiz best-score badge is missing a valid quiz ID or question count.');
        }
        const score = readBestScore(localStorage.getItem(bestScoreStorageKey(quizId)), total, badge.dataset.bestScoreFingerprint || '');
        if (!score) {
          badge.textContent = '';
          badge.classList.add('hidden');
          return;
        }
        badge.textContent = (badge.dataset.bestScoreTemplate || 'Best score: {score}/{total} ({percentage}%)')
          .replace('{score}', String(score.correct))
          .replace('{total}', String(score.total))
          .replace('{percentage}', String(score.percentage));
        badge.classList.remove(
          'text-red-700', 'dark:text-red-300',
          'text-amber-700', 'dark:text-amber-300',
          'text-emerald-700', 'dark:text-emerald-300',
        );
        const tone = bestScoreTone(score.percentage);
        if (tone === 'red') {
          badge.classList.add('text-red-700', 'dark:text-red-300');
        } else if (tone === 'yellow') {
          badge.classList.add('text-amber-700', 'dark:text-amber-300');
        } else {
          badge.classList.add('text-emerald-700', 'dark:text-emerald-300');
        }
        badge.classList.remove('hidden');
      });
    } catch {
      showScoreStorageNotice();
    }
  };
  renderBestScores();
  window.addEventListener('pageshow', renderBestScores);
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('cs-vault-best-score-v2:')) renderBestScores();
  });

  const subject = tracker?.dataset.subject || 'unknown';
  const year = tracker?.dataset.year || 'unknown';
  const storageKey = `cs-vault-progress-${subject}-${year}`;

  // Parse progress translations
  const progressCard = document.getElementById('subject-progress-card');
  let translations: Record<string, string> = {};
  if (progressCard) {
    const rawTranslations = progressCard.getAttribute('data-translations');
    if (rawTranslations) {
      try {
        translations = JSON.parse(rawTranslations);
      } catch (e) {
        console.error('[Dashboard] Failed to parse tracker translations:', e);
      }
    }
  }

  const showStorageNotice = () => {
    const status = document.getElementById('progress-storage-status');
    if (status) {
      status.textContent = translations.storageUnavailable || 'Progress cannot be saved in this browser.';
      status.classList.remove('hidden');
    }
  };

  // Load progress from localStorage
  let completedSlugs: string[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const available = new Set([...checkboxes].map(cb => cb.dataset.summaryCheck));
        completedSlugs = [...new Set(parsed.filter((slug): slug is string =>
          typeof slug === 'string' && available.has(slug)))];
      }
    }
  } catch {
    showStorageNotice();
  }

  const updateProgressBar = () => {
    const total = checkboxes.length;
    if (total === 0) return;
    const checkedCount = completedSlugs.length;
    const percent = Math.round((checkedCount / total) * 100);

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressPercentText) progressPercentText.textContent = `${percent}%`;
    if (progressStatusDesc) {
      const template = translations.progressStatus || '{checked} of {total} summaries completed.';
      progressStatusDesc.textContent = template
        .replace('{checked}', checkedCount.toString())
        .replace('{total}', total.toString());
    }
  };

  // Initialize checklist checkbox states
  checkboxes.forEach((cb) => {
    const slug = cb.getAttribute('data-summary-check');
    if (!slug) return;
    const isChecked = completedSlugs.includes(slug);
    cb.checked = isChecked;
    
    const summaryLink = [...tabs].find(tab => tab.getAttribute('data-summary-slug') === slug);
    summaryLink?.classList.toggle('is-reviewed', isChecked);

    // Handle checkbox change
    cb.addEventListener('change', () => {
      const checked = cb.checked;
      if (checked) {
        if (!completedSlugs.includes(slug)) {
          completedSlugs.push(slug);
        }
        summaryLink?.classList.add('is-reviewed');
      } else {
        completedSlugs = completedSlugs.filter(item => item !== slug);
        summaryLink?.classList.remove('is-reviewed');
      }

      updateProgressBar();
      try {
        localStorage.setItem(storageKey, JSON.stringify(completedSlugs));
      } catch {
        showStorageNotice();
      }
    });

    // Prevent checklist toggles from triggering tab navigation switches
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Run initial progress calculation
  updateProgressBar();

  // 5. Code Block Copy Button Injector
  const initCopyButtons = () => {
    const preBlocks = document.querySelectorAll('.academic-prose pre');

    // Parse copy translations from document body
    const rawCopyTranslations = document.body.getAttribute('data-copy-translations');
    let copyTranslations: Record<string, string> = {};
    if (rawCopyTranslations) {
      try {
        copyTranslations = JSON.parse(rawCopyTranslations);
      } catch (e) {
        console.error('[Dashboard] Failed to parse copy translations:', e);
      }
    }
    const labelCopy = copyTranslations.copy || 'Copy code snippet';
    const labelCopied = copyTranslations.copied || 'Copied!';

    preBlocks.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code-btn';
      button.ariaLabel = labelCopy;
      button.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h10m-5-5v10"></path>
        </svg>
      `;

      button.addEventListener('click', async () => {
        const codeElement = pre.querySelector('code');
        const codeText = codeElement ? (codeElement as HTMLElement).innerText : '';
        
        try {
           await navigator.clipboard.writeText(codeText);
           
           button.classList.add('copied');
           button.ariaLabel = labelCopied;
           button.innerHTML = `
             <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
             </svg>
           `;
           
           setTimeout(() => {
             button.classList.remove('copied');
             button.ariaLabel = labelCopy;
             button.innerHTML = `
               <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h10m-5-5v10"></path>
               </svg>
             `;
           }, 1500);
        } catch (err) {
           console.error('Failed to copy text: ', err);
        }
      });

      pre.appendChild(button);
    });
  };

  const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' as const : 'smooth' as const;

  // Enhance the readable, anchor-based page into two focused task modes.
  const page = document.getElementById('subject-page');
  const modeSwitch = document.getElementById('subject-mode-switch');
  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-study-mode]');
  const modePanels = document.querySelectorAll<HTMLElement>('[data-study-panel]');
  type StudyMode = 'quizzes' | 'summaries';

  const setMode = (mode: StudyMode) => {
    if (!page || !modeSwitch) return;
    page.dataset.studyMode = mode;
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studyMode === mode)));
    modePanels.forEach(panel => panel.classList.toggle('hidden', panel.dataset.studyPanel !== mode));
  };

  const writeHash = (hash: string) => {
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  };

  const selectSummary = (slug: string, options: { scroll?: boolean; writeHistory?: boolean; activateMode?: boolean; focus?: boolean } = {}) => {
    const selected = [...contents].find(content => content.id === `summary-content-${slug}`);
    if (!selected) return;
    if (options.activateMode !== false) setMode('summaries');
    tabs.forEach(tab => {
      if (tab.dataset.summarySlug === slug) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    contents.forEach(content => content.classList.toggle('hidden', content !== selected));
    if (options.writeHistory) writeHash(`#${selected.id}`);
    if (options.focus) selected.querySelector('h2')?.focus({ preventScroll: true });
    if (options.scroll) selected.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    return selected;
  };

  const syncHash = (scroll = false) => {
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    if (!id) {
      setMode(page?.dataset.defaultStudyMode === 'summaries' ? 'summaries' : 'quizzes');
      return;
    }
    const target = document.getElementById(id);
    const summary = [...contents].find(content => content === target || (target && content.contains(target)));
    if (summary) {
      const slug = summary.id.slice('summary-content-'.length);
      selectSummary(slug);
    } else if (id === 'subject-quizzes' || (target && quizzesSection?.contains(target))) {
      setMode('quizzes');
    } else if (['subject-reading', 'subject-summaries', 'summary-tabs', 'subject-progress-card'].includes(id)) {
      setMode('summaries');
    } else {
      return;
    }
    if (scroll && target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
    }
  };

  if (page && modeSwitch) {
    page.dataset.studyEnhanced = 'true';
    modeSwitch.classList.remove('hidden');
    document.querySelectorAll('.subject-finish-button').forEach(button => button.classList.remove('hidden'));
    const firstSlug = tabs[0]?.dataset.summarySlug;
    if (firstSlug) selectSummary(firstSlug, { activateMode: false });
    setMode(page.dataset.defaultStudyMode === 'summaries' ? 'summaries' : 'quizzes');
    syncHash(true);
    window.addEventListener('hashchange', () => syncHash(true));
    window.addEventListener('popstate', () => syncHash(true));
  }

  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.dataset.studyMode === 'summaries' ? 'summaries' : 'quizzes';
      setMode(mode);
      writeHash(mode === 'summaries' ? '#subject-reading' : '#subject-quizzes');
    });
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const slug = tab.dataset.summarySlug;
      if (!slug) return;
      event.preventDefault();
      selectSummary(slug, { scroll: true, writeHistory: true });
    });
  });

  const markReviewed = (slug: string | null) => {
    const checkbox = [...checkboxes].find(input => input.dataset.summaryCheck === slug);
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }
  };

  // Keep the existing review-on-next and finish behavior.
  document.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const previous = event.target.closest<HTMLElement>('[data-nav-prev]');
    const next = event.target.closest<HTMLElement>('[data-nav-next]');
    const finish = event.target.closest<HTMLElement>('[data-nav-finish]');
    const navigation = previous || next;
    if (navigation) {
      event.preventDefault();
      if (next) markReviewed(next.getAttribute('data-current-slug'));
      const slug = navigation.getAttribute(previous ? 'data-nav-prev' : 'data-nav-next');
      if (slug) selectSummary(slug, { scroll: true, writeHistory: true, focus: true });
    } else if (finish) {
      markReviewed(finish.getAttribute('data-nav-finish'));
      if (tracker) {
        tracker.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        tracker.classList.add('ring-2', 'ring-emerald-500');
        setTimeout(() => tracker.classList.remove('ring-2', 'ring-emerald-500'), 1500);
      }
    }
  });

  // Run initial loaders
  initCopyButtons();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
