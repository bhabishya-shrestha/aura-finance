import React, { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import { useFirebaseAuth } from "../contexts/FirebaseAuthContext";
import firebaseSync from "../services/firebaseSync";

const MobileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useFirebaseAuth();
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    lastSyncTime: null,
  });

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
    const rawName = (user?.name || "").trim();
    const computedName = rawName && !rawName.includes("@")
      ? rawName.split(" ")[0]
      : (user?.email?.split("@")[0] || "there");
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
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Swipe to close functionality
  const handleTouchStart = e => {
    // Only handle touch events on the sidebar container, not navigation items
    if (e.target.closest("button")) {
      return;
    }
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = e => {
    // Only handle touch events on the sidebar container, not navigation items
    if (e.target.closest("button")) {
      return;
    }
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = useCallback(
    e => {
      // Only handle touch events on the sidebar container, not navigation items
      if (e.target.closest("button")) {
        return;
      }

      const swipeDistance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 100; // Minimum distance to trigger close

      // Only close if it's a clear swipe gesture
      if (swipeDistance > minSwipeDistance) {
        onClose();
      }
    },
    [onClose]
  );

  // Add touch event listeners when sidebar is open
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const sidebar = sidebarRef.current;
      sidebar.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      sidebar.addEventListener("touchmove", handleTouchMove, { passive: true });
      sidebar.addEventListener("touchend", handleTouchEnd, { passive: true });

      return () => {
        sidebar.removeEventListener("touchstart", handleTouchStart, {
          passive: true,
        });
        sidebar.removeEventListener("touchmove", handleTouchMove, {
          passive: true,
        });
        sidebar.removeEventListener("touchend", handleTouchEnd, {
          passive: true,
        });
      };
    }
  }, [isOpen, handleTouchEnd]);

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
      icon: CreditCard,
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
    onClose();
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
      await firebaseSync.forceSync();
    } catch (error) {
      console.error("Force sync failed:", error);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out"
      >
        <div className="flex flex-col h-full">
          {/* User Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {getPersonalizedGreeting()}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getDailyMessage()}
              </p>
            </div>
          </div>
          {/* Navigation */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  onTouchEnd={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors active:scale-95 relative ${
                    currentPage === item.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      currentPage === item.id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-base truncate">
                      {item.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sync Status */}
          {user && (
            <div className="px-4 py-1 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 p-3 rounded-lg">
                {syncStatus.syncInProgress ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                ) : syncStatus.isOnline ? (
                  <Cloud className="w-4 h-4 text-green-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-red-500" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {syncStatus.syncInProgress
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
                </div>
                {syncStatus.isOnline && !syncStatus.syncInProgress && (
                  <button
                    onClick={handleForceSync}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Force sync now"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sign Out */}
          <div className="px-4 py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
            >
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>

          {/* Version */}
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Version 1.3.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
