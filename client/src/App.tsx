import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/screens/NotFound";
import { usePathname } from "next/navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./screens/Home";
import HomeV2 from "./screens/HomeV2";
import V2Courses from "./screens/V2Courses";
import V2CourseDetail from "./screens/V2CourseDetail";
import V2About from "./screens/V2About";
import V2SuccessStories from "./screens/V2SuccessStories";
import V2HowItWorks from "./screens/V2HowItWorks";
import V2Contact from "./screens/V2Contact";
import V2Enroll from "./screens/V2Enroll";
import CoursesPage from "./screens/CoursesPage";
import CourseDetailPage from "./screens/CourseDetailPage";
import SuccessStoriesPage from "./screens/SuccessStoriesPage";
import AdminDashboard from "./screens/AdminDashboard";
import AdminCourses from "./screens/AdminCourses";
import AdminSuccessStories from "./screens/AdminSuccessStories";
import AdminEnrollments from "./screens/AdminEnrollments";
import AdminBatches from "./screens/AdminBatches";
import AdminWebsite from "./screens/AdminWebsite";
import AdminSettings from "./screens/AdminSettings";
import AdminInstructors from "./screens/AdminInstructors";
import AdminPaymentSettings from "./screens/AdminPaymentSettings";
import AdminProfile from "./screens/AdminProfile";
import AdminLayout from "./components/AdminLayout";
import AdminMockTests, { isMockModule } from "./screens/AdminMockTests";
import type { MockModule } from "@shared/mock";
import AdminMockTestEditor from "./screens/AdminMockTestEditor";
import AdminCambridgeLibrary from "./screens/AdminCambridgeLibrary";
import AdminMockResults from "./screens/AdminMockResults";
import AdminUsers from "./screens/AdminUsers";
import AdminUserCreate from "./screens/AdminUserCreate";
import AdminUserEdit from "./screens/AdminUserEdit";
import AdminRoles from "./screens/AdminRoles";
import AdminResources from "./screens/AdminResources";
import AdminResourceForm from "./screens/AdminResourceForm";
import AdminMedia from "./screens/AdminMedia";
import AdminEnrollmentDetail from "./screens/AdminEnrollmentDetail";
import StudentDashboard from "./screens/StudentDashboard";
import StudentAttempt, {
  StudentAttemptPreview,
} from "./screens/StudentAttempt";

