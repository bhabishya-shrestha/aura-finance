import React, { useState } from "react";
import { Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileHeader = ({ onMenuToggle, currentPage, isMenuOpen }) => {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false); // Close user menu if open
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false); // Close notifications if open
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow pt-safe h-14 flex items-center">
      <div className="flex items-center justify-between w-full px-4">
        {/* Left side - Hamburger menu and title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className={`w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center ${
              isMenuOpen
                ? "bg-blue-100 dark:bg-blue-900/20"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <div className="relative w-5 h-5">
              <span
                className={`absolute top-0 left-0 w-5 h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`absolute top-2 left-0 w-5 h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute top-4 left-0 w-5 h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
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

        {/* Right side - Notifications and User Profile */}
        <div className="flex items-center gap-2 relative">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className={`w-10 h-10 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                showNotifications
                  ? "bg-blue-100 dark:bg-blue-900/20"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Welcome to Aura Finance!
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Get started by importing your first bank statement.
                        </p>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No more notifications
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className={`p-1 rounded-lg transition-colors duration-200 ${
                showUserMenu
                  ? "bg-blue-100 dark:bg-blue-900/20"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              aria-label="User menu"
            >
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
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(
                          user?.user_metadata?.full_name ||
                          user?.email?.split("@")[0] ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to settings
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default MobileHeader;
