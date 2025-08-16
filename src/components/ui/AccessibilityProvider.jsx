import React, { createContext, useContext, useEffect, useRef } from "react";

/**
 * Accessibility Context
 * Provides keyboard navigation, focus management, and screen reader support
 */
const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
};

/**
 * Accessibility Provider Component
 * Manages focus, keyboard navigation, and accessibility features
 */
export const AccessibilityProvider = ({ children }) => {

  const currentFocusIndexRef = useRef(0);
  const skipLinkRef = useRef(null);

  // Focus management
  const focusFirstElement = () => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      currentFocusIndexRef.current = 0;
    }
  };

  const focusLastElement = () => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      const lastIndex = focusableElements.length - 1;
      focusableElements[lastIndex].focus();
      currentFocusIndexRef.current = lastIndex;
    }
  };

  const focusNextElement = () => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      currentFocusIndexRef.current =
        (currentFocusIndexRef.current + 1) % focusableElements.length;
      focusableElements[currentFocusIndexRef.current].focus();
    }
  };

  const focusPreviousElement = () => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      currentFocusIndexRef.current =
        currentFocusIndexRef.current === 0
          ? focusableElements.length - 1
          : currentFocusIndexRef.current - 1;
      focusableElements[currentFocusIndexRef.current].focus();
    }
  };

  const getFocusableElements = () => {
    const selector = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="option"]',
    ].join(", ");

    return Array.from(document.querySelectorAll(selector)).filter(
      element =>
        element.offsetParent !== null && !element.hasAttribute("aria-hidden")
    );
  };

  // Keyboard navigation
  const handleKeyDown = event => {
    // Skip to main content
    if (event.key === "Tab" && event.shiftKey && event.altKey) {
      event.preventDefault();
      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.focus();
      }
    }

    // Escape key to close modals/dropdowns
    if (event.key === "Escape") {
      const activeModal = document.querySelector(
        '[role="dialog"][aria-modal="true"]'
      );
      if (activeModal) {
        const closeButton = activeModal.querySelector("[data-close-modal]");
        if (closeButton) {
          closeButton.click();
        }
      }
    }

    // Arrow key navigation in lists
    if (
      event.target.closest('[role="listbox"]') ||
      event.target.closest('[role="menu"]')
    ) {
      const list = event.target.closest('[role="listbox"], [role="menu"]');
      const items = Array.from(
        list.querySelectorAll('[role="option"], [role="menuitem"]')
      );
      const currentIndex = items.indexOf(event.target);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex].focus();
      }
    }
  };

  // Announce messages to screen readers
  const announce = (message, priority = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Skip link functionality
  const handleSkipLink = () => {
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.focus();
      announce("Skipped to main content");
    }
  };

  // Initialize accessibility features
  useEffect(() => {
    // Add keyboard event listener
    document.addEventListener("keydown", handleKeyDown);

    // Add skip link
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to main content";
    skipLink.className =
      "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded z-50";
    skipLink.onclick = handleSkipLink;
    document.body.insertBefore(skipLink, document.body.firstChild);
    skipLinkRef.current = skipLink;

    // Add main content ID
    const mainContent = document.querySelector("main");
    if (mainContent && !mainContent.id) {
      mainContent.id = "main-content";
    }

    // Announce page load
    announce("Page loaded");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (skipLinkRef.current) {
        document.body.removeChild(skipLinkRef.current);
      }
    };
  }, []);

  const contextValue = {
    focusFirstElement,
    focusLastElement,
    focusNextElement,
    focusPreviousElement,
    announce,
    getFocusableElements,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Focus Trap Component
 * Traps focus within a modal or dropdown
 */
export const FocusTrap = ({ children, onEscape }) => {
  const containerRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = Array.from(
      container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.offsetParent !== null);

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current =
        focusableElements[focusableElements.length - 1];

      // Focus first element
      firstFocusableRef.current.focus();

      const handleKeyDown = event => {
        if (event.key === "Tab") {
          if (event.shiftKey) {
            if (document.activeElement === firstFocusableRef.current) {
              event.preventDefault();
              lastFocusableRef.current.focus();
            }
          } else {
            if (document.activeElement === lastFocusableRef.current) {
              event.preventDefault();
              firstFocusableRef.current.focus();
            }
          }
        } else if (event.key === "Escape" && onEscape) {
          onEscape();
        }
      };

      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [onEscape]);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
};

/**
 * Screen Reader Only Component
 * Hides content visually but keeps it accessible to screen readers
 */
export const ScreenReaderOnly = ({ children, className = "" }) => (
  <span className={`sr-only ${className}`}>{children}</span>
);

/**
 * Visually Hidden Component
 * Alternative to sr-only with more control
 */
export const VisuallyHidden = ({ children, className = "" }) => (
  <span
    className={`absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 ${className}`}
    style={{ clip: "rect(0, 0, 0, 0)" }}
  >
    {children}
  </span>
);

export default AccessibilityProvider;
