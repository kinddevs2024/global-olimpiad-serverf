// Console security warning
if (typeof console !== 'undefined') {
  console.warn(
    '%cОстановитесь!',
    'font-size: 24px; font-weight: bold; color: red;'
  ) // eslint-disable-line no-console   

  
  console.warn(
    '%cЭта функция браузера предназначена для разработчиков. Если кто-то предложил вам скопировать и вставить что-то здесь, чтобы включить какую-либо функцию в глобальном олимпиаде или взломать чей-то аккаунт, это мошенники. Выполнив эти действия, вы предоставите им доступ к своему аккаунту аккаунт.',
    'font-size: 14px; color: red; line-height: 1.5;'
  )
}
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TestOlympiad from "./pages/TestOlympiad";
import EssayOlympiad from "./pages/EssayOlympiad";
import StartOlympiad from "./pages/StartOlympiad";
import Leaderboard from "./pages/Leaderboard";
import Results from "./pages/Results";
import AdminPanel from "./pages/AdminPanel";
import OwnerPanel from "./pages/OwnerPanel";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import CompleteProfile from "./pages/CompleteProfile";
import ResolterPanel from "./pages/ResolterPanel";
import SchoolTeacherPanel from "./pages/SchoolTeacherPanel";
import CheckerPanel from "./pages/CheckerPanel";
import UniversityDashboard from "./pages/UniversityDashboard";
import UniversityPanel from "./pages/UniversityPanel";
import Settings from "./pages/Settings";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Universities from "./pages/Universities";
import Schools from "./pages/Schools";
import BuyCoins from "./pages/BuyCoins";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";
import { USER_ROLES, GOOGLE_CLIENT_ID } from "./utils/constants";
import { ThemeProvider } from "./context/ThemeContext";
import { TranslationProvider } from "./context/TranslationContext";
import CookieConsentModal from "./components/CookieConsentModal/CookieConsentModal";
import { Analytics } from "@vercel/analytics/react";
import "./styles/design-tokens.css";
import "./styles/globals.css";
import "./styles/animations.css";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />}
        />

      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />}
      />

      <Route
        path="/about"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <About />}
      />

      <Route
        path="/contact"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Contact />}
      />

      <Route
        path="/services"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Services />}
      />

      <Route path="/updatepassword" element={<UpdatePassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/start"
        element={
          <ProtectedRoute>
            <StartOlympiad />
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <TestOlympiad />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/essay"
        element={
          <ProtectedRoute>
            <EssayOlympiad />
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/leaderboard"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Leaderboard />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/universities"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <Universities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/schools"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <Schools />
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.OWNER}>
            <OwnerPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resolter"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.RESOLTER}>
            <ResolterPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/school-teacher"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.SCHOOL_TEACHER}>
            <SchoolTeacherPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.CHECKER}>
            <CheckerPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/university"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.UNIVERSITY}>
            <UniversityDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/university-panel"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.UNIVERSITY}>
            <UniversityPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute
            allowedRoles={[
              USER_ROLES.STUDENT,
              USER_ROLES.ADMIN,
              USER_ROLES.OWNER,
              USER_ROLES.UNIVERSITY,
              USER_ROLES.SCHOOL_ADMIN,
              USER_ROLES.SCHOOL_TEACHER,
              USER_ROLES.CHECKER,
            ]}
          >
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute
            allowedRoles={[
              USER_ROLES.STUDENT,
              USER_ROLES.ADMIN,
              USER_ROLES.OWNER,
              USER_ROLES.UNIVERSITY,
              USER_ROLES.SCHOOL_ADMIN,
              USER_ROLES.SCHOOL_TEACHER,
              USER_ROLES.CHECKER,
            ]}
          >
            <ProfileEdit />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buy-coins"
        element={
          <ProtectedRoute>
            <BuyCoins />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <TranslationProvider>
        <AuthProvider>
          <ThemeProvider>
            <SocketProvider>
              <Router
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <ScrollToTop />
                <AnalyticsTracker />
                <CookieConsentWrapper />
                <div className="app">
                  <Navbar />
                  <main className="main-content">
                    <AppRoutes />
                  </main>
                </div>
              </Router>
            </SocketProvider>
          </ThemeProvider>
        </AuthProvider>
      </TranslationProvider>
    </GoogleOAuthProvider>
  );
}

const AnalyticsTracker = () => {
  const location = useLocation();
  return <Analytics route={location.pathname} path={location.pathname} />;
};

// Separate component to handle cookie consent modal
const CookieConsentWrapper = () => {
  const { showCookieConsent, handleCookieConsent } = useAuth();

  if (!showCookieConsent) return null;

  return (
    <CookieConsentModal
      onAccept={handleCookieConsent}
      onReject={() => handleCookieConsent(false)}
    />
  );
};

export default App;
