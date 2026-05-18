import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
// import CertificateVerify from "./pages/CertificateVerify"; // Hidden until feature is ready
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import SuccessStoriesPage from "./pages/SuccessStoriesPage";
import EnrollPage from "./pages/EnrollPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourses from "./pages/AdminCourses";
import AdminSuccessStories from "./pages/AdminSuccessStories";
import AdminEnrollments from "./pages/AdminEnrollments";
import AdminPaymentSettings from "./pages/AdminPaymentSettings";
import AdminBatches from "./pages/AdminBatches";
import AdminSiteSettings from "./pages/AdminSiteSettings";

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path={"/"} component={Home} />
      <Route path={"/courses"} component={CoursesPage} />
      <Route path={"/courses/:slug"} component={CourseDetailPage} />
      <Route path={"/success-stories"} component={SuccessStoriesPage} />
      <Route path={"/enroll"} component={EnrollPage} />
      {/* Certificate Verify — hidden until feature is ready, redirect to home */}
      {/* <Route path={"/verify"} component={CertificateVerify} /> */}

      {/* Admin Pages */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/courses"} component={AdminCourses} />
      <Route path={"/admin/success-stories"} component={AdminSuccessStories} />
      <Route path={"/admin/enrollments"} component={AdminEnrollments} />
      <Route path={"/admin/payment-settings"} component={AdminPaymentSettings} />
      <Route path={"/admin/batches"} component={AdminBatches} />
      <Route path={"/admin/site-settings"} component={AdminSiteSettings} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider
          defaultTheme="light"
        >
          <TooltipProvider>
              <Toaster />
              <Router />
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
