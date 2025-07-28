import React from "react";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileHeader = ({ onMenuToggle, currentPage }) => {
  const { user } = useAuth();

  const getPageTitle = page => {
    const titles = {
      dashboard: "Dashboard",
      accounts: "Accounts",
      transactions: "Transactions",
      analytics: "Analytics",
      reports: "Reports",
      settings: "Settings",
    };
    return titles[page] || "Aura Finance";
  };

  return (
    <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4 text-gray-700 dark:text-gray-400" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getPageTitle(currentPage)}
            </h1>
          </div>
        </div>

        {/* Right side - Notifications only */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-gray-700 dark:text-gray-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </button>

          {/* User avatar - simplified */}
          {user && (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-medium text-white">
                {(
                  user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
