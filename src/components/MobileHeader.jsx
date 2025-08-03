import React, { useState, useRef, useEffect } from "react";
import { Bell, User, Settings, Menu, X } from "lucide-react";
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
    clearUpdateNotification,
  } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
            {unreadCount > 0 && (
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

              <div className="p-2">
                {notifications.length === 0 ? (
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

      {/* Update Notification Banner */}
      {lastUpdateNotification && (
        <div className="fixed top-[calc(var(--mobile-header-height)+8px)] left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                What's New in Aura Finance
              </h4>
              <div className="text-xs space-y-1">
                {lastUpdateNotification.features &&
                  lastUpdateNotification.features.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">✨ New Features:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {lastUpdateNotification.features.map(
                          (feature, index) => (
                            <li key={index}>{feature}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {lastUpdateNotification.bugFixes &&
                  lastUpdateNotification.bugFixes.length > 0 && (
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
              onClick={clearUpdateNotification}
              className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHeader;
