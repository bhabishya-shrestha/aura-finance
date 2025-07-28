import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem("aura-theme");
    if (savedTheme && savedTheme !== "auto") {
      return savedTheme;
    }

    // If saved theme is "auto" or not set, check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add current theme class
    root.classList.add(theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#1C1B1F" : "#FFFFFF"
      );
    }

    // Save to localStorage
    localStorage.setItem("aura-theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = e => {
      const newSystemTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);

      // If theme is set to 'auto', update the actual theme
      const savedTheme = localStorage.getItem("aura-theme");
      if (savedTheme === "auto") {
        setTheme(newSystemTheme);
      }
    };

    // Set up event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const setThemeMode = mode => {
    if (mode === "auto") {
      // Set to auto and use current system theme
      localStorage.setItem("aura-theme", "auto");
      setTheme(systemTheme);
    } else {
      setTheme(mode);
    }
  };

  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem("aura-theme");
    if (savedTheme === "auto") {
      return systemTheme;
    }
    return theme;
  };

  const getThemeMode = () => {
    return localStorage.getItem("aura-theme") || "auto";
  };

  const value = {
    theme,
    systemTheme,
    currentTheme: getCurrentTheme(),
    themeMode: getThemeMode(),
    toggleTheme,
    setTheme: setThemeMode,
    isDark: getCurrentTheme() === "dark",
    isLight: getCurrentTheme() === "light",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
