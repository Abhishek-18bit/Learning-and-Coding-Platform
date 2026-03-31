type Loader = () => Promise<unknown>;

interface RoutePreloadEntry {
    key: string;
    match: RegExp;
    load: Loader;
}

const routePreloadEntries: RoutePreloadEntry[] = [
    { key: 'intro', match: /^\/intro$/, load: () => import('../pages/IntroPage') },
    { key: 'login', match: /^\/login$/, load: () => import('../pages/LoginPage') },
    { key: 'register', match: /^\/register$/, load: () => import('../pages/RegisterPage') },
    { key: 'dashboard', match: /^\/app\/dashboard$/, load: () => import('../pages/DashboardRouter') },
    { key: 'courses', match: /^\/app\/courses$/, load: () => import('../pages/CourseListPage') },
    { key: 'course-detail', match: /^\/app\/course\/[^/]+$/, load: () => import('../pages/CourseDetailPage') },
    { key: 'problems', match: /^\/app\/problems$/, load: () => import('../pages/ProblemsListPage') },
    { key: 'problem-solve', match: /^\/app\/problem\/[^/]+$/, load: () => import('../pages/ProblemSolvePage') },
    { key: 'battle-index', match: /^\/app\/battle$/, load: () => import('../pages/battle/index') },
    { key: 'battle-room', match: /^\/app\/battle\/[^/]+$/, load: () => import('../pages/battle/[roomId]') },
    { key: 'about', match: /^\/app\/about$/, load: () => import('../pages/AboutPage') },
    { key: 'quizzes', match: /^\/app\/quizzes$/, load: () => import('../pages/QuizListPage') },
    { key: 'achievements', match: /^\/app\/achievements$/, load: () => import('../pages/AchievementsPage') },
    { key: 'quiz-attempt', match: /^\/app\/quiz\/[^/]+$/, load: () => import('../pages/QuizPage') },
    { key: 'practice', match: /^\/app\/practice$/, load: () => import('../pages/InterviewPrepPage') },
    { key: 'profile', match: /^\/app\/profile$/, load: () => import('../pages/ProfilePage') },
    { key: 'submissions', match: /^\/app\/submissions$/, load: () => import('../pages/SubmissionHistoryPage') },
    { key: 'create-course', match: /^\/app\/courses\/create$/, load: () => import('../pages/CourseCreatePage') },
    { key: 'create-lesson', match: /^\/app\/course\/[^/]+\/lesson\/create$/, load: () => import('../pages/LessonCreatePage') },
    { key: 'lesson', match: /^\/app\/lesson\/[^/]+$/, load: () => import('../pages/LessonPage') },
    { key: 'create-problem-lesson', match: /^\/app\/lesson\/[^/]+\/problem\/create$/, load: () => import('../pages/ProblemCreatePage') },
    { key: 'create-problem-course', match: /^\/app\/course\/[^/]+\/problem\/create$/, load: () => import('../pages/ProblemCreatePage') },
    { key: 'quiz-create-hub', match: /^\/app\/course\/[^/]+\/quiz\/create$/, load: () => import('../pages/QuizCreationHubPage') },
    { key: 'quiz-create-manual', match: /^\/app\/course\/[^/]+\/quiz\/create\/manual$/, load: () => import('../pages/QuizBuilderPage') },
    { key: 'quiz-create-lesson-ai', match: /^\/app\/course\/[^/]+\/quiz\/create\/lesson-ai$/, load: () => import('../pages/LessonAIQuizPage') },
    { key: 'quiz-create-pdf-ai', match: /^\/app\/course\/[^/]+\/quiz\/create\/pdf-ai$/, load: () => import('../pages/PDFAIQuizPage') },
    { key: 'course-students', match: /^\/app\/course\/[^/]+\/students$/, load: () => import('../pages/TeacherCourseStudentsPage') },
    { key: 'quiz-manage-list', match: /^\/app\/quizzes\/manage$/, load: () => import('../pages/TeacherQuizLibraryPage') },
    { key: 'quiz-manage-single', match: /^\/app\/quizzes\/[^/]+\/manage$/, load: () => import('../pages/TeacherQuizManagePage') },
];

const preloadedKeys = new Set<string>();

const normalizePath = (path: string) => {
    const stripped = path.replace(/\/+$/, '');
    return stripped === '' ? '/' : stripped;
};

const preloadEntry = (entry: RoutePreloadEntry) => {
    if (preloadedKeys.has(entry.key)) {
        return;
    }

    preloadedKeys.add(entry.key);
    void entry.load().catch(() => {
        preloadedKeys.delete(entry.key);
    });
};

export const preloadRoute = (path: string) => {
    const normalized = normalizePath(path);
    const entry = routePreloadEntries.find(({ match }) => match.test(normalized));
    if (entry) {
        preloadEntry(entry);
    }
};
