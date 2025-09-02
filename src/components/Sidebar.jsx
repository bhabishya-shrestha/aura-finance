import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Wallet,
  Settings,
  Home,
  TrendingUp,
  FileText,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useFirebaseAuth } from "../contexts/FirebaseAuthContext";
import firebaseSync from "../services/firebaseSync";

const Sidebar = ({ isMobileOpen, onMobileToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    lastSyncTime: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const { user, logout } = useFirebaseAuth();

  // Derive currentPage from URL
  const currentPage = location.pathname.substring(1) || "dashboard";

  // Update sync status every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(firebaseSync.getSyncStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Generate personalized greeting based on time and user info
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    // Prefer a human-friendly name; if the stored name looks like an email, use the email prefix
    const rawName = (user?.name || "").trim();
    const computedName =
      rawName && !rawName.includes("@")
        ? rawName.split(" ")[0]
        : user?.email?.split("@")[0] || "there";
    const userName = computedName || "there";

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
      path: "/dashboard",
    },
    {
      id: "accounts",
      icon: Wallet,
      label: "Accounts",
      description: "Manage your accounts",
      path: "/accounts",
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      description: "Financial insights",
      path: "/analytics",
    },
    {
      id: "transactions",
      icon: FileText,
      label: "Transactions",
      description: "View all transactions",
      path: "/transactions",
    },
    {
      id: "reports",
      icon: TrendingUp,
      label: "Reports",
      description: "Generate reports",
      path: "/reports",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      description: "App preferences",
      path: "/settings",
    },
  ];

  const handleMenuClick = pageId => {
    const menuItem = menuItems.find(item => item.id === pageId);
    if (menuItem) {
      navigate(menuItem.path);
    }

    // Close mobile sidebar after navigation
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      await firebaseSync.forceSync();
    } catch (error) {
      console.error("Force sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = timestamp => {
    if (!timestamp) return "Never";

    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
              <div className="min-w-0 flex-1 mr-3">
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

          {/* Sync Status */}
          {user && (
            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${isCollapsed ? "justify-center" : ""}`}
              >
                {syncStatus.syncInProgress || isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                ) : syncStatus.isOnline ? (
                  <Cloud className="w-4 h-4 text-green-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-red-500" />
                )}
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {syncStatus.syncInProgress || isSyncing
                        ? "Syncing..."
                        : syncStatus.isOnline
                          ? "Synced"
                          : "Offline"}
                    </div>
                    {syncStatus.isOnline && !syncStatus.syncInProgress && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLastSync(syncStatus.lastSyncTime)}
                      </div>
                    )}
                    {syncStatus.syncInProgress && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full animate-pulse"
                            style={{ width: "60%" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {syncStatus.isOnline &&
                  !syncStatus.syncInProgress &&
                  !isSyncing &&
                  !isCollapsed && (
                    <button
                      onClick={handleForceSync}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Force sync now"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                {!isCollapsed && (
                  <button
                    onClick={() => setShowSyncDetails(v => !v)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={
                      showSyncDetails
                        ? "Hide sync details"
                        : "Show sync details"
                    }
                  >
                    {/* Using a simple link icon SVG inline to avoid adding new imports */}
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                )}
              </div>
              {!isCollapsed && showSyncDetails && (
                <div className="px-3 pb-3">
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-[11px] space-y-1 text-gray-600 dark:text-gray-300">
                      <div className="font-medium">Firebase Sync</div>
                      <div className="text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </div>
                      <div className="text-green-600 dark:text-green-400">
                        Cross-device sync enabled
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sign Out */}
          <div className="pt-2">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 p-3 rounded-lg smooth-transition group text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Sign Out" : "Sign out of your account"}
            >
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 smooth-transition" />
              {!isCollapsed && (
                <span className="font-medium text-base">Sign Out</span>
              )}
            </button>
          </div>

          {/* Footer */}
          <div
            className={`pt-3 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? "text-center" : ""}`}
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
