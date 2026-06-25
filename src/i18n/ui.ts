export const languages = {
  en: 'English',
  ar: 'العربية',
};

export const defaultLang = 'en';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.brand': 'CS Vaulte',
    'nav.previous': 'Previous',
    'nav.next': 'Next',
    'nav.finish': 'Finish',
    'footer.text': 'CS Vaulte. Open-Source Educational Repository.',
    'footer.github': 'GitHub',

    // Home Hero
    'hero.badge': 'Academic Study Center',
    'hero.title': 'Accelerate Your Computer Science Studies',
    'hero.desc': 'CS Vaulte is an open-source, community-driven space hosting clear, student-focused subject summaries and interactive self-assessment quizzes.',
    'hero.browse': 'Browse Years & Semesters',
    'hero.contribute': 'Contribute on GitHub',

    // Search
    'search.placeholder': 'Search summaries, subjects, quizzes...',
    'search.results': 'Search Results',
    'search.resultsCount': 'matches',
    'search.noResults': 'No study material matches your query. Try another keyword!',
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
    'dashboard.progressStatus': '{checked} of {total} summaries completed. {message}',
    'dashboard.progressPerfect': 'Perfect! You are fully prepared!',
    'dashboard.progressKeepUp': 'Keep up the good work!',
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
    'quiz.score.100': 'Perfect Score! You have mastered this module.',
    'quiz.score.80': 'Excellent job! You have a solid grasp of the subject.',
    'quiz.score.50': 'Good attempt. Review the explanations to reinforce your understanding.',
    'quiz.score.0': 'Keep studying! Read the subject summaries and try again.',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.brand': 'قبو الحاسب',
    'nav.previous': 'السابق',
    'nav.next': 'التالي',
    'nav.finish': 'إنهاء',
    'footer.text': 'قبو الحاسب. مستودع تعليمي مفتوح المصدر.',
    'footer.github': 'github',

    // Home Hero
    'hero.badge': 'مركز الدراسة الأكاديمي',
    'hero.title': 'سرّع دراستك لعلوم الحاسب',
    'hero.desc': 'منصة مفتوحة المصدر وتشاركية تحتوي على ملخصات واضحة للمواد واختبارات تفاعلية لتقييم الذات، موجهة لطلاب علوم الحاسب.',
    'hero.browse': 'تصفح السنوات والفصول الدراسية',
    'hero.contribute': 'ساهم على GitHub',

    // Search
    'search.placeholder': 'ابحث عن الملخصات، المواد، الاختبارات...',
    'search.results': 'نتائج البحث',
    'search.resultsCount': 'مطابقات',
    'search.noResults': 'لم يتم العثور على مواد دراسية تطابق بحثك. جرب كلمة مفتاحية أخرى!',
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
    'dashboard.progressStatus': 'تم إنجاز {checked} من أصل {total} ملخصات. {message}',
    'dashboard.progressPerfect': 'ممتاز! أنت مستعد تماماً!',
    'dashboard.progressKeepUp': 'واصل العمل الرائع!',
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
    'quiz.score.100': 'شف الدافور جايب فل',
    'quiz.score.80': 'وحش والله',
    'quiz.score.50': 'نص نص',
    'quiz.score.0': 'اقرا المنهج عشان لاترسب',
  },
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(path: string, lang: keyof typeof ui) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) {
    return cleanPath;
  }
  return `/ar${cleanPath === '/' ? '' : cleanPath}`;
}
