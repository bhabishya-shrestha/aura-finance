import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [releaseNotes, setReleaseNotes] = useState(null);
  const removeNotificationRef = useRef();

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("aura_notifications");
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        // Only restore notifications that are less than 24 hours old
        const validNotifications = parsed.filter(notification => {
          const notificationTime = new Date(notification.timestamp);
          const now = new Date();
          return now - notificationTime < 24 * 60 * 60 * 1000; // 24 hours
        });
        setNotifications(validNotifications);
      }
    } catch (error) {
      console.warn("Failed to load notifications from localStorage:", error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("aura_notifications", JSON.stringify(notifications));
    } catch (error) {
      console.warn("Failed to save notifications to localStorage:", error);
    }
  }, [notifications]);

  // Check for new release notes on mount
  useEffect(() => {
    checkForReleaseNotes();
  }, []);

  const checkForReleaseNotes = useCallback(() => {
    const currentVersion = "1.3.0";
    const lastSeenVersion = localStorage.getItem("aura_last_seen_version");

    console.log("🔍 Checking for release notes:", {
      currentVersion,
      lastSeenVersion,
    });

    if (lastSeenVersion !== currentVersion) {
      const releaseInfo = {
        version: currentVersion,
        date: new Date().toISOString(),
        features: [
          "Enhanced document import with AI analysis",
          "Improved analytics and data visualization",
          "Better duplicate transaction detection",
          "Enhanced statement parsing support",
          "Streamlined account assignment workflow",
          "Improved error handling and user feedback",
          "Enterprise-grade architecture improvements",
          "Comprehensive testing infrastructure",
          "Performance monitoring and optimization",
          "Professional UI/UX enhancements",
        ],
        bugFixes: [
          "Fixed sidebar navigation issues",
          "Resolved sync status display problems",
          "Improved notification system reliability",
          "Enhanced mobile responsiveness",
          "Fixed UI layout and positioning issues",
          "Improved overall app stability and performance",
        ],
        improvements: [
          "Split monolithic store into domain-specific stores",
          "Added comprehensive unit and integration tests",
          "Implemented CI/CD pipeline with quality gates",
          "Added performance monitoring with Core Web Vitals",
          "Enhanced accessibility and keyboard navigation",
          "Improved error boundaries and error handling",
        ],
      };

      setReleaseNotes(releaseInfo);
      localStorage.setItem("aura_last_seen_version", currentVersion);
    }
  }, []);

  const removeNotification = useCallback(id => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  // Store the removeNotification function in the ref
  removeNotificationRef.current = removeNotification;

  const addNotification = useCallback(notification => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false,
    };

    console.log("🔔 Adding notification:", newNotification);
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      if (removeNotificationRef.current) {
        removeNotificationRef.current(id);
      }
    }, duration);

    return id;
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationAsRead = useCallback(id => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const dismissReleaseNotes = useCallback(() => {
    setReleaseNotes(null);
  }, []);

  const showSuccess = useCallback(
    (message, duration) => {
      return addNotification({
        type: "success",
        message,
        duration,
        icon: "✅",
      });
    },
    [addNotification]
  );

  const showError = useCallback(
    (message, duration) => {
      return addNotification({
        type: "error",
        message,
        duration: duration || 8000, // Errors stay longer
        icon: "❌",
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, duration) => {
      return addNotification({
        type: "warning",
        message,
        duration,
        icon: "⚠️",
      });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, duration) => {
      return addNotification({
        type: "info",
        message,
        duration,
        icon: "ℹ️",
      });
    },
    [addNotification]
  );

  const showReleaseNotes = useCallback(() => {
    console.log("🚀 showReleaseNotes called, releaseNotes:", releaseNotes);
    if (releaseNotes) {
      console.log("🚀 Creating release notification");
      return addNotification({
        type: "release",
        message: `New version ${releaseNotes.version} is available!`,
        duration: 0, // Don't auto-dismiss
        icon: "🚀",
        releaseNotes,
      });
    } else {
      console.log("🚀 No release notes available");
    }
  }, [releaseNotes, addNotification]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const value = {
    notifications,
    releaseNotes,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markNotificationAsRead,
    dismissReleaseNotes,
    showReleaseNotes,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
