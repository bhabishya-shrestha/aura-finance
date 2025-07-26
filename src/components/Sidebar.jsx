import React, { useState } from "react";
import {
  Menu,
  X,
  BarChart3,
  Wallet,
  PieChart,
  Settings,
  Home,
  TrendingUp,
  FileText,
} from "lucide-react";

const Sidebar = ({ onPageChange, currentPage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "accounts", icon: Wallet, label: "Accounts" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "transactions", icon: FileText, label: "Transactions" },
    { id: "reports", icon: TrendingUp, label: "Reports" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleMenuClick = (pageId) => {
    onPageChange(pageId);
  };

  return (
    <div
      className={`glass-card h-screen transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <h2 className="text-xl font-bold gradient-text">Aura</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 hover:bg-white/10 rounded-lg transition-all duration-200 ${
              isCollapsed ? "mx-auto" : ""
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                currentPage === item.id
                  ? "bg-gradient-to-r from-teal to-purple text-white shadow-lg"
                  : "text-muted-gray hover:text-soft-white hover:bg-white/10"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon
                className={`w-5 h-5 transition-transform ${
                  isCollapsed ? "" : "group-hover:scale-110"
                }`}
              />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={`mt-auto pt-4 border-t border-white/10 ${isCollapsed ? "text-center" : ""}`}
        >
          {!isCollapsed && (
            <div className="text-xs text-muted-gray mb-2">Version 0.1.0</div>
          )}
          <div
            className={`text-xs text-muted-gray ${isCollapsed ? "text-center" : ""}`}
          >
            {isCollapsed ? "Aura" : "Aura Finance"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
