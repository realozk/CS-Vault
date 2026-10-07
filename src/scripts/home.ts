import { escapeHTML } from './utils';

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
  // 1. Year tab filtering
  const tabButtons = document.querySelectorAll('[data-year-tab]');
  const contentBlocks = document.querySelectorAll('[data-year-content]');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const year = button.getAttribute('data-year-tab');

      // Toggle active button styling
      tabButtons.forEach(btn => {
        btn.classList.remove('border-blue-600', 'dark:border-blue-500', 'text-blue-600', 'dark:text-blue-400');
        btn.classList.add('border-transparent', 'text-gray-500', 'dark:text-zinc-400', 'hover:text-gray-900', 'dark:hover:text-white', 'hover:border-gray-200', 'dark:hover:border-zinc-800');
      });
      button.classList.add('border-blue-600', 'dark:border-blue-500', 'text-blue-600', 'dark:text-blue-400');
      button.classList.remove('border-transparent', 'text-gray-500', 'dark:text-zinc-400', 'hover:text-gray-900', 'dark:hover:text-white', 'hover:border-gray-200', 'dark:hover:border-zinc-800');

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
      const typeBadge = item.type === 'subject' ? `<span class="text-xs text-gray-500">${translations.subjectBadge || 'Subject'}</span>` : item.type === 'summary'
        ? `<span class="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">${summaryBadgeText}</span>` 
        : `<span class="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">${quizBadgeText}</span>`;

      const resultCard = document.createElement('a');
      resultCard.href = item.url;
      resultCard.className = 'group p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 hover:border-blue-500 dark:hover:border-blue-500 rounded-md shadow-sm hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between';
      resultCard.innerHTML = `
        <div>
          <div class="flex items-center gap-2 mb-2">
            ${typeBadge}
            <span class="font-mono text-xs font-semibold text-gray-500 dark:text-zinc-500">${escapeHTML(item.subjectCode.toUpperCase())} (${escapeHTML(item.year)})</span>
          </div>
          <h4 class="font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm sm:text-base">${escapeHTML(item.title)}</h4>
          <p class="text-xs text-gray-400 mt-1 line-clamp-2">${escapeHTML(item.description)}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 text-[10px] text-gray-400 flex items-center justify-between">
          <span>${(translations.yearAndSem || 'Year {year} • Sem {sem}').replace('{year}', item.yearLevel.toString()).replace('{sem}', item.semester.toString())}</span>
          <span class="font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">${translations.readNow || 'Read now →'}</span>
        </div>
      `;
      resultsGrid.appendChild(resultCard);
    });
    }, 250);
  });
};

initTabsAndSearch();
