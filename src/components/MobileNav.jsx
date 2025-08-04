import React, { useState } from "react";
import { Plus, Upload } from "lucide-react";

const MobileNav = () => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickActionItems = [
    {
      label: "Add Transaction",
      icon: Plus,
      action: () => {
        // TODO: Implement add transaction functionality
        setShowQuickActions(false);
      },
    },
    {
      label: "Import Statement",
      icon: Upload,
      action: () => {
        // TODO: Implement import statement functionality
        setShowQuickActions(false);
      },
    },
  ];

  const handleQuickAction = action => {
    action();
  };

  const toggleQuickActions = () => {
    setShowQuickActions(!showQuickActions);
  };

  return (
    <>
      {/* Backdrop for dropdowns */}
      {showQuickActions && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            setShowQuickActions(false);
          }}
        />
      )}

      {/* Quick Actions Dropdown */}
      {showQuickActions && (
        <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 lg:hidden">
          <div className="p-2">
            {quickActionItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(item.action)}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button - Quick Actions */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button
          onClick={toggleQuickActions}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
            showQuickActions
              ? "bg-blue-600 text-white scale-110"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default MobileNav;
