import React from "react";
import { Sparkles, Bell, Search, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Header = ({ onMenuToggle, showMenuButton = false }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="apple-glass-heavy sticky top-0 z-40 border-b border-apple-glass-300/30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-apple-lg hover:bg-apple-glass-200/60 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-soft-white" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-apple-purple rounded-apple-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">Aura Finance</h1>
              <p className="text-xs text-muted-gray">
                Personal Finance Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Search (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-gray" />
            <input
              type="text"
              placeholder="Search transactions, accounts..."
              className="input-glass w-full pl-10 pr-4 text-sm"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            className="p-2 rounded-apple-lg hover:bg-apple-glass-200/60 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-gray" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-apple-red rounded-full"></span>
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-soft-white">
                  {user.name}
                </p>
                <p className="text-xs text-muted-gray">{user.email}</p>
              </div>
              <div className="relative group">
                <button
                  className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-purple rounded-full flex items-center justify-center text-white text-sm font-medium hover:scale-105 transition-transform"
                  aria-label="User menu"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 apple-glass rounded-apple-lg shadow-apple-elevation-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-muted-gray hover:text-soft-white hover:bg-apple-glass-200/60 rounded-apple transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
