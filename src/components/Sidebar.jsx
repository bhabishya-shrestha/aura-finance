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
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = ({
  onPageChange,
  currentPage,
  isMobileOpen,
  onMobileToggle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      description: "Overview of your finances",
    },
    {
      id: "accounts",
      icon: Wallet,
      label: "Accounts",
      description: "Manage your accounts",
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      description: "Financial insights",
    },
    {
      id: "transactions",
      icon: FileText,
      label: "Transactions",
      description: "View all transactions",
    },
    {
      id: "reports",
      icon: TrendingUp,
      label: "Reports",
      description: "Generate reports",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      description: "App preferences",
    },
  ];

  const handleMenuClick = (pageId) => {
    onPageChange(pageId);
    // Close mobile sidebar after navigation
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-apple-dark-500/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`nav-glass h-screen transition-all duration-300 ease-in-out fixed lg:relative z-50 ${
          isCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-purple rounded-apple-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gradient">Aura</h2>
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className="p-2 hover:bg-apple-glass-200/60 rounded-apple-lg transition-all duration-200 group"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-muted-gray group-hover:text-soft-white transition-colors" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-gray group-hover:text-soft-white transition-colors" />
              )}
            </button>
          </div>

          {/* User Info */}
          {user && !isCollapsed && (
            <div className="mb-6 p-3 apple-glass-light rounded-apple-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-purple rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-soft-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-gray truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-apple-lg transition-all duration-200 group relative ${
                  currentPage === item.id ? "nav-item active" : "nav-item"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : item.description}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform ${
                    isCollapsed ? "" : "group-hover:scale-110"
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}

                {/* Active indicator */}
                {currentPage === item.id && (
                  <div className="absolute right-2 w-2 h-2 bg-apple-blue rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div
            className={`mt-auto pt-4 border-t border-apple-glass-300/30 ${isCollapsed ? "text-center" : ""}`}
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
    </>
  );
};

export default Sidebar;
