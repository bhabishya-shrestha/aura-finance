import React, { useEffect, useState, useRef, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FirebaseAuthProvider,
  useFirebaseAuth,
} from "./contexts/FirebaseAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AccessibilityProvider } from "./components/ui/AccessibilityProvider";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MobileHeader from "./components/MobileHeader";
import MobileSidebar from "./components/MobileSidebar";
import MobileNav from "./components/MobileNav";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { DashboardSkeleton } from "./components/ui/Skeleton";
import NotificationToast from "./components/NotificationToast";

import { initializeDatabase } from "./database";
import useStore from "./store";
import { useMobileViewport } from "./hooks/useMobileViewport";

// Lazy load pages for code splitting
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Page Loading Component
const PageLoading = ({ pageName = "page" }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner
        size="xl"
        text={`Loading ${pageName}...`}
        showText={true}
      />
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized } = useFirebaseAuth();

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner
          size="xl"
          text="Loading Aura Finance..."
          showText={true}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Main App Layout Component
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [triggerImport, setTriggerImport] = useState(false);

  // Derive currentPage from URL
  const currentPage = location.pathname.substring(1) || "dashboard";
  const {
    loadTransactions,
    loadAccounts,
    setUpdateNotification,
    lastUpdateNotification,
  } = useStore();
  const isInitialized = useRef(false);
  const { isMobile, updateViewportHeight } = useMobileViewport();

  // Initialize update notification on first load
  useEffect(() => {
    // Only set update notification if it doesn't exist AND we want to show it
    // For now, we'll disable automatic update notifications to prevent persistent banners
    // if (!lastUpdateNotification) {
    //   setUpdateNotification({
    //     version: "1.3.0",
    //     features: [
    //       "Enhanced document import with AI analysis",
    //       "Improved analytics and data visualization",
    //       "Better duplicate transaction detection",
    //       "Enhanced statement parsing support",
    //       "Streamlined account assignment workflow",
    //       "Improved error handling and user feedback"
    //     ],
    //     bugFixes: [
    //       "Fixed various UI layout and responsive design issues",
    //       "Resolved transaction import and processing bugs",
    //       "Improved overall app stability and performance"
    //     ],
    //   });
    // }
  }, [lastUpdateNotification, setUpdateNotification]);

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      if (isInitialized.current) return;

      try {
        await initializeDatabase();
        await loadAccounts();
        await loadTransactions();
        isInitialized.current = true;
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, [loadAccounts, loadTransactions]);

  // Update viewport height for mobile
  useEffect(() => {
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, [updateViewportHeight]);

  const handleMenuToggle = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const handleImportTrigger = () => {
    setTriggerImport(true);
    setTimeout(() => setTriggerImport(false), 100);
  };

  if (isMobile) {
    return (
      <div className="mobile-layout">
        <MobileHeader
          currentPage={currentPage}
          onMenuToggle={handleMenuToggle}
          onImportTrigger={handleImportTrigger}
        />

        <MobileSidebar
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          currentPage={currentPage}
        />

        <main className="mobile-content" id="main-content" tabIndex="-1">
          <ErrorBoundary>
            <Suspense fallback={<PageLoading pageName={currentPage} />}>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>

        <MobileNav currentPage={currentPage} />
        <NotificationToast />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentPage={currentPage}
          onMenuToggle={handleMenuToggle}
          onImportTrigger={handleImportTrigger}
        />

        <main
          className="flex-1 overflow-y-auto p-6"
          id="main-content"
          tabIndex="-1"
        >
          <ErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <NotificationToast />
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <FirebaseAuthProvider>
            <SettingsProvider>
              <AccessibilityProvider>
                <Router>
                  <Routes>
                    <Route
                      path="/auth"
                      element={
                        <Suspense
                          fallback={<PageLoading pageName="authentication" />}
                        >
                          <AuthPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Router>
              </AccessibilityProvider>
            </SettingsProvider>
          </FirebaseAuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
