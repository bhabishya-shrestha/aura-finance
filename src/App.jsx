import React, { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import StatementImporter from "./components/StatementImporter";
import useStore from "./store";
import { initializeDatabase } from "./database";

function App() {
  const { loadTransactions, loadAccounts } = useStore();

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

  return (
    <div className="flex h-screen bg-dark-charcoal">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Dashboard />
      </main>
      <StatementImporter />
    </div>
  );
}

export default App;
