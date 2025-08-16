import { create } from "zustand";
import { persist } from "zustand/middleware";
import { performanceMonitor } from "../services/performanceService";

/**
 * User Store
 * Manages user-related state, preferences, and settings
 */
const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      currentUser: null,
      userPreferences: {
        theme: "system", // "light", "dark", "system"
        currency: "USD",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h", // "12h", "24h"
        language: "en",
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacy: {
          shareAnalytics: true,
          shareUsageData: false,
        },
        display: {
          compactMode: false,
          showBalances: true,
          showCategories: true,
          defaultView: "dashboard", // "dashboard", "transactions", "accounts"
        },
      },
      notifications: [],
      unreadCount: 0,
      lastUpdateNotification: null,

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),

      setUserPreferences: (preferences) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences },
        })),

      // Update specific preference
      updatePreference: (category, key, value) =>
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            [category]: {
              ...state.userPreferences[category],
              [key]: value,
            },
          },
        })),

      // Add notification
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              read: false,
              ...notification,
            },
            ...state.notifications,
          ].slice(0, 100), // Keep only last 100 notifications
          unreadCount: state.unreadCount + 1,
        })),

      // Mark notification as read
      markNotificationAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      // Mark all notifications as read
      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        })),

      // Remove notification
      removeNotification: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== notificationId
          ),
          unreadCount: state.notifications.find(
            (n) => n.id === notificationId && !n.read
          )
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        })),

      // Set update notification
      setUpdateNotification: (notification) =>
        set({ lastUpdateNotification: notification }),

      // Clear update notification
      clearUpdateNotification: () => set({ lastUpdateNotification: null }),

      // Mark update notification as read
      markUpdateNotificationAsRead: () =>
        set((state) => ({
          lastUpdateNotification: state.lastUpdateNotification
            ? { ...state.lastUpdateNotification, read: true }
            : null,
        })),

      // Get user statistics
      getUserStats: () => {
        const { currentUser, notifications } = get();
        
        return {
          user: currentUser,
          notificationStats: {
            total: notifications.length,
            unread: notifications.filter((n) => !n.read).length,
            byType: notifications.reduce((acc, notification) => {
              const type = notification.type || "info";
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {}),
          },
          preferences: get().userPreferences,
        };
      },

      // Export user data
      exportUserData: () => {
        const { currentUser, userPreferences, notifications } = get();
        
        return {
          user: currentUser,
          preferences: userPreferences,
          notifications: notifications.slice(0, 50), // Export last 50 notifications
          exportDate: new Date().toISOString(),
          version: "1.0.0",
        };
      },

      // Import user data
      importUserData: (data) => {
        return performanceMonitor.measureFunction("importUserData", () => {
          try {
            if (data.user) {
              set({ currentUser: data.user });
            }
            
            if (data.preferences) {
              set({ userPreferences: data.preferences });
            }
            
            if (data.notifications) {
              set({ notifications: data.notifications });
            }
            
            performanceMonitor.recordMetric("user_data_imported", {
              hasUser: !!data.user,
              hasPreferences: !!data.preferences,
              hasNotifications: !!data.notifications,
            });
            
            return true;
          } catch (error) {
            console.error("Failed to import user data:", error);
            performanceMonitor.recordMetric("user_data_import_error", {
              error: error.message,
            });
            throw error;
          }
        });
      },

      // Clear all user data
      clearUserData: () => {
        return performanceMonitor.measureFunction("clearUserData", () => {
          try {
            set({
              currentUser: null,
              notifications: [],
              unreadCount: 0,
              lastUpdateNotification: null,
            });
            
            performanceMonitor.recordMetric("user_data_cleared");
          } catch (error) {
            console.error("Failed to clear user data:", error);
            performanceMonitor.recordMetric("user_data_clear_error", {
              error: error.message,
            });
            throw error;
          }
        });
      },

      // Validate user preferences
      validatePreferences: (preferences) => {
        const errors = [];

        // Validate theme
        if (preferences.theme && !["light", "dark", "system"].includes(preferences.theme)) {
          errors.push("Invalid theme preference");
        }

        // Validate currency
        if (preferences.currency && preferences.currency.length !== 3) {
          errors.push("Currency must be a 3-letter code");
        }

        // Validate date format
        if (preferences.dateFormat && !preferences.dateFormat.includes("MM")) {
          errors.push("Invalid date format");
        }

        // Validate time format
        if (preferences.timeFormat && !["12h", "24h"].includes(preferences.timeFormat)) {
          errors.push("Invalid time format");
        }

        // Validate language
        if (preferences.language && preferences.language.length !== 2) {
          errors.push("Language must be a 2-letter code");
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },

      // Get notification by ID
      getNotificationById: (id) => {
        const { notifications } = get();
        return notifications.find((notification) => notification.id === id);
      },

      // Get notifications by type
      getNotificationsByType: (type) => {
        const { notifications } = get();
        return notifications.filter((notification) => notification.type === type);
      },

      // Get unread notifications
      getUnreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter((notification) => !notification.read);
      },

      // Get recent notifications
      getRecentNotifications: (limit = 10) => {
        const { notifications } = get();
        return notifications.slice(0, limit);
      },
    }),
    {
      name: "aura-user-store",
      partialize: (state) => ({
        userPreferences: state.userPreferences,
        notifications: state.notifications.slice(0, 20), // Persist only last 20
        unreadCount: state.unreadCount,
        lastUpdateNotification: state.lastUpdateNotification,
      }),
    }
  )
);

export default useUserStore;
