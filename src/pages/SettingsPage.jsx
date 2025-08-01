import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import useStore from "../store";

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
  } = useStore();

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDataResetConfirm, setShowDataResetConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Load user data on mount
  useEffect(() => {
    loadTransactions();
    loadAccounts();
  }, [loadTransactions, loadAccounts]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("Settings saved successfully!");

    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }, 1000);
  };

  const handleImportSettings = async event => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importSettings(file);
        setSaveMessage("Settings imported successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } catch (error) {
        setSaveMessage("Error importing settings: " + error.message);
        setTimeout(() => setSaveMessage(""), 5000);
      }
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    setSaveMessage("Settings reset to default!");
    setTimeout(() => setSaveMessage(""), 3000);
    setShowResetConfirm(false);
  };

  const handleDataReset = async () => {
    try {
      // Clear transactions and accounts from store
      await resetUserData();
      setSaveMessage("Data reset successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
      setShowDataResetConfirm(false);
    } catch (error) {
      setSaveMessage("Error resetting data: " + error.message);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const settingsSections = [
    {
      id: "general",
      label: "General",
      icon: Settings,
      description: "Currency, language, and basic preferences",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Personal information and account details",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Password, privacy, and security settings",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      description: "Theme, colors, and visual preferences",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Email and app notification preferences",
    },
    {
      id: "data",
      label: "Data Management",
      icon: Database,
      description: "Export, import, and data reset options",
    },
  ];

  const renderMobileSettingsList = () => (
    <div className="space-y-1">
      {settingsSections.map(section => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg text-left transition-all duration-200 ${
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                General Settings
              </h2>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {/* Currency Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Currency & Formatting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency || "USD"}
                    onChange={e => updateSetting("currency", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat || "MM/DD/YYYY"}
                    onChange={e => updateSetting("dateFormat", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Language & Region
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.language || "en"}
                  onChange={e => updateSetting("language", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Profile Settings
            </h2>

            {/* User Information Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Account Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                    {user?.email || "Not available"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Created
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "Not available"}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security Settings
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Account Security
              </h3>
              <div className="space-y-4">
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
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Appearance Settings
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Theme
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentTheme === "light"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Light
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Clean and bright
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentTheme === "dark"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Moon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Dark
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Easy on the eyes
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentTheme === "system"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Monitor className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      System
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Follows your OS
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notification Settings
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications via email
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications || false}
                      onChange={e =>
                        updateSetting("emailNotifications", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Budget Alerts
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when you exceed budget limits
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.budgetAlerts || true}
                      onChange={e =>
                        updateSetting("budgetAlerts", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Data Management
            </h2>

            {/* Data Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Your Data Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {transactions.length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Transactions
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {accounts.length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Accounts
                  </div>
                </div>
              </div>
            </div>

            {/* Export & Import */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Data Export & Import
              </h3>
              <div className="space-y-4">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Data Reset
              </h3>
              <div className="space-y-4">
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("general")}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200">{saveMessage}</p>
          </div>
        </div>
      )}

      <div className="lg:hidden">
        {/* Mobile Settings List */}
        {activeTab === "general" ? (
          <div className="p-4">{renderMobileSettingsList()}</div>
        ) : (
          /* Mobile Section Content */
          <div className="p-4">{renderSectionContent()}</div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-2">
                {settingsSections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeTab === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">{renderSectionContent()}</div>
        </div>
      </div>

      {/* Reset Settings Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
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
