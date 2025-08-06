import React, { useState, useEffect, useRef } from "react";
import { Bell, Menu, Sun, Moon, X } from "lucide-react";
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
    markUpdateNotificationAsRead,
  } = useStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const headerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = notification => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.action) {
      notification.action();
    }
  };

  const formatTimeAgo = timestamp => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = type => {
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



  return (
    <header
      ref={headerRef}
      className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
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
              {(unreadCount > 0 ||
                (lastUpdateNotification && !lastUpdateNotification.read)) && (
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
                    {(unreadCount > 0 ||
                      (lastUpdateNotification &&
                        !lastUpdateNotification.read)) && (
                      <button
                        onClick={() => {
                          markAllNotificationsAsRead();
                          if (
                            lastUpdateNotification &&
                            !lastUpdateNotification.read
                          ) {
                            markUpdateNotificationAsRead();
                          }
                          setShowNotifications(false);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 max-h-80 overflow-y-auto">
                  {/* Update Notification */}
                  {lastUpdateNotification && (
                    <div
                      onClick={() => {
                        if (!lastUpdateNotification.read) {
                          markUpdateNotificationAsRead();
                        }
                      }}
                      className={`mb-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        lastUpdateNotification.read
                          ? "bg-gray-50 dark:bg-gray-700"
                          : "bg-blue-50 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">🎉</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              lastUpdateNotification.read
                                ? "text-gray-700 dark:text-gray-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            What&apos;s New in Aura Finance v
                            {lastUpdateNotification.version}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                            {lastUpdateNotification.features &&
                              lastUpdateNotification.features.length > 0 && (
                                <p>
                                  ✨ {lastUpdateNotification.features.length}{" "}
                                  new features added
                                </p>
                              )}
                            {lastUpdateNotification.bugFixes &&
                              lastUpdateNotification.bugFixes.length > 0 && (
                                <p>
                                  🐛 {lastUpdateNotification.bugFixes.length}{" "}
                                  bug fixes and improvements
                                </p>
                              )}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTimeAgo(lastUpdateNotification.timestamp)}
                          </p>
                        </div>
                        {!lastUpdateNotification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            clearUpdateNotification();
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Regular Notifications */}
                  {notifications.length === 0 && !lastUpdateNotification ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 10).map(notification => (
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
        </div>
      </div>
    </header>
  );
};

export default Header;
