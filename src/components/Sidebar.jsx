import React, { useState } from "react";
import { Menu, X, BarChart3, Wallet, PieChart, Settings } from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: Wallet, label: "Accounts" },
    { icon: PieChart, label: "Analytics" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className={`glass-card h-screen transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <h2 className="text-xl font-bold gradient-text">Aura</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? "bg-gradient-to-r from-teal to-purple text-white"
                  : "text-muted-gray hover:text-soft-white hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
