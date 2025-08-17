import React, { useState } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Rocket,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

const NotificationToast = () => {
  const { notifications, removeNotification, markNotificationAsRead } =
    useNotifications();
  const [expandedRelease, setExpandedRelease] = useState(null);

  const getIcon = type => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "release":
        return <Rocket className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = type => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "release":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const getTextColor = type => {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-200";
      case "error":
        return "text-red-800 dark:text-red-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      case "info":
        return "text-blue-800 dark:text-blue-200";
      case "release":
        return "text-purple-800 dark:text-purple-200";
      default:
        return "text-gray-800 dark:text-gray-200";
    }
  };

  const handleNotificationClick = notification => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };

  const toggleReleaseExpansion = notificationId => {
    setExpandedRelease(
      expandedRelease === notificationId ? null : notificationId
    );
  };

  const renderReleaseNotes = notification => {
    if (notification.type !== "release" || !notification.releaseNotes) {
      return null;
    }

    const isExpanded = expandedRelease === notification.id;
    const { releaseNotes } = notification;

    return (
      <div className="mt-3 space-y-3">
        <button
          onClick={() => toggleReleaseExpansion(notification.id)}
          className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {isExpanded ? "Hide details" : "View release notes"}
        </button>

        {isExpanded && (
          <div className="space-y-3 text-sm">
            {releaseNotes.features && releaseNotes.features.length > 0 && (
              <div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  ✨ New Features
                </h4>
                <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                  {releaseNotes.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {releaseNotes.improvements &&
              releaseNotes.improvements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    🔧 Improvements
                  </h4>
                  <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                    {releaseNotes.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {releaseNotes.bugFixes && releaseNotes.bugFixes.length > 0 && (
              <div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  🐛 Bug Fixes
                </h4>
                <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                  {releaseNotes.bugFixes.map((fix, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-2 duration-300 ${getBackgroundColor(
            notification.type
          )} ${!notification.read ? "ring-2 ring-purple-200 dark:ring-purple-800" : ""}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${getTextColor(notification.type)}`}
            >
              {notification.message}
            </p>
            {renderReleaseNotes(notification)}
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
