import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

const defaultSettings = {
  // General Settings
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  language: "en",
  timezone: "UTC-5",

  // Appearance Settings
  theme: "auto", // auto, light, dark
  glassmorphismIntensity: 50,
  animationSpeed: "normal", // fast, normal, slow

  // Notification Settings
  emailNotifications: false,
  weeklyReports: false,
  budgetAlerts: true,

  // User Profile
  fullName: "",
  email: "",

  // Security Settings
  autoLogout: 30, // minutes
  requirePasswordForChanges: true,

  // Data Settings
  autoBackup: true,
  backupFrequency: "weekly", // daily, weekly, monthly
  dataRetention: 365, // days

  // AI Settings
  aiProvider: "gemini", // gemini, vertex
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("aura-settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all settings exist
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      // Error loading settings
    }
    return defaultSettings;
  });

  // Removed unused isLoading state for now

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("aura-settings", JSON.stringify(settings));
    } catch (error) {
      // Error saving settings
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateMultipleSettings = updates => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aura-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = async file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          // Validate imported settings
          const validSettings = {};
          Object.keys(defaultSettings).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(importedSettings, key)) {
              validSettings[key] = importedSettings[key];
            }
          });
          setSettings(prev => ({ ...prev, ...validSettings }));
          resolve(validSettings);
        } catch (error) {
          reject(new Error("Invalid settings file format"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // Currency formatting helper
  const formatCurrency = (amount, currency = settings.currency) => {
    const formatters = {
      USD: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
      EUR: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }),
      GBP: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "GBP",
      }),
      JPY: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "JPY",
      }),
    };

    return formatters[currency]
      ? formatters[currency].format(amount)
      : `$${amount.toFixed(2)}`;
  };

  // Date formatting helper
  const formatDate = (date, format = settings.dateFormat) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    switch (format) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const value = {
    settings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    exportSettings,
    importSettings,
    formatCurrency,
    formatDate,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