function Router() {
  const pathname = usePathname() ?? "/";
  // Current site (v2)
  if (pathname === "/") return <HomeV2 />;
  if (pathname === "/courses") return <V2Courses />;
  if (pathname.startsWith("/courses/"))
    return <V2CourseDetail key={pathname} />;
  if (pathname === "/about") return <V2About />;
  if (pathname === "/success-stories") return <V2SuccessStories />;
  if (pathname === "/how-it-works") return <V2HowItWorks />;
  if (pathname === "/contact") return <V2Contact />;
  if (pathname === "/enroll") return <V2Enroll />;
  // Old site (v1), kept under /old
  if (pathname === "/old") return <Home />;
  if (pathname === "/old/courses") return <CoursesPage />;
  if (pathname.startsWith("/old/courses/")) return <CourseDetailPage />;
  if (pathname === "/old/success-stories") return <SuccessStoriesPage />;
  // Student mock test area
  if (
    [
      "/student",
      "/student/practice",
      "/student/mocks",
      "/student/results",
      "/student/batch",
      "/student/resources",
      "/student/typing",
      "/student/profile",
      "/student/settings",
    ].includes(pathname)
  )
    return <StudentDashboard />;
  if (pathname.startsWith("/student/attempts/"))
    return <StudentAttempt key={pathname} />;
  // Full-screen like the real exam, so outside the admin layout.
  if (/^\/admin\/ielts\/preview\/\d+$/.test(pathname))
    return <StudentAttemptPreview key={pathname} />;
  if (pathname.startsWith("/admin")) {
    let screen = <AdminDashboard />;
    if (pathname === "/admin/courses") screen = <AdminCourses key={pathname} />;
    else if (pathname === "/admin/courses/new")
      screen = <AdminCourses key={pathname} createMode />;
    else if (/^\/admin\/courses\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminCourses
          key={pathname}
          editId={Number(
            pathname.match(/^\/admin\/courses\/(\d+)\/edit$/)?.[1]
          )}
        />
      );
    else if (pathname === "/admin/success-stories")
      screen = <AdminSuccessStories key={pathname} />;
    else if (pathname === "/admin/success-stories/new")
      screen = <AdminSuccessStories key={pathname} createMode />;
    else if (/^\/admin\/success-stories\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminSuccessStories
          key={pathname}
          editId={Number(
            pathname.match(/^\/admin\/success-stories\/(\d+)\/edit$/)?.[1]
          )}
        />
      );
    else if (pathname === "/admin/enrollments") screen = <AdminEnrollments />;
    else if (pathname.startsWith("/admin/enrollments/"))
      screen = <AdminEnrollmentDetail key={pathname} />;
    else if (pathname === "/admin/payment-settings")
      screen = <AdminPaymentSettings key={pathname} />;
    else if (pathname === "/admin/payment-settings/new")
      screen = <AdminPaymentSettings key={pathname} createMode />;
    else if (/^\/admin\/payment-settings\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminPaymentSettings
          key={pathname}
          editId={Number(
            pathname.match(/^\/admin\/payment-settings\/(\d+)\/edit$/)?.[1]
          )}
        />
      );
    else if (pathname === "/admin/instructors")
      screen = <AdminInstructors key={pathname} />;
    else if (pathname === "/admin/instructors/new")
      screen = <AdminInstructors key={pathname} createMode />;
    else if (/^\/admin\/instructors\/[\w-]+\/edit$/.test(pathname))
      screen = (
        <AdminInstructors key={pathname} editId={pathname.split("/")[3]} />
      );
    else if (pathname === "/admin/batches")
      screen = <AdminBatches key={pathname} />;
    else if (pathname === "/admin/batches/new")
      screen = <AdminBatches key={pathname} createMode />;
    else if (/^\/admin\/batches\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminBatches
          key={pathname}
          editId={Number(
            pathname.match(/^\/admin\/batches\/(\d+)\/edit$/)?.[1]
          )}
        />
      );
    else if (
      pathname === "/admin/website" ||
      pathname.startsWith("/admin/website/")
    )
      screen = <AdminWebsite />;
    else if (pathname === "/admin/settings") screen = <AdminSettings />;
    else if (pathname === "/admin/profile") screen = <AdminProfile />;
    // /admin/ielts redirects to Listening (next.config.ts); render it here too in case it doesn't.
    else if (pathname === "/admin/ielts")
      screen = <AdminMockTests key="listening" module="listening" />;
    else if (isMockModule(pathname.slice("/admin/ielts/".length)))
      screen = (
        <AdminMockTests
          key={pathname}
          module={pathname.slice("/admin/ielts/".length) as MockModule}
        />
      );
    else if (pathname === "/admin/ielts/cambridge")
      screen = <AdminCambridgeLibrary />;
    else if (
      pathname === "/admin/ielts/attempts" ||
      pathname.startsWith("/admin/ielts/attempts/")
    )
      screen = <AdminMockResults key={pathname} />;
    else if (pathname.startsWith("/admin/ielts/"))
      screen = <AdminMockTestEditor key={pathname} />;
    else if (pathname === "/admin/users/new") screen = <AdminUserCreate />;
    else if (/^\/admin\/users\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminUserEdit
          id={Number(pathname.match(/^\/admin\/users\/(\d+)\/edit$/)?.[1])}
        />
      );
    else if (pathname === "/admin/users" || pathname === "/admin/students")
      screen = <AdminUsers />;
    else if (pathname === "/admin/roles") screen = <AdminRoles />;
    else if (pathname === "/admin/resources/new")
      screen = <AdminResourceForm kind="resource" />;
    else if (/^\/admin\/resources\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminResourceForm
          kind="resource"
          editId={Number(
            pathname.match(/^\/admin\/resources\/(\d+)\/edit$/)?.[1]
          )}
        />
      );
    else if (pathname === "/admin/resources/vocabulary/new")
      screen = <AdminResourceForm kind="vocabulary" />;
    else if (/^\/admin\/resources\/vocabulary\/\d+\/edit$/.test(pathname))
      screen = (
        <AdminResourceForm
          kind="vocabulary"
          editId={Number(
            pathname.match(/^\/admin\/resources\/vocabulary\/(\d+)\/edit$/)?.[1]
          )}
        />
      );
    else if (pathname === "/admin/resources/vocabulary")
      screen = <AdminResources initialSection="vocabulary" />;
    else if (pathname === "/admin/resources") screen = <AdminResources />;
    else if (pathname === "/admin/media") screen = <AdminMedia />;
    return <AdminLayout>{screen}</AdminLayout>;
  }
  return <NotFound />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
