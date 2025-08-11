import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MobileHeader from "./components/MobileHeader";
import MobileSidebar from "./components/MobileSidebar";
import MobileNav from "./components/MobileNav";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import FirebaseTest from "./components/FirebaseTest";

import { initializeDatabase } from "./database";
import useStore from "./store";
import { useMobileViewport } from "./hooks/useMobileViewport";
import firebaseSync from "./services/firebaseSync";
import authBridge from "./services/authBridge";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

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

  // Device-specific update notifications - REMOVED: Should only show when user explicitly requests
  // useEffect(() => {
  //   if (!lastUpdateNotification) {
  //     const isMobile = window.innerWidth <= 768;
  //
  //     if (isMobile) {
  //       setUpdateNotification({
  //         version: "1.3.0",
  //         features: [
  //           "Enhanced mobile navigation with improved sidebar design",
  //           "Better mobile header with proper notification indicators",
  //           "Improved mobile statement import process",
  //           "Enhanced mobile layout for accounts and transactions",
  //           "Professional mobile add account button design",
  //           "Better mobile viewport handling and responsive design",
  //         ],
  //         bugFixes: [
  //           "Fixed mobile browser compatibility issues",
  //           "Resolved notification dropdown alignment on mobile",
  //           "Fixed hamburger menu functionality",
  //           "Improved icon centering in mobile header",
  //           "Enhanced mobile scroll behavior and touch interactions",
  //         ],
  //       });
  //     } else {
  //       setUpdateNotification({
  //         version: "1.3.0",
  //         features: [
  //           "Completely redesigned Analytics page",
  //           "Enhanced AI-powered account detection and assignment",
  //           "Professional transaction editing capabilities",
  //           "Improved statement processing with better error handling",
  //           "Enhanced account assignment modal with modern design",
  //           "Better data visualization and chart improvements",
  //         ],
  //         bugFixes: [
  //           "Fixed analytics data display and chart rendering issues",
  //           "Resolved transaction import and account assignment bugs",
  //           "Improved overall app stability and performance",
  //           "Fixed UI layout and responsive design issues",
  //         ],
  //       });
  //     }
  //   }
  // }, [lastUpdateNotification, setUpdateNotification]);

  useEffect(() => {
    // Only initialize once
    if (isInitialized.current) return;

    // Initialize database for local storage fallback
    initializeDatabase();

    // Load data from local database
    loadTransactions();
    loadAccounts();

    isInitialized.current = true;
  }, [loadTransactions, loadAccounts]);

  // Update viewport height when page changes or mobile state changes
  useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        updateViewportHeight();
      }, 100);
    }
  }, [currentPage, isMobile, updateViewportHeight]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("aura-finance-currentPage", currentPage);
  }, [currentPage]);

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
  };

  const handleImportClick = () => {
    // Navigate to dashboard and trigger import modal
    navigate("/dashboard");
    setTriggerImport(true);
    // Reset trigger after a short delay
    setTimeout(() => setTriggerImport(false), 100);
  };

  return (
    <div
      className={`${isMobile ? "mobile-layout" : "flex h-screen"} bg-gray-50 dark:bg-gray-900 ${isMobile ? "" : "overflow-hidden"}`}
    >
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          onPageChange={page => {
            navigate(`/${page}`);
          }}
          currentPage={currentPage}
          isMobileOpen={showMobileSidebar}
          onMobileToggle={toggleMobileSidebar}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={closeMobileSidebar}
        currentPage={currentPage}
        onPageChange={page => {
          navigate(`/${page}`);
        }}
      />

      {/* Main Content */}
      <div
        className={`${isMobile ? "mobile-layout" : "flex-1 flex flex-col min-w-0"}`}
      >
        {/* Header - Desktop only */}
        <div className="hidden lg:block">
          <Header
            onMenuToggle={toggleMobileSidebar}
            showMenuButton={true}
            onCloseMobileSidebar={closeMobileSidebar}
          />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader
            onMenuClick={toggleMobileSidebar}
            onPageChange={page => {
              navigate(`/${page}`);
            }}
          />
        </div>

        {/* Page Content */}
        <main
          className={`${isMobile ? "mobile-content" : "flex-1 overflow-auto lg:pb-0 pt-14 lg:pt-0"}`}
        >
          <div className="w-full h-full">
            {currentPage === "dashboard" && (
              <DashboardPage
                onPageChange={page => {
                  navigate(`/${page}`);
                }}
                triggerImport={triggerImport}
                onImportClick={handleImportClick}
              />
            )}
            {currentPage === "accounts" && <AccountsPage />}
            {currentPage === "analytics" && <AnalyticsPage />}
            {currentPage === "transactions" && <TransactionsPage />}
            {currentPage === "reports" && <ReportsPage />}
            {currentPage === "settings" && (
              <SettingsPage
                onPageChange={page => {
                  navigate(`/${page}`);
                }}
              />
            )}
          </div>
        </main>

        {/* Mobile Quick Actions (Floating Action Button) - Hidden on Settings */}
        {currentPage !== "settings" && (
          <MobileNav
            onPageChange={page => {
              navigate(`/${page}`);
            }}
            currentPage={currentPage}
            onImportClick={handleImportClick}
          />
        )}
      </div>

      {/* Sync Status Indicator */}

      {/* Global Modals - Rendered outside main content for proper full-screen coverage */}
      {currentPage === "dashboard" && (
        <DashboardPage
          onPageChange={page => {
            navigate(`/${page}`);
          }}
          triggerImport={triggerImport}
          onImportClick={handleImportClick}
          isModalOnly={true}
        />
      )}
    </div>
  );
};

// Main App Content Component
const AppContent = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Handle route parameter from 404 redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentRoute = urlParams.get("currentRoute");

    if (currentRoute) {
      // Remove the parameter from URL and navigate to the correct route
      const newUrl =
        window.location.pathname +
        window.location.search
          .replace(`?currentRoute=${currentRoute}`, "")
          .replace(`&currentRoute=${currentRoute}`, "");
      window.history.replaceState({}, "", newUrl);

      // Navigate to the correct route
      window.location.href = `/${currentRoute}`;
    }
  }, []);

  // Show loading screen while checking authentication
  if (!isInitialized) {
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

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/auth"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
        }
      />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />

      {/* Firebase Test Route */}
      <Route
        path="/firebase-test"
        element={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <FirebaseTest />
          </div>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component with Providers
const App = () => {
  // Initialize auth bridge when app starts
  useEffect(() => {
    let isInitializing = false;

    const initializeAuth = async () => {
      if (isInitializing) return;
      isInitializing = true;

      try {
        // Initialize auth bridge (links Supabase OAuth to Firebase and handles sync)
        await authBridge.initialize();
      } catch (error) {
        console.log("App initialization error:", error);
      } finally {
        isInitializing = false;
      }
    };

    initializeAuth();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppContent />
            </Router>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
