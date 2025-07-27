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
import SettingsPage from "./pages/SettingsPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden iphone15pro:flex-col">
      {/* Sidebar */}
      <Sidebar
        onPageChange={setCurrentPage}
        currentPage={currentPage}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={toggleMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 iphone15pro:min-h-0">
        {/* Header */}
        <Header onMenuToggle={toggleMobileSidebar} showMenuButton={true} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto iphone15pro:overflow-y-auto iphone15pro:pb-safe">
          <div className="w-full h-full iphone15pro:min-h-0">
            {currentPage === "dashboard" && <DashboardPage />}
            {currentPage === "accounts" && <AccountsPage />}
            {currentPage === "analytics" && <AnalyticsPage />}
            {currentPage === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App Content Component
const AppContent = () => {
  const { isAuthenticated, isInitialized } = useAuth();

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
