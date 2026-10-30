import { escapeHTML } from './utils';
import { arabicQuotes } from '../data/arabic-quotes';
import { englishQuotes } from '../data/english-quotes';
import { refreshNewContentBadges } from './content-recency';

interface SearchItem {
  type: 'subject' | 'summary' | 'quiz';
  title: string;
  description: string;
  author: string;
  subjectCode: string;
  subjectNames: string[];
  year: string;
  url: string;
  yearLevel: number;
  semester: number;
}

let cleanupHome: (() => void) | undefined;

const initTabsAndSearch = () => {
  const directoryContainer = document.getElementById('directory-container');
  if (!directoryContainer || directoryContainer.dataset.initialized === 'true') return;
  directoryContainer.dataset.initialized = 'true';
  cleanupHome?.();
  const abortController = new AbortController();
  const { signal } = abortController;
  cleanupHome = () => {
    abortController.abort();
    delete directoryContainer.dataset.initialized;
  };
  document.addEventListener('astro:before-swap', () => cleanupHome?.(), { signal });

  refreshNewContentBadges(document);
  const quoteElement = document.querySelector<HTMLElement>('[data-random-home-quote]');
  const lang = quoteElement?.dataset.randomHomeQuote;
  if (quoteElement && (lang === 'ar' || lang === 'en')) {
    const quotes = lang === 'ar' ? arabicQuotes : englishQuotes;
    const storageKey = `home-${lang}-quote`;
    let previousQuote: string | null = null;
    try {
      previousQuote = localStorage.getItem(storageKey);
    } catch {
      // Random quote selection still works when storage is unavailable.
    }

    const availableQuotes = quotes.filter(quote => quote !== previousQuote);
    const quote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    quoteElement.textContent = quote;

    try {
      localStorage.setItem(storageKey, quote);
    } catch {
      // The quote remains visible for this visit.
    }
  }

  // 1. Year tab filtering
  const tabButtons = document.querySelectorAll('[data-year-tab]');
  const contentBlocks = document.querySelectorAll('[data-year-content]');

  const defaultYear = [...tabButtons].find(button => button.getAttribute('aria-pressed') === 'true')?.getAttribute('data-year-tab');
  const selectYear = (year: string | null | undefined, persist = false) => {
    const selectedButton = [...tabButtons].find(button => button.getAttribute('data-year-tab') === year);
    if (!selectedButton) return;
    tabButtons.forEach(button => button.setAttribute('aria-pressed', String(button === selectedButton)));
    contentBlocks.forEach(block => block.classList.toggle('hidden', block.getAttribute('data-year-content') !== year));
    if (persist) {
      const url = new URL(window.location.href);
      url.searchParams.set('year', year!);
      window.history.replaceState(window.history.state, '', url);
      window.dispatchEvent(new Event('locationchange'));
    }
  };
  const restoreYear = () => {
    const requestedYear = new URL(window.location.href).searchParams.get('year');
    const validYear = [...tabButtons].some(button => button.getAttribute('data-year-tab') === requestedYear);
    selectYear(validYear ? requestedYear : defaultYear);
  };
  restoreYear();
  tabButtons.forEach(button => button.addEventListener('click', () => selectYear(button.getAttribute('data-year-tab'), true)));
  window.addEventListener('popstate', restoreYear, { signal });

  // 2. Global fuzzy search engine
  const rawSearchIndex = directoryContainer.getAttribute('data-search-index');
  let searchIndex: SearchItem[] = [];
  if (rawSearchIndex) {
    try {
      searchIndex = JSON.parse(rawSearchIndex);
    } catch (e) {
      console.error('[Home] Failed to parse search index:', e);
    }
  }

  const rawTranslations = directoryContainer.getAttribute('data-translations');
  let translations: Record<string, string> = {};
  if (rawTranslations) {
    try {
      translations = JSON.parse(rawTranslations);
    } catch (e) {
      console.error('[Home] Failed to parse translations:', e);
    }
  }

  const searchInput = document.querySelector<HTMLInputElement>('#global-search-input');
  const searchResultsPane = document.getElementById('search-results-pane');
  const coreTabView = document.getElementById('core-tab-view');
  const resultsGrid = document.getElementById('search-results-grid');
  const resultsCount = document.getElementById('search-results-count');
  const noResults = document.getElementById('search-no-results');

  if (!searchInput || !searchResultsPane || !coreTabView || !resultsGrid || !resultsCount || !noResults) return;

  const searchModifier = document.querySelector<HTMLElement>('[data-search-modifier]');
  if (searchModifier) {
    searchModifier.textContent = /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
  }

  const updateSearchResults = () => {
    const query = searchInput.value.normalize('NFKC').toLowerCase().trim();

    if (query === '') {
      // Show core tab view, hide search pane
      searchResultsPane.classList.add('hidden');
      coreTabView.classList.remove('hidden');
      return;
    }

    // Hide tabs, show search pane
    coreTabView.classList.add('hidden');
    searchResultsPane.classList.remove('hidden');

    // Filter index
    const matched = searchIndex.filter(item => {
      const text = [item.title, item.description, ...item.subjectNames].join('\n').normalize('NFKC').toLowerCase();
      const compactCode = item.subjectCode.toLowerCase().replace(/[\s-]+/g, '');
      const compactQuery = query.replace(/[\s-]+/g, '');
      return text.includes(query) || (compactQuery !== '' && compactCode.includes(compactQuery));
    });

    // Render search results
    resultsGrid.innerHTML = '';
    const matchesWord = translations.resultsCount || (matched.length === 1 ? 'match' : 'matches');
    resultsCount.textContent = `${matched.length} ${matchesWord}`;

    if (matched.length === 0) {
      noResults.classList.remove('hidden');
      return;
    }
    noResults.classList.add('hidden');

    matched.forEach(item => {
      const summaryBadgeText = translations.summaryBadge || 'Summary';
      const quizBadgeText = translations.quizBadge || 'Quiz';
      const typeLabel = item.type === 'subject'
        ? translations.subjectBadge || 'Subject'
        : item.type === 'summary' ? summaryBadgeText : quizBadgeText;
      const actionLabel = item.type === 'quiz' ? translations.openQuiz : item.type === 'summary' ? translations.readSummary : translations.openSubject;
      const resultCard = document.createElement('a');
      resultCard.href = item.url;
      resultCard.className = 'search-result';
      resultCard.innerHTML = `
        <div>
          <div class="search-result-meta">
            <span class="search-result-type">${escapeHTML(typeLabel)}</span>
            <span>${escapeHTML(item.subjectCode)} · ${escapeHTML(item.year)}</span>
          </div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>
        </div>
        <div class="search-result-bottom">
          <span>${escapeHTML((translations.yearAndSem || 'Year {year} • Sem {sem}').replace('{year}', item.yearLevel.toString()).replace('{sem}', item.semester.toString()))}</span>
          <span class="search-result-action">${escapeHTML(actionLabel || 'Open material →')}</span>
        </div>
      `;
      resultsGrid.appendChild(resultCard);
    });
  };

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    if (searchInput.value.trim() === '') {
      updateSearchResults();
      return;
    }
    debounceTimer = setTimeout(updateSearchResults, 100);
  });

  searchInput.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return;
    event.preventDefault();
    clearTimeout(debounceTimer);
    searchInput.value = '';
    updateSearchResults();
  });

  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'k' || (!event.ctrlKey && !event.metaKey) || event.isComposing || event.defaultPrevented || event.altKey || event.shiftKey) return;

    const target = event.target;
    if (target !== searchInput && target instanceof Element && target.closest('input, textarea, select')) return;
    if (target instanceof HTMLElement && target.isContentEditable) return;

    event.preventDefault();
    searchInput.focus();
  }, { signal });
};

initTabsAndSearch();
document.addEventListener('astro:after-swap', initTabsAndSearch);
document.addEventListener('astro:page-load', initTabsAndSearch);
window.addEventListener('pageshow', event => {
  if (event.persisted) refreshNewContentBadges(document);
});
