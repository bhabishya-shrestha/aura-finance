import React from "react";
import { Sparkles, Bell, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import SearchBar from "./SearchBar";

const Header = ({ onMenuToggle, showMenuButton = false }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-apple-lg hover:bg-apple-glass-200/60 transition-all duration-200 backdrop-blur-apple-sm flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 icon-white" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Aura Finance
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                Personal Finance Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Search (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <SearchBar />
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-sm" />
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <div className="relative group">
                <button
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:scale-105 transition-all duration-200 shadow-sm flex-shrink-0"
                  aria-label="User menu"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 fidelity-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
