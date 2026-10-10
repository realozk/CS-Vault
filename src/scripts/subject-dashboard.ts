const initDashboard = () => {
  const tabs = document.querySelectorAll('.summary-tab-btn');
  const contents = document.querySelectorAll('.summary-content-block');
  const checkboxes = document.querySelectorAll('.summary-checkbox') as NodeListOf<HTMLInputElement>;
  const progressFill = document.getElementById('subject-progress-fill');
  const progressPercentText = document.getElementById('progress-percentage-text');
  const progressStatusDesc = document.getElementById('progress-status-desc');

  const tracker = document.getElementById('subject-progress-card');
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
    
    const titleSpan = [...tabs].find(tab => tab.getAttribute('data-summary-slug') === slug)?.querySelector('.summary-title-text');
    if (isChecked) {
      titleSpan?.classList.add('line-through', 'opacity-50');
    }

    // Handle checkbox change
    cb.addEventListener('change', () => {
      const checked = cb.checked;
      if (checked) {
        if (!completedSlugs.includes(slug)) {
          completedSlugs.push(slug);
        }
        titleSpan?.classList.add('line-through', 'opacity-50');
      } else {
        completedSlugs = completedSlugs.filter(item => item !== slug);
        titleSpan?.classList.remove('line-through', 'opacity-50');
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

  // Tab view switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetSlug = tab.getAttribute('data-summary-slug');

      // Update active tab styling
      tabs.forEach((btn) => {
        btn.setAttribute('aria-pressed', 'false');
        btn.classList.remove(
          'border-blue-600',
          'dark:border-blue-500',
          'bg-blue-50/10',
          'dark:bg-blue-950/10',
          'text-blue-950',
          'dark:text-blue-100',
          'font-semibold',
          'shadow-xs'
        );
        btn.classList.add(
          'border-gray-100',
          'dark:border-zinc-800',
          'text-gray-600',
          'dark:text-zinc-300'
        );
      });

      tab.setAttribute('aria-pressed', 'true');
      tab.classList.add(
        'border-blue-600',
        'dark:border-blue-500',
        'bg-blue-50/10',
        'dark:bg-blue-950/10',
        'text-blue-950',
        'dark:text-blue-100',
        'font-semibold',
        'shadow-xs'
      );
      tab.classList.remove(
        'border-gray-100',
        'dark:border-zinc-800',
        'text-gray-600',
        'dark:text-zinc-300'
      );

      // Update active content block visibility
      contents.forEach((content) => {
        if (content.id === `summary-content-${targetSlug}`) {
          content.classList.remove('hidden');
          content.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
        } else {
          content.classList.add('hidden');
        }
      });
      initCopyButtons();
    });
  });

  // Handle Next, Previous, and Finish summary navigation buttons
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const prevBtn = target.closest('button[data-nav-prev]');
    const nextBtn = target.closest('button[data-nav-next]');
    const finishBtn = target.closest('button[data-nav-finish]');

    if (prevBtn) {
      const slug = prevBtn.getAttribute('data-nav-prev');
      const tabToClick = document.querySelector(`.summary-tab-btn[data-summary-slug="${slug}"]`) as HTMLElement;
      if (tabToClick) tabToClick.click();
    } else if (nextBtn) {
      const slug = nextBtn.getAttribute('data-nav-next');
      const currentSlug = nextBtn.getAttribute('data-current-slug');

      if (currentSlug) {
        const checkbox = document.querySelector(`.summary-checkbox[data-summary-check="${currentSlug}"]`) as HTMLInputElement;
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change'));
        }
      }

      const tabToClick = document.querySelector(`.summary-tab-btn[data-summary-slug="${slug}"]`) as HTMLElement;
      if (tabToClick) tabToClick.click();
    } else if (finishBtn) {
      const slug = finishBtn.getAttribute('data-nav-finish');
      const checkbox = document.querySelector(`.summary-checkbox[data-summary-check="${slug}"]`) as HTMLInputElement;
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
      }
      
      const progressCard = document.getElementById('subject-progress-card');
      if (progressCard) {
        progressCard.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        progressCard.classList.add('ring-2', 'ring-emerald-500', 'transition-all', 'duration-500');
        setTimeout(() => {
          progressCard.classList.remove('ring-2', 'ring-emerald-500');
        }, 1500);
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
