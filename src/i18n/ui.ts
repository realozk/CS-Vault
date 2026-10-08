export const languages = {
  en: 'English',
  ar: 'العربية',
};

export const defaultLang = 'en';

export const ui = {
  en: {
    'quiz.practice': 'Practice',
    'quiz.exam': 'Exam mode',
    'quiz.examHelp': 'Answers appear after submission. You can revisit questions; unanswered questions count as incorrect.',
    'quiz.useTimer': 'Use a timer',
    'quiz.minutes': 'Minutes (1–180)',
    'quiz.answerSaved': 'Answer selected. Feedback will appear after submission.',
    'quiz.correctFeedback': 'Correct answer.',
    'quiz.incorrectFeedback': 'Incorrect answer. Review the explanation.',
    'quiz.previous': 'Previous question',
    'quiz.submit': 'Submit exam',
    'quiz.timeRemaining': 'Time remaining',
    'quiz.expired': 'Time is up. Your current answers were submitted; unanswered questions count as incorrect.',
    'quiz.topics': 'Results by topic',
    'quiz.topicLabel': 'Topic',
    'quiz.topicScore': 'Correct / total',
    'quiz.needsReview': 'Needs review',
    'quiz.allCorrect': 'All correct this attempt',
    'quiz.mistakes': 'Review missed questions',
    'quiz.yourAnswer': 'Your answer',
    'quiz.correctAnswer': 'Correct answer',
    'quiz.unanswered': 'Unanswered',
    'quiz.noMistakes': 'No missed questions in this attempt.',
    'quiz.retryMissed': 'Practice up to 5 missed questions',
    'quiz.savedReview': 'Short revision session',
    'quiz.reviewCount': '{saved} saved questions · {due} due now',
    'quiz.reviewHelp': 'Up to 5 questions from this exam, with due questions first. Mistakes are saved on this device for review tomorrow, then after 3 and 7 days. Early practice does not advance the schedule.',
    'quiz.noSaved': 'No saved mistakes for this exam yet.',
    'quiz.storageUnavailable': 'Saving is unavailable in this browser. You can still review mistakes during this visit.',
    'quiz.shortActive': 'Short revision · no time limit',
    'quiz.fullRetry': 'Retry full quiz',
    'quiz.settings': 'Change quiz settings',
    'quiz.clearSaved': 'Clear saved review',
    'quiz.examSubtext': 'Optional timer · Feedback after submission',
    'quiz.practiceHelp': 'No time limit. Answers and explanations appear immediately.',
    'quiz.aiDisclaimer': 'This practice exam was generated with AI from the lecture handout because no past exams or question bank were available for this lecture. It is not an official exam or answer key; check answers against the lecture.',
    'quiz.inferredExam': 'Practice answers are AI-suggested, not an official answer key. Verify them against the lecture after submitting.',
    'quiz.inferredShort': 'AI-suggested answer; verify against the lecture.',
    'quiz.sessionScore': 'This session only',
    'quiz.noTopics': 'General',
    'quiz.topic.reasons-domains': 'Reasons and domains',
    'quiz.topic.evaluation': 'Language evaluation',
    'quiz.topic.architecture-paradigms': 'Architecture and paradigms',
    'quiz.topic.design-tradeoffs': 'Design trade-offs',
    'quiz.topic.implementation-tools': 'Implementation and tools',
    'quiz.topic.os-foundations': 'OS foundations',
    'quiz.topic.interrupts-io': 'Interrupts and I/O',
    'quiz.topic.storage-caching': 'Storage and caching',
    'quiz.topic.scheduling-modes': 'Scheduling and execution modes',
    'quiz.topic.os-services': 'Operating system services',
    'quiz.topic.system-calls': 'System calls and APIs',
    'quiz.topic.os-structures': 'Operating system structures',
    'quiz.aiLectureNotice': 'AI-generated practice questions based on the uploaded lecture. This is not an official quiz or answer key; check answers against the referenced PDF pages.',
    'quiz.dinosaur': 'The Operating System Concepts dinosaur',
    'quiz.shawarma': 'A little shawarma break',
    'quiz.topic.general': 'General',
    'course.comingSoon': 'Study material coming soon',
    'quiz.featured': 'Likely exam practice',
    'quiz.providedNotice': '20 Lecture 1 questions from the uploaded quiz/midterm collection. Marked answers were transcribed; explanations and missing choices were added for practice. Highlighted for revision, with no guarantee these questions will appear in your exam.',
    'quiz.sourcePage': 'Source PDF page {page}',
    'quiz.generatedOptions': 'Practice choices added; the PDF shows only the selected answer.',
    'quiz.source': 'Based on',
    'quiz.sourceSlide': 'Source slide {slide}',
    'quiz.inferred': 'AI-suggested answer; verify it against the lecture. It is not marked on an exam paper.',
    'nav.home': 'Home',
    'nav.brand': 'CS Vaulte',
    'nav.previous': 'Previous',
    'nav.next': 'Next',
    'nav.finish': 'Finish',
    'footer.text': 'CS Vaulte. Open-Source Educational Repository.',
    'footer.github': 'GitHub',

    // Home Hero
    'hero.title': 'Let’s study together',
    'hero.desc': 'We made this small project to help CS students pass their exams in the easiest way. Made with love.',
    'hero.contribute': 'Share your notes on GitHub',

    // Search
    'search.placeholder': 'Search summaries, subjects, quizzes...',
    'search.results': 'Search Results',
    'search.resultsCount': 'matches',
    'search.noResults': 'No study material matches your query. Try another keyword!',
    'search.subjectBadge': 'Subject',
    'search.summaryBadge': 'Summary',
    'search.quizBadge': 'Quiz',
    'search.readNow': 'Read now →',
    'search.yearAndSem': 'Year {year} • Sem {sem}',

    // Directory / Tabs
    'year.tab': 'Academic Year {year}',
    'year.empty': 'Year {year} content is empty',
    'year.emptyDesc': 'No summaries or quizzes have been uploaded for Year {year} yet. Be the first to push content to the git repository!',
    'year.contributeGuidelines': 'View Contributing Guidelines',
    'semester.1': 'First Semester',
    'semester.2': 'Second Semester',
    'semester.title': 'Semester {sem}',
    'semester.empty': 'No subjects uploaded for this semester yet.',

    // Subject Dashboard
    'dashboard.breadcrumbs': 'Subjects',
    'dashboard.academicYear': 'Academic Year {year}',
    'dashboard.summaries': 'Summaries',
    'dashboard.quizzes': 'Quizzes',
    'dashboard.summariesDesc': 'Student-written notes, exam prep, and quick references.',
    'dashboard.quizzesDesc': 'Interactive quizzes to test your understanding before exams.',
    'dashboard.readTime': '{time} min read',
    'dashboard.practice': 'Practice Quiz',
    'dashboard.emptySummaries': 'No summaries available for this module yet.',
    'dashboard.emptyQuizzes': 'No quizzes available for this module yet.',
    'dashboard.author': 'By {author}',
    'dashboard.markReviewed': 'Mark as reviewed',
    'dashboard.progressStatus': '{checked} of {total} summaries completed.',
    'dashboard.copyCode': 'Copy code snippet',
    'dashboard.copied': 'Copied!',

    // Quiz Widget
    'quiz.questionsCount': 'Test your knowledge on this subject. This quiz consists of <strong>{count}</strong> questions.',
    'quiz.start': 'Start Quiz',
    'quiz.subtext': 'No time limit • Immediate feedback',
    'quiz.currentQuestion': 'Question {current} of {total}',
    'quiz.active': 'Active Session',
    'quiz.explanation': 'Explanation',
    'quiz.next': 'Next Question',
    'quiz.finish': 'Finish Quiz',
    'quiz.completed': 'Quiz Completed!',
    'quiz.breakdown': 'Here is your score breakdown:',
    'quiz.correct': 'Correct Answers',
    'quiz.percentage': 'Percentage',
    'quiz.retry': 'Retry Quiz',
    'quiz.back': 'Back to Subject',

    // Quiz Scores
    'quiz.score.100': 'All answers correct in this attempt.',
    'quiz.score.80': 'Review the questions you missed.',
    'quiz.score.50': 'Review the explanations for the questions you missed.',
    'quiz.score.0': 'Read the subject summaries and review the explanations.',
  },
  ar: {
    'quiz.practice': 'تدريب',
    'quiz.exam': 'وضع الاختبار',
    'quiz.examHelp': 'تظهر الإجابات بعد التسليم. يمكنك الرجوع للأسئلة؛ الأسئلة دون إجابة تحسب خطأ.',
    'quiz.useTimer': 'استخدام مؤقت',
    'quiz.minutes': 'الدقائق (١–١٨٠)',
    'quiz.answerSaved': 'تم اختيار الإجابة. يظهر التقييم بعد التسليم.',
    'quiz.correctFeedback': 'إجابة صحيحة.',
    'quiz.incorrectFeedback': 'إجابة غير صحيحة. راجع الشرح.',
    'quiz.previous': 'السؤال السابق',
    'quiz.submit': 'تسليم الاختبار',
    'quiz.timeRemaining': 'الوقت المتبقي',
    'quiz.expired': 'انتهى الوقت وتم تسليم إجاباتك؛ الأسئلة دون إجابة تحسب خطأ.',
    'quiz.topics': 'النتائج حسب الموضوع',
    'quiz.topicLabel': 'الموضوع',
    'quiz.topicScore': 'الصحيح / الإجمالي',
    'quiz.needsReview': 'يحتاج إلى مراجعة',
    'quiz.allCorrect': 'كل الإجابات صحيحة في هذه المحاولة',
    'quiz.mistakes': 'مراجعة الأسئلة غير الصحيحة',
    'quiz.yourAnswer': 'إجابتك',
    'quiz.correctAnswer': 'الإجابة الصحيحة',
    'quiz.unanswered': 'دون إجابة',
    'quiz.noMistakes': 'لا توجد أسئلة غير صحيحة في هذه المحاولة.',
    'quiz.retryMissed': 'تدرب على ٥ أسئلة غير صحيحة كحد أقصى',
    'quiz.savedReview': 'جلسة مراجعة قصيرة',
    'quiz.reviewCount': '{saved} سؤال محفوظ · {due} للمراجعة الآن',
    'quiz.reviewHelp': '٥ أسئلة كحد أقصى من هذا الاختبار، تبدأ بالأسئلة المستحقة. تحفظ الأخطاء على هذا الجهاز لمراجعتها غداً ثم بعد ٣ و٧ أيام. التدريب المبكر لا يغير الموعد.',
    'quiz.noSaved': 'لا توجد أخطاء محفوظة لهذا الاختبار بعد.',
    'quiz.storageUnavailable': 'الحفظ غير متاح في هذا المتصفح. يمكنك مراجعة الأخطاء خلال هذه الزيارة.',
    'quiz.shortActive': 'مراجعة قصيرة · دون حد زمني',
    'quiz.fullRetry': 'إعادة الاختبار كاملاً',
    'quiz.settings': 'تغيير إعدادات الاختبار',
    'quiz.clearSaved': 'مسح المراجعة المحفوظة',
    'quiz.examSubtext': 'مؤقت اختياري · تقييم بعد التسليم',
    'quiz.practiceHelp': 'دون حد زمني. تظهر الإجابات والشروح مباشرة.',
    'quiz.aiDisclaimer': 'تم توليد هذا الاختبار التدريبي بالذكاء الاصطناعي بالاعتماد على ملف المحاضرة، لعدم توفر اختبارات سابقة أو بنك أسئلة لهذه المحاضرة. هذا ليس اختباراً رسمياً أو نموذج إجابة معتمداً؛ تحقق من الإجابات بالرجوع إلى المحاضرة.',
    'quiz.inferredExam': 'الإجابات مقترحة بالذكاء الاصطناعي وليست نموذجاً رسمياً. تحقق منها في المحاضرة بعد التسليم.',
    'quiz.inferredShort': 'إجابة مقترحة بالذكاء الاصطناعي؛ تحقق منها في المحاضرة.',
    'quiz.sessionScore': 'هذه الجلسة فقط',
    'quiz.noTopics': 'عام',
    'quiz.topic.reasons-domains': 'الدوافع ومجالات الاستخدام',
    'quiz.topic.evaluation': 'تقييم اللغات',
    'quiz.topic.architecture-paradigms': 'المعمارية وأنماط البرمجة',
    'quiz.topic.design-tradeoffs': 'مفاضلات التصميم',
    'quiz.topic.implementation-tools': 'التنفيذ والأدوات',
    'quiz.topic.os-foundations': 'أساسيات نظم التشغيل',
    'quiz.topic.interrupts-io': 'المقاطعات والإدخال والإخراج',
    'quiz.topic.storage-caching': 'التخزين والذاكرة المخبأة',
    'quiz.topic.scheduling-modes': 'الجدولة وأنماط التنفيذ',
    'quiz.topic.os-services': 'خدمات نظم التشغيل',
    'quiz.topic.system-calls': 'نداءات النظام وواجهات البرمجة',
    'quiz.topic.os-structures': 'هياكل نظم التشغيل',
    'quiz.aiLectureNotice': 'أسئلة تدريبية مولدة بالذكاء الاصطناعي من ملف المحاضرة. هذا ليس اختباراً رسمياً أو نموذج إجابة معتمداً؛ تحقق من الإجابات بالرجوع إلى صفحات المصدر.',
    'quiz.dinosaur': 'ديناصور كتاب مفاهيم نظم التشغيل',
    'quiz.shawarma': 'استراحة شاورما صغيرة',
    'quiz.topic.general': 'عام',
    'course.comingSoon': 'المحتوى الدراسي قريباً',
    'quiz.featured': 'أسئلة متوقعة للمراجعة',
    'quiz.providedNotice': '٢٠ سؤالاً من المحاضرة الأولى من ملف تجميع الأسئلة. نُقلت الإجابات المحددة في المصدر، وأُضيفت الشروح والخيارات الناقصة للتدريب. مميز للمراجعة، دون ضمان ورود هذه الأسئلة في اختبارك.',
    'quiz.sourcePage': 'صفحة {page} في ملف المصدر',
    'quiz.generatedOptions': 'أُضيفت خيارات للتدريب؛ الملف يعرض الإجابة المختارة فقط.',
    'quiz.source': 'المصدر',
    'quiz.sourceSlide': 'الشريحة {slide} في المصدر',
    'quiz.inferred': 'إجابة مقترحة بالذكاء الاصطناعي؛ تحقق منها في المحاضرة. ليست إجابة محددة في ورقة اختبار.',
    'nav.home': 'الرئيسية',
    'nav.brand': 'قبو الحاسب',
    'nav.previous': 'السابق',
    'nav.next': 'التالي',
    'nav.finish': 'إنهاء',
    'footer.text': 'قبو الحاسب. مستودع تعليمي مفتوح المصدر.',
    'footer.github': 'github',

    // Home Hero
    'hero.title': 'خلّنا نذاكر مع بعض',
    'hero.desc': 'سوّينا هذا المشروع البسيط عشان نساعد طلاب الحاسب يجتازون اختباراتهم بأسهل طريقة. صنعناه بكل حب.',
    'hero.contribute': 'شارك ملخصك على GitHub',

    // Search
    'search.placeholder': 'ابحث عن الملخصات، المواد، الاختبارات...',
    'search.results': 'نتائج البحث',
    'search.resultsCount': 'مطابقات',
    'search.noResults': 'لم يتم العثور على مواد دراسية تطابق بحثك. جرب كلمة مفتاحية أخرى!',
    'search.subjectBadge': 'مادة',
    'search.summaryBadge': 'ملخص',
    'search.quizBadge': 'اختبار',
    'search.readNow': 'عرض الآن ←',
    'search.yearAndSem': 'السنة {year} • الفصل {sem}',

    // Directory / Tabs
    'year.tab': 'السنة الدراسية {year}',
    'year.empty': 'محتوى السنة {year} فارغ حالياً',
    'year.emptyDesc': 'لا توجد ملخصات أو اختبارات متاحة للسنة {year} بعد.',
    'year.contributeGuidelines': 'عرض إرشادات المساهمة',
    'semester.1': 'الفصل الدراسي الأول',
    'semester.2': 'الفصل الدراسي الثاني',
    'semester.title': 'الفصل الدراسي {sem}',
    'semester.empty': 'لم يتم رفع أي مواد لهذا الفصل الدراسي بعد.',

    // Subject Dashboard
    'dashboard.breadcrumbs': 'المواد الدراسية',
    'dashboard.academicYear': 'السنة الدراسية {year}',
    'dashboard.summaries': 'الملخصات الدراسية',
    'dashboard.quizzes': 'الاختبارات التفاعلية',
    'dashboard.summariesDesc': 'ملخصات من إعداد الطلاب، مراجعات للامتحانات ومراجع سريعة.',
    'dashboard.quizzesDesc': 'اختبارات تفاعلية لتقييم مدى استيعابك للمادة قبل الامتحانات.',
    'dashboard.readTime': 'قراءة {time} دقيقة',
    'dashboard.practice': 'ابدأ الاختبار',
    'dashboard.emptySummaries': 'لا تتوفر ملخصات لهذه المادة حالياً.',
    'dashboard.emptyQuizzes': 'لا تتوفر اختبارات لهذه المادة حالياً.',
    'dashboard.author': 'بواسطة {author}',
    'dashboard.markReviewed': 'تحديد كمُراجع',
    'dashboard.progressStatus': 'تم إنجاز {checked} من أصل {total} ملخصات.',
    'dashboard.copyCode': 'نسخ الكود البرمجي',
    'dashboard.copied': 'تم النسخ!',

    // Quiz Widget
    'quiz.questionsCount': 'اختبر معلوماتك في هذه المادة. يتكون هذا الاختبار من <strong>{count}</strong> أسئلة.',
    'quiz.start': 'ابدأ الاختبار',
    'quiz.subtext': 'بدون حد زمني • تقييم فوري للحل',
    'quiz.currentQuestion': 'السؤال {current} من {total}',
    'quiz.active': 'جلسة نشطة',
    'quiz.explanation': 'الشرح والتوضيح',
    'quiz.next': 'السؤال التالي',
    'quiz.finish': 'إنهاء الاختبار',
    'quiz.completed': 'تم الانتهاء من الاختبار!',
    'quiz.breakdown': 'إليك تفاصيل نتيجتك:',
    'quiz.correct': 'الإجابات الصحيحة',
    'quiz.percentage': 'النسبة المئوية',
    'quiz.retry': 'إعادة المحاولة',
    'quiz.back': 'العودة للمادة',

    // Quiz Scores
    'quiz.score.100': 'كل الإجابات صحيحة في هذه المحاولة.',
    'quiz.score.80': 'راجع الأسئلة التي أخطأت فيها.',
    'quiz.score.50': 'راجع الشروح للأسئلة التي أخطأت فيها.',
    'quiz.score.0': 'راجع المحاضرة والشروح، ثم حاول مجدداً.',
  },
} as const;

export function getLangFromUrl(url: URL) {
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.includes('ar')) {
    return 'ar';
  }
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(path: string, lang: keyof typeof ui) {
  const rawBase = import.meta.env.BASE_URL;
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (lang === defaultLang) {
    return `${base}${cleanPath}`;
  }
  return `${base}ar/${cleanPath}`;
}

export function getLanguageSwitcherPath(pathname: string, currentLang: keyof typeof ui) {
  // There is one shared 404 page; a localized 404 route does not exist.
  if (/\/404(?:\.html|\/)?$/.test(pathname)) {
    return getLocalizedPath('/', currentLang === 'ar' ? 'en' : 'ar');
  }
  const rawBase = import.meta.env.BASE_URL;
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  if (currentLang === 'ar') {
    const searchPart = `${base}ar/`;
    if (pathname.startsWith(searchPart)) {
      return base + pathname.slice(searchPart.length);
    }
    if (pathname.startsWith('/ar/')) {
      return '/' + pathname.slice(4);
    }
    if (pathname === '/ar') {
      return '/';
    }
    return pathname;
  } else {
    if (pathname.startsWith(base)) {
      return base + 'ar/' + pathname.slice(base.length);
    }
    return '/ar' + pathname;
  }
}
