import { createContext, useContext } from "react";

/**
 * Accessibility Context
 * Provides keyboard navigation, focus management, and screen reader support
 */
export const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
};
