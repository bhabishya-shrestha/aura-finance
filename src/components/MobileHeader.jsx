import React, { useState, useRef, useEffect } from "react";
import { Bell, User, Settings, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileHeader = ({ onMenuClick, onPageChange }) => {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const headerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={headerRef}
      className="mobile-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40"
    >
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </button>

      {/* App Title */}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aura Finance
        </h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No new notifications
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
            aria-label="User menu"
          >
            <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  {user?.email || "User"}
                </div>
                <button
                  onClick={() => {
                    onPageChange("settings");
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={signOut}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
