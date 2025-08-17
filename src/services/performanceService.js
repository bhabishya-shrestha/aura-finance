/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals and other performance metrics for enterprise-grade monitoring
 */

// Web Vitals tracking
let webVitalsInitialized = false;

/**
 * Initialize performance monitoring
 */
export const initializePerformanceMonitoring = async () => {
  if (webVitalsInitialized) return;

  try {
    // Import web-vitals using a more reliable method
    const webVitals = await import("web-vitals");
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;

    // Verify that all functions are available
    if (!getCLS || !getFID || !getFCP || !getLCP || !getTTFB) {
      throw new Error("Web Vitals functions not available");
    }

    // Send metrics to analytics
    const sendToAnalytics = metric => {
      const { name, value, id } = metric;

      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`📊 Web Vital: ${name} = ${value}`, { id });
      }

      // Send to analytics service (replace with your analytics provider)
      if (window.gtag) {
        window.gtag("event", "web_vital", {
          event_category: "Web Vitals",
          event_label: name,
          value: Math.round(name === "CLS" ? value * 1000 : value),
          non_interaction: true,
        });
      }

      // Store locally for debugging
      storePerformanceMetric(name, value);
    };

    // Initialize all web vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);

    webVitalsInitialized = true;
    console.log("✅ Performance monitoring initialized");
  } catch (error) {
    console.warn("⚠️ Failed to initialize performance monitoring:", error);
    // Fallback: try to initialize without web-vitals
    webVitalsInitialized = true;
  }
};

/**
 * Store performance metric locally
 */
const storePerformanceMetric = (name, value) => {
  try {
    const metrics = JSON.parse(
      localStorage.getItem("aura_performance_metrics") || "{}"
    );
    metrics[name] = {
      value,
      timestamp: Date.now(),
    };
    localStorage.setItem("aura_performance_metrics", JSON.stringify(metrics));
  } catch (error) {
    console.warn("Failed to store performance metric:", error);
  }
};

/**
 * Get stored performance metrics
 */
export const getPerformanceMetrics = () => {
  try {
    return JSON.parse(localStorage.getItem("aura_performance_metrics") || "{}");
  } catch (error) {
    return {};
  }
};

/**
 * Performance monitoring class
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the performance monitor
   */
  async initialize() {
    if (this.isInitialized) return;

    await initializePerformanceMonitoring();
    this.setupPerformanceObservers();
    this.isInitialized = true;
  }

  /**
   * Setup performance observers
   */
  setupPerformanceObservers() {
    // Monitor long tasks
    if ("PerformanceObserver" in window) {
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              this.recordMetric("long_task", {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch (error) {
        console.warn("Long task observer not supported:", error);
      }

      // Monitor navigation timing
      try {
        const navigationObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordMetric("navigation", {
              type: entry.type,
              duration: entry.duration,
              domContentLoaded:
                entry.domContentLoadedEventEnd -
                entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
            });
          }
        });
        navigationObserver.observe({ entryTypes: ["navigation"] });
      } catch (error) {
        console.warn("Navigation observer not supported:", error);
      }
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
    };

    this.metrics.set(name, metric);

    // Notify observers
    if (this.observers.has(name)) {
      this.observers.get(name).forEach(callback => callback(metric));
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`📊 Performance Metric: ${name}`, value);
    }
  }

  /**
   * Get a specific metric
   */
  getMetric(name) {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Subscribe to metric changes
   */
  subscribe(name, callback) {
    if (!this.observers.has(name)) {
      this.observers.set(name, new Set());
    }
    this.observers.get(name).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.observers.get(name);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.observers.delete(name);
        }
      }
    };
  }

  /**
   * Measure function execution time
   */
  async measureFunction(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(`function_${name}`, { duration, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`function_${name}`, {
        duration,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Measure component render time
   */
  measureComponent(name, componentFn) {
    return (...args) => {
      const start = performance.now();
      const result = componentFn(...args);
      const duration = performance.now() - start;
      this.recordMetric(`component_${name}`, { duration });
      return result;
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const metrics = this.getAllMetrics();
    const webVitals = getPerformanceMetrics();

    return {
      timestamp: Date.now(),
      metrics,
      webVitals,
      summary: this.generateSummary(metrics, webVitals),
    };
  }

  /**
   * Generate performance summary
   */
  generateSummary(metrics, webVitals) {
    const summary = {
      overall: "good",
      issues: [],
      recommendations: [],
    };

    // Check Web Vitals
    if (webVitals.LCP && webVitals.LCP.value > 2500) {
      summary.overall = "poor";
      summary.issues.push("LCP is too slow (>2.5s)");
      summary.recommendations.push(
        "Optimize image loading and server response time"
      );
    }

    if (webVitals.FID && webVitals.FID.value > 100) {
      summary.overall = "needs-improvement";
      summary.issues.push("FID is too high (>100ms)");
      summary.recommendations.push("Reduce JavaScript execution time");
    }

    if (webVitals.CLS && webVitals.CLS.value > 0.1) {
      summary.overall = "needs-improvement";
      summary.issues.push("CLS is too high (>0.1)");
      summary.recommendations.push(
        "Fix layout shifts and use proper image dimensions"
      );
    }

    // Check function performance
    const slowFunctions = Object.entries(metrics)
      .filter(
        ([name, metric]) =>
          name.startsWith("function_") && metric.value.duration > 100
      )
      .map(([name, metric]) => ({ name, duration: metric.value.duration }));

    if (slowFunctions.length > 0) {
      summary.issues.push(`${slowFunctions.length} slow functions detected`);
      summary.recommendations.push(
        "Optimize slow functions or move to background threads"
      );
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    localStorage.removeItem("aura_performance_metrics");
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize when imported
if (typeof window !== "undefined") {
  performanceMonitor.initialize();
}

export default performanceMonitor;
