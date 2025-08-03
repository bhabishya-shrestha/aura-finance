import React from "react";
import {
  X,
  User,
  Home,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Plus,
  Upload,
} from "lucide-react";
import useStore from "../store";

const MobileSidebar = ({ isOpen, onClose, onPageChange, currentPage }) => {
  const { user, signOut } = useStore();

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      description: "Overview of your finances",
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: CreditCard,
      description: "Manage your accounts",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Financial insights & reports",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: FileText,
      description: "View & manage transactions",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "App preferences & account",
    },
  ];

  const quickActions = [
    {
      id: "add-transaction",
      label: "Add Transaction",
      icon: Plus,
      description: "Record a new transaction",
      action: () => {
        // TODO: Implement add transaction
        onClose();
      },
    },
    {
      id: "import-statement",
      label: "Import Statement",
      icon: Upload,
      description: "Upload bank statement",
      action: () => {
        // TODO: Implement import statement
        onClose();
      },
    },
  ];

  const handleNavigationClick = (pageId) => {
    onPageChange(pageId);
    onClose();
  };

  const handleQuickAction = (action) => {
    action();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Aura Finance
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personal Finance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* User Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email ? "Signed in" : "Guest"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.action)}
                  className="w-full flex items-center gap-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <action.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigationClick(item.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors active:scale-95 ${
                    currentPage === item.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentPage === item.id
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${
                        currentPage === item.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        currentPage === item.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>
                  {currentPage === item.id && (
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
            >
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
