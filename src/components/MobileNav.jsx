import React from "react";
import {
  Home,
  Wallet,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MobileNav = ({ onPageChange, currentPage }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
    },
    {
      id: "accounts",
      icon: Wallet,
      label: "Accounts",
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
    },
    {
      id: "transactions",
      icon: FileText,
      label: "Transactions",
    },
    {
      id: "reports",
      icon: TrendingUp,
      label: "Reports",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  const handleMenuClick = (pageId) => {
    onPageChange(pageId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 iphone15pro:block hidden">
      <div className="flex items-center justify-between px-2 py-2">
        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-medium text-white">
                {(
                  user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 flex justify-around">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                currentPage === item.id
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>

              {/* Active indicator */}
              {currentPage === item.id && (
                <div className="w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
