import React, { useState } from "react";
import {
  Home,
  Wallet,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileNav = ({ onPageChange, currentPage }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Simplified menu items - only the most important ones
  const primaryMenuItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Home",
    },
    {
      id: "accounts",
      icon: Wallet,
      label: "Accounts",
    },
    {
      id: "transactions",
      icon: FileText,
      label: "Transactions",
    },
  ];

  // Secondary menu items in user menu
  const secondaryMenuItems = [
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
    },
    {
      id: "reports",
      icon: TrendingUp,
      label: "Reports",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  const handleMenuClick = (pageId) => {
    onPageChange(pageId);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      {/* Backdrop for user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 lg:hidden pb-safe">
        <div className="px-3 py-2">
          {/* Primary Navigation - 3 main items */}
          <div className="flex items-center justify-between">
            {primaryMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 flex-1 mx-1 min-h-[52px] justify-center ${
                  currentPage === item.id
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-medium leading-tight text-center">
                  {item.label}
                </span>

                {/* Active indicator */}
                {currentPage === item.id && (
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1" />
                )}
              </button>
            ))}

            {/* User Menu Button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 flex-1 mx-1 min-h-[52px] justify-center ${
                showUserMenu
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              aria-label="More options"
            >
              <Menu className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium leading-tight text-center">
                More
              </span>
            </button>
          </div>
        </div>

        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            {/* User Profile Section */}
            {user && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.user_metadata?.full_name ||
                        user.email?.split("@")[0] ||
                        "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Navigation Items */}
            <div className="p-2">
              <div className="grid grid-cols-3 gap-2">
                {secondaryMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 min-h-[56px] justify-center ${
                      currentPage === item.id
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    aria-label={item.label}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-medium leading-tight text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileNav;
