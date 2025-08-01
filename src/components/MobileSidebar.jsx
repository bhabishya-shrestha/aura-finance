import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  CreditCard,
  TrendingUp,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileSidebar = ({ isOpen, onClose, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const sidebarRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Manage body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [isOpen]);

  // Touch event handlers for swipe gestures
  const onTouchStart = e => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = e => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    // Close sidebar on left swipe (swipe left to close)
    if (isLeftSwipe) {
      onClose();
    }

    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "accounts", label: "Accounts", icon: CreditCard },
    { id: "transactions", label: "Transactions", icon: FileText },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const handleNavigation = pageId => {
    onPageChange(pageId);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      // Error handled silently - user will be redirected to login
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform smooth-transition-slow z-50 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Greeting Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              {getPersonalizedGreeting()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {getDailyMessage()}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
