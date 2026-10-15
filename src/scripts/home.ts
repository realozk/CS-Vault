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
  year: string;
  url: string;
  yearLevel: number;
  semester: number;
}

const initTabsAndSearch = () => {
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

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const year = button.getAttribute('data-year-tab');

      tabButtons.forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn === button));
      });

      // Toggle visibility of columns
      contentBlocks.forEach(block => {
        if (block.getAttribute('data-year-content') === year) {
          block.classList.remove('hidden');
        } else {
          block.classList.add('hidden');
        }
      });
    });
  });

  // 2. Global fuzzy search engine
  const directoryContainer = document.getElementById('directory-container');
  if (!directoryContainer) return;

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

  const searchInput = document.getElementById('global-search-input');
  const searchResultsPane = document.getElementById('search-results-pane');
  const coreTabView = document.getElementById('core-tab-view');
  const resultsGrid = document.getElementById('search-results-grid');
  const resultsCount = document.getElementById('search-results-count');
  const noResults = document.getElementById('search-no-results');

  if (!searchInput || !searchResultsPane || !coreTabView || !resultsGrid || !resultsCount || !noResults) return;

  let debounceTimer: ReturnType<typeof setTimeout>;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
    const target = e.target as HTMLInputElement;
    const query = target.value.toLowerCase().trim();

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
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.subjectCode.toLowerCase().includes(query)
      );
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
    }, 250);
  });
};

initTabsAndSearch();
window.addEventListener('pageshow', event => {
  if (event.persisted) refreshNewContentBadges(document);
});
