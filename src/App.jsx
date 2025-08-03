import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import MobileSidebar from "./components/MobileSidebar";
import MobileNav from "./components/MobileNav";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TransactionsPage from "./pages/TransactionsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { useMobileViewport } from "./hooks/useMobileViewport";
import useStore from "./store";

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const mainContentRef = useRef(null);
  const { isMobile, updateViewportHeight } = useMobileViewport();
  const { setUpdateNotification, lastUpdateNotification } = useStore();

  // Initialize update notification on first load
  useEffect(() => {
    if (!lastUpdateNotification) {
      setUpdateNotification({
        version: "1.2.0",
        features: [
          "Mobile-first navigation with sidebar design",
          "Enhanced mobile header with proper notifications",
          "Floating action button for quick actions",
          "Improved mobile statement import process",
          "Better mobile layout for accounts and transactions",
          "Professional mobile add account button",
          "Enhanced mobile viewport handling"
        ],
        bugFixes: [
          "Fixed mobile browser compatibility issues",
          "Resolved notification dropdown alignment",
          "Fixed hamburger menu functionality",
          "Improved icon centering in mobile header",
          "Enhanced mobile scroll behavior",
          "Fixed mobile layout padding and spacing"
        ]
      });
    }
  }, [lastUpdateNotification, setUpdateNotification]);

  // Update viewport height when page changes or mobile state changes
  React.useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        updateViewportHeight();
      }, 100);
    }
  }, [currentPage, isMobile, updateViewportHeight]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsMobileSidebarOpen(false);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <Router>
            <div className={`${isMobile ? 'mobile-layout' : 'h-screen'} bg-gray-50 dark:bg-gray-900`}>
              {/* Mobile Header */}
              <div className="lg:hidden">
                <MobileHeader onMenuClick={toggleMobileSidebar} onPageChange={handlePageChange} />
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block">
                <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
              </div>

              {/* Mobile Sidebar */}
              <MobileSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />

              {/* Main Content */}
              <main
                ref={mainContentRef}
                className={`${isMobile ? 'mobile-content pt-0' : 'overflow-auto'} flex-1 transition-all duration-200`}
              >
                <Routes>
                  <Route
                    path="/"
                    element={<DashboardPage onPageChange={handlePageChange} />}
                  />
                  <Route
                    path="/dashboard"
                    element={<DashboardPage onPageChange={handlePageChange} />}
                  />
                  <Route
                    path="/accounts"
                    element={<AccountsPage onPageChange={handlePageChange} />}
                  />
                  <Route
                    path="/analytics"
                    element={<AnalyticsPage onPageChange={handlePageChange} />}
                  />
                  <Route
                    path="/transactions"
                    element={<TransactionsPage onPageChange={handlePageChange} />}
                  />
                  <Route
                    path="/settings"
                    element={<SettingsPage onPageChange={handlePageChange} />}
                  />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                </Routes>
              </main>

              {/* Mobile Quick Actions (Floating Action Button) */}
              <MobileNav onPageChange={handlePageChange} currentPage={currentPage} />
            </div>
          </Router>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
