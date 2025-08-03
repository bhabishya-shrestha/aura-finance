import React, { useState } from "react";
import {
  BarChart3,
  Wallet,
  Settings,
  Home,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = ({
  onPageChange,
  currentPage,
  isMobileOpen,
  onMobileToggle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  // Generate personalized greeting based on time and user info
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    const userName =
      user?.user_metadata?.full_name?.split(" ")[0] ||
      user?.email?.split("@")[0] ||
      "there";

    let timeGreeting = "";
    if (hour < 12) {
      timeGreeting = "Good morning";
    } else if (hour < 17) {
      timeGreeting = "Good afternoon";
    } else {
      timeGreeting = "Good evening";
    }

    // Add some variety to the greetings
    const greetings = [
      `${timeGreeting}, ${userName}!`,
      `${timeGreeting}, ${userName}! 👋`,
      `Hello ${userName}! ✨`,
      `Welcome back, ${userName}!`,
      `Hey ${userName}! 💫`,
      `${timeGreeting}, ${userName}! 🌟`,
    ];

    // Use a simple hash of the date to get consistent daily greeting
    const today = new Date().toDateString();
    const hash = today.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return greetings[Math.abs(hash) % greetings.length];
  };

  // Generate daily motivational message
  const getDailyMessage = () => {
    const messages = [
      "Ready to manage your finances?",
      "Your financial future starts today!",
      "Smart choices, bright future! 💰",
      "Every transaction counts! 📊",
      "Building wealth, one step at a time!",
      "Your money, your control! 💪",
      "Financial freedom awaits! 🚀",
      "Track, plan, succeed! 📈",
      "Your financial journey continues!",
      "Making money work for you! 💎",
    ];

    // Use a different hash for the message to get variety
    const today = new Date().toDateString();
    const hash = today.split("").reduce((a, b) => {
      a = (a << 7) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return messages[Math.abs(hash) % messages.length];
  };

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
          isCollapsed ? "w-16 lg:w-20 shadow-lg" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div
            className={`${isCollapsed ? "flex flex-col items-center" : "flex items-center justify-between"} mb-6`}
          >
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                  {getPersonalizedGreeting()}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getDailyMessage()}
                </p>
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg smooth-transition group flex-shrink-0 ${
                isCollapsed
                  ? "bg-gray-50 dark:bg-gray-800/50 sidebar-collapsed-pulse"
                  : ""
              }`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white smooth-transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white smooth-transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg smooth-transition group relative ${
                  currentPage === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : item.description}
              >
                <item.icon
                  className={`w-5 h-5 smooth-transition ${
                    currentPage === item.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  } ${isCollapsed ? "" : "group-hover:scale-105"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium text-base truncate">
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
              {isCollapsed ? "v1.3" : "Version 1.3.0"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
