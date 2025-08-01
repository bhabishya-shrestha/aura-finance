import React, { useState } from "react";
import { Sparkles, Bell, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import SearchBar from "./SearchBar";

const Header = ({
  onMenuToggle,
  showMenuButton = false,
  onCloseMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { toggleTheme, currentTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications data - in a real app, this would come from a store or API
  const notifications = [];
  const hasNewNotifications = false;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      // Error handled silently - user will be redirected to login
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-400" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Aura Finance
              </h1>
            </div>
          </div>
        </div>

        {/* Center Section - Search (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        {/* Right Section - Theme Toggle, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
            aria-label="Toggle theme"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-400" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-400" />
              {hasNewNotifications && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Notifications
                  </h3>
                  {notifications.length === 0 ? (
                    <div className="text-center py-4">
                      <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No new notifications
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <p className="text-sm text-gray-900 dark:text-white">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    "User"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    // Close mobile sidebar if it's open
                    if (onCloseMobileSidebar) {
                      onCloseMobileSidebar();
                    }
                  }}
                  onMouseEnter={() => setShowUserMenu(true)}
                  className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium hover:scale-105 transition-all duration-200 shadow-sm flex-shrink-0"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {(
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
