import React, { useState } from "react";
import {
  BarChart3,
  Wallet,
  Settings,
  Home,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar = ({
  onPageChange,
  currentPage,
  isMobileOpen,
  onMobileToggle,
}) => {
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
        className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen smooth-transition-slow fixed lg:relative z-50 ${
          isCollapsed ? "w-16 lg:w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={toggleCollapse}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md smooth-transition group flex-shrink-0 opacity-60 hover:opacity-100"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 smooth-transition" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 smooth-transition" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg smooth-transition group relative ${
                  currentPage === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : item.description}
              >
                <item.icon
                  className={`w-4 h-4 smooth-transition ${
                    currentPage === item.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  } ${isCollapsed ? "" : "group-hover:scale-105"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm truncate">
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div
            className={`mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? "text-center" : ""}`}
          >
            <div
              className={`text-xs text-gray-500 dark:text-gray-400 ${isCollapsed ? "text-center" : ""}`}
            >
              {isCollapsed ? "v1.0" : "Version 1.0.1"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
