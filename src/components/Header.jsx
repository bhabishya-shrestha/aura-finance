import React, { useState, useEffect, useRef } from "react";
import { Bell, Menu, Sun, Moon, X, Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import useStore from "../store";
import SearchBar from "./SearchBar";
import auraLogo from "../assets/aura-finance.png";

const Header = ({
  onMenuToggle,
  showMenuButton = false,
  onCloseMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { toggleTheme, currentTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    lastUpdateNotification,
    clearUpdateNotification,
  } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const headerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show update banner on first load
  useEffect(() => {
    if (lastUpdateNotification && !showUpdateBanner) {
      setShowUpdateBanner(true);
    }
  }, [lastUpdateNotification, showUpdateBanner]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.action) {
      notification.action();
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

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
    <header ref={headerRef} className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Update Notification Banner */}
      {showUpdateBanner && lastUpdateNotification && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                What's New in Aura Finance
              </h4>
              <div className="text-xs space-y-1">
                {lastUpdateNotification.features && lastUpdateNotification.features.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">✨ New Features:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {lastUpdateNotification.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {lastUpdateNotification.bugFixes && lastUpdateNotification.bugFixes.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">🐛 Bug Fixes:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {lastUpdateNotification.bugFixes.map((fix, index) => (
                        <li key={index}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                clearUpdateNotification();
                setShowUpdateBanner(false);
              }}
              className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 smooth-transition flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-400" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
              <img
                src={auraLogo}
                alt="Aura Finance"
                className="w-full h-full object-cover"
              />
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
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 smooth-transition flex-shrink-0"
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
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 smooth-transition flex-shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          markAllNotificationsAsRead();
                          setShowNotifications(false);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            notification.read
                              ? "bg-gray-50 dark:bg-gray-700"
                              : "bg-blue-50 dark:bg-blue-900/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  notification.read
                                    ? "text-gray-700 dark:text-gray-300"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
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
                  className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium hover:scale-105 smooth-transition shadow-sm flex-shrink-0"
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
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fade-in"
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
