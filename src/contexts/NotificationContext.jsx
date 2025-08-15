import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
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
  const removeNotificationRef = useRef();

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
    };

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

  const showSuccess = useCallback(
    (message, duration) => {
      return addNotification({
        type: "success",
        message,
        duration,
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
      });
    },
    [addNotification]
  );

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
