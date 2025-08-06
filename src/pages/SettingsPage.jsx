import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Settings,
  User,
  Shield,
  Database,
  Palette,
  Download,
  Upload,
  Bell,
  Sun,
  Moon,
  Monitor,
  Save,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import useStore from "../store";
import aiService from "../services/aiService";

const SettingsPage = () => {
  const {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettings();
  const { setTheme, currentTheme } = useTheme();
  const { user } = useAuth();
  const {
    transactions,
    accounts,
    loadTransactions,
    loadAccounts,
    resetUserData,
    triggerUpdateNotification,
  } = useStore();

  const [activeTab, setActiveTab] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDataResetConfirm, setShowDataResetConfirm] = useState(false);
  const [serverUsageStats, setServerUsageStats] = useState(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const fileInputRef = useRef(null);

  // Load user data on mount
  useEffect(() => {
    loadTransactions();
    loadAccounts();
  }, [loadTransactions, loadAccounts]);

  // Load server-side usage stats
  const loadServerUsageStats = useCallback(async () => {
    if (!user) return;

    setIsLoadingUsage(true);
    try {
      const stats = await aiService.getServerUsageStats();
      setServerUsageStats(stats);
    } catch (error) {
      console.error("Failed to load server usage stats:", error);
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user]);

  // Load usage stats when AI Services tab is active
  useEffect(() => {
    if (activeTab === "ai-services") {
      loadServerUsageStats();
    }
  }, [activeTab, user, loadServerUsageStats]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("Settings saved successfully!");

    // Ensure notification starts hidden and then animates in
    setIsNotificationVisible(false);
    setTimeout(() => {
      setIsNotificationVisible(true);
    }, 10);

    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false);
      // Start fade out after 2.5 seconds
      setTimeout(() => {
        setIsNotificationVisible(false);
        // Clear message after fade out animation
        setTimeout(() => setSaveMessage(""), 300);
      }, 2500);
    }, 1000);
  };

  const handleImportSettings = async event => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importSettings(file);
        setSaveMessage("Settings imported successfully!");

        // Ensure notification starts hidden and then animates in
        setIsNotificationVisible(false);
        setTimeout(() => {
          setIsNotificationVisible(true);
        }, 10);

        setTimeout(() => {
          setIsNotificationVisible(false);
          setTimeout(() => setSaveMessage(""), 300);
        }, 2500);
      } catch (error) {
        setSaveMessage("Error importing settings: " + error.message);

        // Ensure notification starts hidden and then animates in
        setIsNotificationVisible(false);
        setTimeout(() => {
          setIsNotificationVisible(true);
        }, 10);

        setTimeout(() => {
          setIsNotificationVisible(false);
          setTimeout(() => setSaveMessage(""), 300);
        }, 4500);
      }
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    setSaveMessage("Settings reset to default!");
    setIsNotificationVisible(true);
    setTimeout(() => {
      setIsNotificationVisible(false);
      setTimeout(() => setSaveMessage(""), 300);
    }, 2500);
    setShowResetConfirm(false);
  };

  const handleDataReset = async () => {
    try {
      // Clear transactions and accounts from store
      await resetUserData();
      setSaveMessage("Data reset successfully!");
      setIsNotificationVisible(true);
      setTimeout(() => {
        setIsNotificationVisible(false);
        setTimeout(() => setSaveMessage(""), 300);
      }, 2500);
      setShowDataResetConfirm(false);
    } catch (error) {
      setSaveMessage("Error resetting data: " + error.message);
      setIsNotificationVisible(true);
      setTimeout(() => {
        setIsNotificationVisible(false);
        setTimeout(() => setSaveMessage(""), 300);
      }, 4500);
    }
  };

  const settingsSections = [
    {
      id: "general",
      label: "General",
      icon: Settings,
      description: "Currency, language, and basic preferences",
      color: "blue",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Personal information and account details",
      color: "green",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Password, privacy, and security settings",
      color: "red",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      description: "Theme, colors, and visual preferences",
      color: "purple",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Email and app notification preferences",
      color: "orange",
    },
    {
      id: "data",
      label: "Data Management",
      icon: Database,
      description: "Export, import, and data reset options",
      color: "indigo",
    },
    {
      id: "ai",
      label: "AI Services",
      icon: Sparkles,
      description: "AI provider selection and configuration",
      color: "emerald",
    },
  ];

  const getColorClasses = (color, isActive = false) => {
    const colorMap = {
      blue: isActive
        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
        : "text-blue-600 dark:text-blue-400",
      green: isActive
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
        : "text-green-600 dark:text-green-400",
      red: isActive
        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
        : "text-red-600 dark:text-red-400",
      purple: isActive
        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
        : "text-purple-600 dark:text-purple-400",
      orange: isActive
        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
        : "text-orange-600 dark:text-orange-400",
      indigo: isActive
        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
        : "text-indigo-600 dark:text-indigo-400",
      emerald: isActive
        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
        : "text-emerald-600 dark:text-emerald-400",
    };
    return colorMap[color] || colorMap.blue;
  };

  const renderMobileSettingsList = () => (
    <div className="space-y-1">
      {settingsSections.map(section => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
              }
              setActiveTab(section.id);
            }}
            onTouchEnd={e => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
              }
              setActiveTab(section.id);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 relative z-10 ${
              activeTab === section.id
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                activeTab === section.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            />
            <div className="flex-1">
              <div className="font-medium">{section.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {section.description}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        );
      })}
    </div>
  );

  const renderSectionContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-8 p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(null);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(null);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    General Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure your basic preferences and regional settings
                  </p>
                </div>
              </div>
            </div>

            {/* General Settings Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Basic Preferences
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency || "USD"}
                    onChange={e => updateSetting("currency", e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat || "MM/DD/YYYY"}
                    onChange={e => updateSetting("dateFormat", e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language || "en"}
                    onChange={e => updateSetting("language", e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                  </select>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-8 p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Profile Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your personal information and account details
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Account Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                      {user?.email || "Not available"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Created
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "Not available"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={
                        settings.firstName ||
                        user?.user_metadata?.full_name?.split(" ")[0] ||
                        ""
                      }
                      onChange={e => updateSetting("firstName", e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={
                        settings.lastName ||
                        user?.user_metadata?.full_name
                          ?.split(" ")
                          .slice(1)
                          .join(" ") ||
                        ""
                      }
                      onChange={e => updateSetting("lastName", e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8 p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Security Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your account security and privacy preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Account Security
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Auto Logout
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically log out after inactivity
                    </div>
                  </div>
                  <select
                    value={settings.autoLogout || 30}
                    onChange={e =>
                      updateSetting("autoLogout", parseInt(e.target.value))
                    }
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Require Password for Changes
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Ask for password when making important changes
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requirePasswordForChanges || true}
                      onChange={e =>
                        updateSetting(
                          "requirePasswordForChanges",
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Appearance Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customize the look and feel of your application
                  </p>
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-lg border-2 smooth-transition hover:scale-105 ${
                    currentTheme === "light"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      Light
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-lg border-2 smooth-transition hover:scale-105 ${
                    currentTheme === "dark"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Moon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      Dark
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-lg border-2 smooth-transition hover:scale-105 ${
                    currentTheme === "system"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Monitor className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      System
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Notification Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your notification preferences and view app updates
                  </p>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  App Updates
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  View the latest features and improvements for your device
                </p>
                <button
                  onClick={triggerUpdateNotification}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                >
                  <Bell className="w-4 h-4" />
                  View Latest Updates
                </button>
              </div>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-8 p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") {
                      e.stopImmediatePropagation();
                    }
                    setTimeout(() => {
                      setActiveTab("general");
                    }, 50);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Data Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export, import, and manage your data
                  </p>
                </div>
              </div>
            </div>

            {/* Data Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Your Data Summary
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {transactions.length}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Transactions
                    </div>
                  </div>
                  <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {accounts.length}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Accounts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export & Import */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-600" />
                  Data Export & Import
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Export Settings
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Download your settings as a backup file
                    </div>
                  </div>
                  <button
                    onClick={exportSettings}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Import Settings
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Restore settings from a backup file
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
              </div>
            </div>

            {/* Data Reset */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Data Reset
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Reset Settings
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Reset all settings to default values
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Reset All Data
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Delete all transactions and accounts
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDataResetConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-8 p-4">
            {/* Professional Mobile Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 -mx-4 -mt-4 mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(null);
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(null);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative z-10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Services
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose your AI provider for document analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Simple AI Provider Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  AI Provider
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Simple Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Use Hugging Face (500 Daily Requests)
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between Gemini API and Hugging Face
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.aiProvider === "huggingface"}
                      onChange={async e => {
                        const newProvider = e.target.checked
                          ? "huggingface"
                          : "gemini";

                        try {
                          // Validate with server before switching
                          await aiService.setProvider(newProvider);
                          updateSetting("aiProvider", newProvider);
                          // Reload usage stats after switching
                          loadServerUsageStats();
                        } catch (error) {
                          console.error("Failed to switch provider:", error);
                          // Show error message to user
                          setSaveMessage(
                            `Failed to switch provider: ${error.message}`
                          );
                          setIsNotificationVisible(true);
                          setTimeout(
                            () => setIsNotificationVisible(false),
                            3000
                          );
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Current Provider Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Current Provider:{" "}
                      {settings.aiProvider === "huggingface"
                        ? "Hugging Face"
                        : "Gemini API"}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Daily Limit:{" "}
                      {settings.aiProvider === "huggingface"
                        ? "500 requests"
                        : "150 requests"}
                    </div>

                    {/* Server-side usage stats */}
                    {isLoadingUsage ? (
                      <div className="mt-2 text-gray-500 dark:text-gray-400">
                        Loading usage data...
                      </div>
                    ) : serverUsageStats?.success ? (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Server-Validated Usage (Today)
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Gemini
                            </div>
                            <div className="font-medium">
                              {serverUsageStats.gemini?.current_usage || 0} /{" "}
                              {serverUsageStats.gemini?.max_requests || 150}
                            </div>
                            {serverUsageStats.gemini?.approaching_limit && (
                              <div className="text-amber-600 dark:text-amber-400 text-xs">
                                Approaching limit
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Hugging Face
                            </div>
                            <div className="font-medium">
                              {serverUsageStats.huggingface?.current_usage || 0}{" "}
                              /{" "}
                              {serverUsageStats.huggingface?.max_requests ||
                                500}
                            </div>
                            {serverUsageStats.huggingface
                              ?.approaching_limit && (
                              <div className="text-amber-600 dark:text-amber-400 text-xs">
                                Approaching limit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-gray-500 dark:text-gray-400 text-xs">
                        Usage data unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Settings List */}
        {!activeTab ? (
          <div className="p-4">{renderMobileSettingsList()}</div>
        ) : (
          /* Mobile Section Content */
          <div>{renderSectionContent()}</div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize your Aura Finance experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sticky top-8 animate-slide-in-left">
              <div className="space-y-1">
                {settingsSections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeTab === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                        isActive
                          ? getColorClasses(section.color, true)
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-all duration-200 ${
                          isActive
                            ? section.color === "blue"
                              ? "text-blue-600 dark:text-blue-400"
                              : section.color === "green"
                                ? "text-green-600 dark:text-green-400"
                                : section.color === "red"
                                  ? "text-red-600 dark:text-red-400"
                                  : section.color === "purple"
                                    ? "text-purple-600 dark:text-purple-400"
                                    : section.color === "orange"
                                      ? "text-orange-600 dark:text-orange-400"
                                      : section.color === "indigo"
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                        }`}
                      />
                      <span className="font-medium text-sm">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 animate-slide-in-right">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-green-500 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out max-w-md w-full mx-4 ${
            isNotificationVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-[-20px]"
          }`}
          style={{
            animation: isNotificationVisible
              ? "slide-down 0.3s ease-out"
              : "none",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white font-medium">
                {saveMessage}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Your changes have been applied
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Settings Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reset Settings
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to reset all settings to their default
              values? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSettings}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {showDataResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reset All Data
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete all your transactions and accounts.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDataResetConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDataReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
