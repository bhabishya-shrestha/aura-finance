import { useEffect, useState, useCallback } from "react";

/**
 * Custom hook to handle mobile viewport height calculations
 * Fixes issues with dynamic viewport height changes on mobile browsers
 */
export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Update viewport height
  const updateViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    setViewportHeight(vh);

    // Update CSS custom property
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    // Check if we're on mobile
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
  }, []);

  // Debounced resize handler
  const debouncedResize = useCallback(() => {
    let timeoutId;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewportHeight, 100);
    };
  }, [updateViewportHeight]);

  useEffect(() => {
    // Initial setup
    updateViewportHeight();

    // Handle resize events
    const handleResize = debouncedResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", updateViewportHeight);

    // Handle visual viewport changes (mobile browser UI)
    if (window.visualViewport) {
      const handleVisualViewportChange = () => {
        // Use visual viewport height for more accurate mobile calculations
        const vh = window.visualViewport.height * 0.01;
        setViewportHeight(vh);
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      };

      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportChange
      );
      window.visualViewport.addEventListener(
        "scroll",
        handleVisualViewportChange
      );

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", updateViewportHeight);
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportChange
        );
        window.visualViewport.removeEventListener(
          "scroll",
          handleVisualViewportChange
        );
      };
    }

    // Fallback for browsers without visual viewport API
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, [updateViewportHeight, debouncedResize]);

  // Force update on focus (handles mobile browser UI changes)
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(updateViewportHeight, 100);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [updateViewportHeight]);

  return {
    viewportHeight,
    isMobile,
    updateViewportHeight,
  };
};

/**
 * Hook to handle mobile scroll container setup
 */
export const useMobileScroll = containerRef => {
  const { isMobile } = useMobileViewport();

  useEffect(() => {
    if (!isMobile || !containerRef?.current) return;

    const container = containerRef.current;

    // Add mobile scroll class
    container.classList.add("mobile-content");

    // Ensure proper scroll behavior
    container.style.webkitOverflowScrolling = "touch";
    container.style.scrollBehavior = "smooth";

    return () => {
      container.classList.remove("mobile-content");
    };
  }, [isMobile, containerRef]);

  return { isMobile };
};
