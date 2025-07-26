import React, { useState } from "react";
import {
  Settings,
  User,
  Shield,
  Database,
  Palette,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  Globe,
} from "lucide-react";
import useStore from "../store";

const SettingsPage = () => {
  const { transactions, accounts } = useStore();
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const exportData = () => {
    const data = {
      transactions,
      accounts,
      exportDate: new Date().toISOString(),
      version: "0.1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-finance-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      // TODO: Implement data clearing
      // Log for development purposes only
      if (import.meta.env.DEV) {
        console.log("Clearing all data...");
      }
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data Management", icon: Database },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-gray mt-1">
          Manage your preferences and account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-teal to-purple text-white shadow-lg"
                      : "text-muted-gray hover:text-soft-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-soft-white mb-4">
                  General Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Default Currency
                    </label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Date Format
                    </label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Language
                    </label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-soft-white mb-4">
                  Profile Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal">
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC+0">UTC</option>
                      <option value="UTC+1">
                        Central European Time (UTC+1)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-soft-white mb-4">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal pr-10"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-gray hover:text-soft-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-soft-white mb-4">
                  Data Management
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Database className="w-5 h-5 text-teal" />
                        <span className="font-medium text-soft-white">
                          Data Statistics
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-gray">
                        <div>Transactions: {transactions.length}</div>
                        <div>Accounts: {accounts.length}</div>
                        <div>
                          Total Net Worth:{" "}
                          {formatCurrency(
                            transactions.reduce((sum, t) => sum + t.amount, 0)
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-soft-white">
                          Storage
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-gray">
                        <div>Local Storage: IndexedDB</div>
                        <div>Data Privacy: 100% Local</div>
                        <div>Backup: Manual Export</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={exportData}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal to-purple hover:from-teal/90 hover:to-purple/90 transition-all rounded-lg text-white font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white font-medium">
                      <Upload className="w-4 h-4" />
                      Import Data
                    </button>

                    <button
                      onClick={clearAllData}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 transition-colors rounded-lg text-red-400 font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-soft-white mb-4">
                  Appearance Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Theme
                    </label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal">
                      <option value="dark">Dark Theme</option>
                      <option value="light">Light Theme</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Glassmorphism Intensity
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="50"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-gray mb-2">
                      Animation Speed
                    </label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal">
                      <option value="fast">Fast</option>
                      <option value="normal">Normal</option>
                      <option value="slow">Slow</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-soft-white mb-4">
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="font-medium text-soft-white">
                        Email Notifications
                      </div>
                      <div className="text-sm text-muted-gray">
                        Receive updates via email
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-teal bg-white/10 border-white/20 rounded focus:ring-teal"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="font-medium text-soft-white">
                        Weekly Reports
                      </div>
                      <div className="text-sm text-muted-gray">
                        Get weekly spending summaries
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-teal bg-white/10 border-white/20 rounded focus:ring-teal"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="font-medium text-soft-white">
                        Budget Alerts
                      </div>
                      <div className="text-sm text-muted-gray">
                        Get notified when approaching budget limits
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-teal bg-white/10 border-white/20 rounded focus:ring-teal"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
