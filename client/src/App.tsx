import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CursorBall from './components/ui/CursorBall';
import AmbientParticles from './components/ui/AmbientParticles';

const PublicLayout = lazy(() => import('./layouts/PublicLayout'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));
const IntroPage = lazy(() => import('./pages/IntroPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'));
const ProblemSolvePage = lazy(() => import('./pages/ProblemSolvePage'));
const CourseListPage = lazy(() => import('./pages/CourseListPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const QuizListPage = lazy(() => import('./pages/QuizListPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const InterviewPrepPage = lazy(() => import('./pages/InterviewPrepPage'));
const CourseCreatePage = lazy(() => import('./pages/CourseCreatePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const LessonCreatePage = lazy(() => import('./pages/LessonCreatePage'));
const ProblemCreatePage = lazy(() => import('./pages/ProblemCreatePage'));
const QuizBuilderPage = lazy(() => import('./pages/QuizBuilderPage'));
const QuizCreationHubPage = lazy(() => import('./pages/QuizCreationHubPage'));
const LessonAIQuizPage = lazy(() => import('./pages/LessonAIQuizPage'));
const PDFAIQuizPage = lazy(() => import('./pages/PDFAIQuizPage'));
const TeacherQuizLibraryPage = lazy(() => import('./pages/TeacherQuizLibraryPage'));
const TeacherQuizManagePage = lazy(() => import('./pages/TeacherQuizManagePage'));
const SubmissionHistoryPage = lazy(() => import('./pages/SubmissionHistoryPage'));
const TeacherCourseStudentsPage = lazy(() => import('./pages/TeacherCourseStudentsPage'));
const ProblemsListPage = lazy(() => import('./pages/ProblemsListPage'));
const BattleIndexPage = lazy(() => import('./pages/battle/index'));
const BattleRoomPage = lazy(() => import('./pages/battle/[roomId]'));

const RouteLoadingFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary-blue" />
  </div>
);

function App() {
  return (
    <Router>
      <AmbientParticles />
      <CursorBall />
      <div className="relative z-10">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<IntroPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated Routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="courses" element={<CourseListPage />} />
              <Route path="problems" element={<ProblemsListPage />} />
              <Route path="battle" element={<BattleIndexPage />} />
              <Route path="battle/:roomId" element={<BattleRoomPage />} />
              <Route path="course/:courseId" element={<CourseDetailPage />} />
              <Route path="problem/:problemId" element={<ProblemSolvePage />} />
              <Route path="quizzes" element={<QuizListPage />} />
              <Route path="quiz/:quizId" element={<QuizPage />} />
              <Route path="practice" element={<InterviewPrepPage />} />
              <Route path="courses/create" element={<CourseCreatePage />} />
              <Route path="course/:courseId/lesson/create" element={<LessonCreatePage />} />
              <Route path="lesson/:lessonId" element={<LessonPage />} />
              <Route path="lesson/:lessonId/problem/create" element={<ProblemCreatePage />} />
              <Route path="course/:courseId/problem/create" element={<ProblemCreatePage />} />
              <Route path="course/:courseId/quiz/create" element={<QuizCreationHubPage />} />
              <Route path="course/:courseId/quiz/create/manual" element={<QuizBuilderPage />} />
              <Route path="course/:courseId/quiz/create/lesson-ai" element={<LessonAIQuizPage />} />
              <Route path="course/:courseId/quiz/create/pdf-ai" element={<PDFAIQuizPage />} />
              <Route path="course/:courseId/students" element={<TeacherCourseStudentsPage />} />
              <Route path="quizzes/manage" element={<TeacherQuizLibraryPage />} />
              <Route path="quizzes/:quizId/manage" element={<TeacherQuizManagePage />} />
              <Route path="submissions" element={<SubmissionHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
