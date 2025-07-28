import React, { useState } from "react";
import {
  BarChart3,
  Wallet,
  Settings,
  Home,
  TrendingUp,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = ({
  onPageChange,
  currentPage,
  isMobileOpen,
  onMobileToggle,
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      description: "Overview of your finances",
    },
    {
      id: "accounts",
      icon: Wallet,
      label: "Accounts",
      description: "Manage your accounts",
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      description: "Financial insights",
    },
    {
      id: "transactions",
      icon: FileText,
      label: "Transactions",
      description: "View all transactions",
    },
    {
      id: "reports",
      icon: TrendingUp,
      label: "Reports",
      description: "Generate reports",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      description: "App preferences",
    },
  ];

  const handleMenuClick = pageId => {
    onPageChange(pageId);
    // Close mobile sidebar after navigation
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen transition-all duration-300 ease-in-out fixed lg:relative z-50 ${
          isCollapsed ? "w-16 lg:w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-3 sm:p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {!isCollapsed && (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  Aura
                </h2>
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group flex-shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-200" />
              ) : (
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-200" />
              )}
            </button>
          </div>

          {/* User Info */}
          {user && !isCollapsed && (
            <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-white">
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
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
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

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 group relative ${
                  currentPage === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : item.description}
              >
                <item.icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${
                    currentPage === item.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  } ${isCollapsed ? "" : "group-hover:scale-110"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm sm:text-base truncate">
                    {item.label}
                  </span>
                )}

                {/* Active indicator */}
                {currentPage === item.id && (
                  <div className="absolute right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full shadow-sm" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div
            className={`mt-auto pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? "text-center" : ""}`}
          >
            {!isCollapsed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Version 1.0.1
              </div>
            )}
            <div
              className={`text-xs text-gray-500 dark:text-gray-400 ${isCollapsed ? "text-center" : ""}`}
            >
              {isCollapsed ? "Aura" : "Aura Finance"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
