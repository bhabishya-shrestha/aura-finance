import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("DashboardPage mounted");
    console.log("Auth state:", { user, isAuthenticated, isLoading });
  }, [user, isAuthenticated, isLoading]);

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if there is one
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 sm:p-6 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
            Dashboard
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Welcome back! Here&apos;s your financial overview.
          </p>
          {user && (
            <p className="text-sm text-gray-500">Logged in as: {user.email}</p>
          )}
        </div>
      </div>

      {/* Simple Content */}
      <div className="glass-card-hover p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          Authentication Status
        </h2>
        <div className="space-y-2">
          <p>
            <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
          </p>
          <p>
            <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
          </p>
          <p>
            <strong>User Email:</strong> {user?.email || "None"}
          </p>
        </div>
      </div>

      {/* Test Components Button */}
      <div className="mt-6">
        <button
          onClick={() => {
            try {
              // Test if we can import and use the store
              import("../store").then(() => {
                console.log("Store imported successfully");
              });
            } catch (err) {
              console.error("Error importing store:", err);
              setError(err.message);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Store Import
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
