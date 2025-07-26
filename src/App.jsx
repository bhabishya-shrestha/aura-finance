import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import StatementImporter from "./components/StatementImporter";
import useStore from "./store";
import { initializeDatabase } from "./database";

function App() {
  const { loadTransactions, loadAccounts } = useStore();
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    // Initialize database and load data
    const initApp = async () => {
      try {
        await initializeDatabase();
        await loadTransactions();
        await loadAccounts();
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initApp();
  }, [loadTransactions, loadAccounts]);

  // Function to render the current page
  const renderCurrentPage = () => {
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
      <main className="flex-1 overflow-auto">{renderCurrentPage()}</main>
      <StatementImporter />
    </div>
  );
}

export default App;
