import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/screens/NotFound";
import { usePathname } from "next/navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomeV2 from "./screens/HomeV2";
import type { MockModule } from "@shared/mock";

// Every screen except the home page loads on demand, so visitors to the public site
// don't download the admin and student apps.
const Home = dynamic(() => import("./screens/Home"));
const V2Courses = dynamic(() => import("./screens/V2Courses"));
const V2CourseDetail = dynamic(() => import("./screens/V2CourseDetail"));
const V2About = dynamic(() => import("./screens/V2About"));
const V2SuccessStories = dynamic(() => import("./screens/V2SuccessStories"));
const V2HowItWorks = dynamic(() => import("./screens/V2HowItWorks"));
const V2Contact = dynamic(() => import("./screens/V2Contact"));
const V2Enroll = dynamic(() => import("./screens/V2Enroll"));
const CoursesPage = dynamic(() => import("./screens/CoursesPage"));
const CourseDetailPage = dynamic(() => import("./screens/CourseDetailPage"));
const SuccessStoriesPage = dynamic(
  () => import("./screens/SuccessStoriesPage")
);
const AdminDashboard = dynamic(() => import("./screens/AdminDashboard"));
const AdminCourses = dynamic(() => import("./screens/AdminCourses"));
const AdminSuccessStories = dynamic(
  () => import("./screens/AdminSuccessStories")
);
const AdminEnrollments = dynamic(() => import("./screens/AdminEnrollments"));
const AdminBatches = dynamic(() => import("./screens/AdminBatches"));
const AdminWebsite = dynamic(() => import("./screens/AdminWebsite"));
const AdminSettings = dynamic(() => import("./screens/AdminSettings"));
const AdminInstructors = dynamic(() => import("./screens/AdminInstructors"));
const AdminPaymentSettings = dynamic(
  () => import("./screens/AdminPaymentSettings")
);
const AdminProfile = dynamic(() => import("./screens/AdminProfile"));
const AdminLayout = dynamic(() => import("./components/AdminLayout"));
const AdminMockTests = dynamic(() => import("./screens/AdminMockTests"));
const AdminMockTestEditor = dynamic(
  () => import("./screens/AdminMockTestEditor")
);
const AdminCambridgeLibrary = dynamic(
  () => import("./screens/AdminCambridgeLibrary")
);
const AdminMockResults = dynamic(() => import("./screens/AdminMockResults"));
const AdminUsers = dynamic(() => import("./screens/AdminUsers"));
const AdminUserCreate = dynamic(() => import("./screens/AdminUserCreate"));
const AdminUserEdit = dynamic(() => import("./screens/AdminUserEdit"));
const AdminRoles = dynamic(() => import("./screens/AdminRoles"));
const AdminResources = dynamic(() => import("./screens/AdminResources"));
const AdminResourceForm = dynamic(() => import("./screens/AdminResourceForm"));
const AdminMedia = dynamic(() => import("./screens/AdminMedia"));
const AdminEnrollmentDetail = dynamic(
  () => import("./screens/AdminEnrollmentDetail")
);
const StudentDashboard = dynamic(() => import("./screens/StudentDashboard"));
const StudentAttempt = dynamic(() => import("./screens/StudentAttempt"));
const StudentAttemptPreview = dynamic(() =>
  import("./screens/StudentAttempt").then(m => m.StudentAttemptPreview)
);

// Kept here (not imported from AdminMockTests) so that screen stays in its own bundle.
const MOCK_MODULES: string[] = ["listening", "reading", "writing", "speaking"];
const isMockModule = (value: string): value is MockModule =>
  MOCK_MODULES.includes(value);

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
