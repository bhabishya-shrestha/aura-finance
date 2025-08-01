import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { initializeDatabase } from "./database";
import useStore from "./store";

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
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { loadTransactions, loadAccounts } = useStore();

  useEffect(() => {
    // Initialize database for local storage fallback
    initializeDatabase();

    // Load data from local database
    loadTransactions();
    loadAccounts();
  }, [loadTransactions, loadAccounts]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          onPageChange={setCurrentPage}
          currentPage={currentPage}
          isMobileOpen={isMobileSidebarOpen}
          onMobileToggle={toggleMobileSidebar}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Desktop only */}
        <div className="hidden lg:block">
          <Header
            onMenuToggle={toggleMobileSidebar}
            showMenuButton={true}
            onCloseMobileSidebar={closeMobileSidebar}
          />
        </div>

        {/* Mobile Header */}
        <MobileHeader
          onMenuToggle={toggleMobileSidebar}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onCloseMobileSidebar={closeMobileSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto lg:pb-0 pt-14 lg:pt-0">
          <div className="w-full h-full">
            {currentPage === "dashboard" && (
              <DashboardPage onPageChange={setCurrentPage} />
            )}
            {currentPage === "accounts" && <AccountsPage />}
            {currentPage === "analytics" && <AnalyticsPage />}
            {currentPage === "transactions" && <TransactionsPage />}
            {currentPage === "reports" && <ReportsPage />}
            {currentPage === "settings" && (
              <SettingsPage onPageChange={setCurrentPage} />
            )}
          </div>
        </main>
      </div>
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
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
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
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
