import React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileHeader = ({ onMenuToggle, currentPage, isMenuOpen }) => {
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
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow pt-safe h-14 flex items-center">
      <div className="flex items-center justify-between w-full px-4">
        {/* Left side - Hamburger menu and title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isMenuOpen
                ? "bg-blue-100 dark:bg-blue-900/20"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <div className="relative w-4 h-4">
              <span
                className={`absolute top-0 left-0 w-4 h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`absolute top-1.5 left-0 w-4 h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute top-3 left-0 w-4 h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </div>
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
