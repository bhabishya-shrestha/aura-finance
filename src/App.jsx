import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import Sidebar from "./components/Sidebar";
import { initializeDatabase } from "./database";

// Main App Content Component
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    // Initialize database for local storage fallback
    initializeDatabase();
  }, []);

  // Show loading screen while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-dark-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-muted-gray">Loading Aura Finance...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Main application layout
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "accounts":
        return <AccountsPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-charcoal">
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
};

// Main App Component with Auth Provider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
