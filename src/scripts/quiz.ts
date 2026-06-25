import { escapeHTML } from './utils';
import type { Question, QuizData } from '../types';

// Fisher-Yates shuffle
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const initQuizWidget = () => {
  const widget = document.getElementById('quiz-widget');
  if (!widget) return;

  // Parse Quiz Data
  const rawData = widget.getAttribute('data-quiz');
  if (!rawData) return;
  let quiz: QuizData;
  try {
    quiz = JSON.parse(rawData);
  } catch (e) {
    console.error('[QuizWidget] Failed to parse quiz data:', e);
    return;
  }

  // Parse Translations
  const rawTranslations = widget.getAttribute('data-translations');
  let translations: Record<string, string> = {};
  if (rawTranslations) {
    try {
      translations = JSON.parse(rawTranslations);
    } catch (e) {
      console.error('[QuizWidget] Failed to parse translations:', e);
    }
  }

  // Get DOM Elements (with descriptive error if missing)
  const getEl = (id: string): HTMLElement => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`[QuizWidget] Missing required element: #${id}`);
    return el;
  };

  const startScreen = getEl('quiz-start-screen');
  const activeScreen = getEl('quiz-active-screen');
  const resultScreen = getEl('quiz-result-screen');
  
  const startBtn = getEl('start-quiz-btn');
  const nextBtn = getEl('quiz-next-btn') as HTMLButtonElement;
  const restartBtn = getEl('quiz-restart-btn');
  
  const currentNumSpan = getEl('quiz-current-question-num');
  const totalNumSpan = getEl('quiz-total-questions-num');
  const progressBar = getEl('quiz-progress-bar');
  const questionText = getEl('quiz-question-text');
  const questionCode = getEl('quiz-question-code');
  const optionsContainer = getEl('quiz-options-container');
  
  const explanationBox = getEl('quiz-explanation-box');
  const explanationText = getEl('quiz-explanation-text');
  
  const scoreRatioSpan = getEl('quiz-score-ratio');
  const scorePercentageSpan = getEl('quiz-score-percentage');
  const performanceDesc = getEl('quiz-performance-desc');

  // Quiz State variables
  let currentIndex = 0;
  let score = 0;
  let isAnswered = false;

  // Render Option Selection
  const handleOptionSelect = (option: string, clickedBtn: HTMLButtonElement) => {
    if (isAnswered) return;
    isAnswered = true;

    const q = quiz.questions[currentIndex];
    const isCorrect = option === q.correctAnswer;

    if (isCorrect) {
      score++;
    }

    // Update styles of all buttons
    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach((btn) => {
      const btnOption = btn.getAttribute('data-option');
      const iconDiv = btn.querySelector('.quiz-option-status-icon')!;
      const letterSpan = btn.querySelector('span')!;
      
      // Disable pointer hover effects
      btn.classList.remove('hover:border-blue-600', 'dark:hover:border-blue-500', 'hover:bg-blue-50/10', 'dark:hover:bg-blue-950/5', 'cursor-pointer');
      btn.classList.add('cursor-default');

      if (btnOption === q.correctAnswer) {
        // Highlight correct answer
        btn.classList.add('border-green-500', 'bg-green-50/30', 'dark:bg-green-950/10', 'text-green-700', 'dark:text-green-400');
        letterSpan.classList.add('bg-green-100', 'text-green-700', 'dark:bg-green-950/40', 'dark:text-green-400');
        iconDiv.innerHTML = `
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        `;
      } else if (btnOption === option && !isCorrect) {
        // Highlight selected wrong answer
        btn.classList.add('border-red-500', 'bg-red-50/30', 'dark:bg-red-950/10', 'text-red-700', 'dark:text-red-400');
        letterSpan.classList.add('bg-red-100', 'text-red-700', 'dark:bg-red-950/40', 'dark:text-red-400');
        iconDiv.innerHTML = `
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        `;
      } else {
        // Dim other options
        btn.classList.add('opacity-50');
      }
    });

    // Display explanation if available
    if (q.explanation) {
      explanationText.textContent = q.explanation;
      explanationBox.classList.remove('hidden');
    }

    // Enable next question button
    nextBtn.disabled = false;
  };

  // Render Question State
  const renderQuestion = () => {
    const q = quiz.questions[currentIndex];
    isAnswered = false;
    
    // Update Text & Numbers
    currentNumSpan.textContent = (currentIndex + 1).toString();
    questionText.textContent = q.question;
    
    // Render code block if present
    if (q.code) {
      questionCode.textContent = q.code;
      questionCode.classList.remove('hidden');
    } else {
      questionCode.classList.add('hidden');
    }
    
    // Update Progress Bar
    const progressPercent = ((currentIndex) / quiz.questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;

    // Reset UI Elements
    explanationBox.classList.add('hidden');
    nextBtn.disabled = true;
    nextBtn.textContent = currentIndex === quiz.questions.length - 1 
      ? (translations.finish || 'Finish Quiz') 
      : (translations.next || 'Next Question');
    
    // Render Options
    optionsContainer.innerHTML = '';
    q.options.forEach((option, index) => {
      const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
      
      const optionBtn = document.createElement('button');
      optionBtn.type = 'button';
      optionBtn.className = 'w-full text-left p-4 rounded border border-gray-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-blue-950/5 transition-all duration-150 cursor-pointer flex items-center justify-between group';
      optionBtn.setAttribute('data-option', option);

      optionBtn.innerHTML = `
        <div class="flex items-center gap-3.5">
          <span class="w-8 h-8 rounded-sm bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-950/40 dark:group-hover:text-blue-400 font-bold flex items-center justify-center text-sm transition-colors duration-150">
            ${optionLetter}
          </span>
          <span class="font-medium text-gray-700 dark:text-zinc-200 text-sm sm:text-base">${escapeHTML(option)}</span>
        </div>
        <div class="quiz-option-status-icon text-gray-300 dark:text-zinc-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"></circle>
          </svg>
        </div>
      `;

      optionBtn.addEventListener('click', () => handleOptionSelect(option, optionBtn));
      optionsContainer.appendChild(optionBtn);
    });
  };

  const initQuiz = () => {
    quiz.questions = shuffle(quiz.questions);
    currentIndex = 0;
    score = 0;
    isAnswered = false;
    totalNumSpan.textContent = quiz.questions.length.toString();
    renderQuestion();
  };

  // Render Final Results
  const renderResults = () => {
    progressBar.style.width = `100%`;
    
    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);
    
    scoreRatioSpan.textContent = `${score}/${total}`;
    scorePercentageSpan.textContent = `${percentage}%`;

    // Set performance message
    let desc = '';
    if (percentage === 100) {
      desc = translations.score100 || 'Perfect Score! You have mastered this module.';
    } else if (percentage >= 80) {
      desc = translations.score80 || 'Excellent job! You have a solid grasp of the subject.';
    } else if (percentage >= 50) {
      desc = translations.score50 || 'Good attempt. Review the explanations to reinforce your understanding.';
    } else {
      desc = translations.score0 || 'Keep studying! Read the subject summaries and try again.';
    }
    performanceDesc.textContent = desc;
  };

  // Start Quiz
  startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');
    initQuiz();
  });

  // Next Question or Finish Quiz Action
  nextBtn.addEventListener('click', () => {
    if (currentIndex === quiz.questions.length - 1) {
      // Last question - show result screen
      activeScreen.classList.add('hidden');
      resultScreen.classList.remove('hidden');
      renderResults();
    } else {
      // Go to next question
      currentIndex++;
      renderQuestion();
    }
  });

  // Restart Quiz
  restartBtn.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');
    initQuiz();
  });

  // Keyboard shortcuts (A/B/C/D to pick, Enter for next)
  document.addEventListener('keydown', (e) => {
    if (activeScreen.classList.contains('hidden')) return;
    const key = e.key.toUpperCase();
    if (!isAnswered && key >= 'A' && key <= 'Z') {
      const idx = key.charCodeAt(0) - 65;
      const buttons = optionsContainer.querySelectorAll('button');
      if (idx < buttons.length) (buttons[idx] as HTMLButtonElement).click();
    } else if (key === 'ENTER' && isAnswered && !nextBtn.disabled) {
      nextBtn.click();
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuizWidget);
} else {
  initQuizWidget();
}
