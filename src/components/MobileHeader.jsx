import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  User,
  Settings,
  Menu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useStore from "../store";

const MobileHeader = ({ onMenuClick, onPageChange }) => {
  const { user, signOut } = useAuth();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    lastUpdateNotification,
    markUpdateNotificationAsRead,
  } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());
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

  const handleNotificationClick = notification => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.action) {
      notification.action();
    }
  };

  const toggleNotificationExpansion = notificationId => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
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
            {(unreadCount > 0 ||
              (lastUpdateNotification && !lastUpdateNotification.read)) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="fixed left-4 right-4 top-[calc(var(--mobile-header-height)+8px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
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

              <div className="p-2">
                {/* Update Notification */}
                {lastUpdateNotification && (
                  <div
                    onClick={() => {
                      if (!lastUpdateNotification.read) {
                        markUpdateNotificationAsRead();
                      }
                      toggleNotificationExpansion("update");
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
                                ✨ {lastUpdateNotification.features.length} new
                                features added
                              </p>
                            )}
                          {lastUpdateNotification.bugFixes &&
                            lastUpdateNotification.bugFixes.length > 0 && (
                              <p>
                                🐛 {lastUpdateNotification.bugFixes.length} bug
                                fixes and improvements
                              </p>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimeAgo(lastUpdateNotification.timestamp)}
                        </p>

                        {/* Expanded content */}
                        {expandedNotifications.has("update") && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            {lastUpdateNotification.features &&
                              lastUpdateNotification.features.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    ✨ New Features:
                                  </p>
                                  <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    {lastUpdateNotification.features.map(
                                      (feature, index) => (
                                        <li key={index} className="pl-2">
                                          • {feature}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            {lastUpdateNotification.bugFixes &&
                              lastUpdateNotification.bugFixes.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    🐛 Bug Fixes:
                                  </p>
                                  <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    {lastUpdateNotification.bugFixes.map(
                                      (fix, index) => (
                                        <li key={index} className="pl-2">
                                          • {fix}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                      {!lastUpdateNotification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <span className="text-gray-400">
                        {expandedNotifications.has("update") ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
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
