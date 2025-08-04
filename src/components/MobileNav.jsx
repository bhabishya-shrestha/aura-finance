import React, { useState } from "react";
import { Plus, Upload } from "lucide-react";
import AddTransaction from "./AddTransaction";

const MobileNav = ({ onImportClick }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const quickActionItems = [
    {
      label: "Add Transaction",
      icon: Plus,
      action: () => {
        setShowAddTransaction(true);
        setShowQuickActions(false);
      },
    },
    {
      label: "Import Statement",
      icon: Upload,
      action: () => {
        onImportClick();
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
        <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 lg:hidden">
          <div className="p-4">
            {quickActionItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(item.action)}
                className="w-full flex items-center gap-4 px-4 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
              >
                <item.icon className="w-6 h-6" />
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
          className="w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Add Transaction Modal */}
      <AddTransaction
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        isMobile={true}
      />
    </>
  );
};

export default MobileNav;
