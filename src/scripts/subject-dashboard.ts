const initDashboard = () => {
  const tabs = document.querySelectorAll('.summary-tab-btn');
  const contents = document.querySelectorAll('.summary-content-block');
  const checkboxes = document.querySelectorAll('.summary-checkbox') as NodeListOf<HTMLInputElement>;
  const progressFill = document.getElementById('subject-progress-fill');
  const progressPercentText = document.getElementById('progress-percentage-text');
  const progressStatusDesc = document.getElementById('progress-status-desc');

  // Retrieve storage key based on URL parameters
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const subject = pathParts[0] || 'unknown';
  const year = pathParts[1] || 'unknown';
  const storageKey = `cs-vault-progress-${subject}-${year}`;

  // Load progress from localStorage
  let completedSlugs: string[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      completedSlugs = JSON.parse(stored);
    }
  } catch (e) {
    console.error(e);
  }

  const updateProgressBar = () => {
    const total = checkboxes.length;
    if (total === 0) return;
    const checkedCount = completedSlugs.length;
    const percent = Math.round((checkedCount / total) * 100);

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressPercentText) progressPercentText.textContent = `${percent}%`;
    if (progressStatusDesc) {
      progressStatusDesc.textContent = `${checkedCount} of ${total} summaries completed. ${
        percent === 100 ? 'Perfect! You are fully prepared!' : 'Keep up the good work!'
      }`;
    }
  };

  // Initialize checklist checkbox states
  checkboxes.forEach((cb) => {
    const slug = cb.getAttribute('data-summary-check');
    if (!slug) return;
    const isChecked = completedSlugs.includes(slug);
    cb.checked = isChecked;
    
    const titleSpan = cb.closest('button')?.querySelector('.summary-title-text');
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

      localStorage.setItem(storageKey, JSON.stringify(completedSlugs));
      updateProgressBar();
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
    preBlocks.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code-btn';
      button.ariaLabel = 'Copy code snippet';
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
           button.innerHTML = `
             <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
             </svg>
           `;
           
           setTimeout(() => {
             button.classList.remove('copied');
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

  // Tab view switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetSlug = tab.getAttribute('data-summary-slug');

      // Update active tab styling
      tabs.forEach((btn) => {
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
          content.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          content.classList.add('hidden');
        }
      });
      initCopyButtons();
    });
  });

  // Run initial loaders
  initCopyButtons();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
