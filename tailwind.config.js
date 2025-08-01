/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    screens: {
      // iPhone 15 Pro specific breakpoints
      iphone15pro: "393px", // iPhone 15 Pro width
      "iphone15pro-max": "430px", // iPhone 15 Pro Max width
      "iphone-se": "375px", // iPhone SE width
      iphone: "390px", // General iPhone width
      ipad: "768px", // iPad width
      "ipad-pro": "1024px", // iPad Pro width

      // Standard breakpoints
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      spacing: {
        // Safe area spacing for mobile browsers
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      padding: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      margin: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      colors: {
        // Enhanced Material Design 3 Color System with Proper Contrast
        // Light Mode Colors
        light: {
          background: "#FFFFFF",
          surface: "#F8F9FA",
          "surface-variant": "#F1F3F4",
          primary: "#1A73E8",
          "primary-container": "#E8F0FE",
          secondary: "#9C27B0",
          "secondary-container": "#F3E5F5",
          tertiary: "#FF6B35",
          "tertiary-container": "#FFE8E0",
          error: "#D93025",
          "error-container": "#FCE8E6",
          success: "#137333",
          "success-container": "#E6F4EA",
          warning: "#EA8600",
          "warning-container": "#FEF7E0",
          info: "#1A73E8",
          "info-container": "#E8F0FE",
          "on-background": "#1C1B1F", // Dark gray for excellent contrast
          "on-surface": "#1C1B1F",
          "on-surface-variant": "#49454F",
          "on-primary": "#FFFFFF",
          "on-primary-container": "#1A73E8",
          "on-secondary": "#FFFFFF",
          "on-secondary-container": "#9C27B0",
          "on-tertiary": "#FFFFFF",
          "on-tertiary-container": "#FF6B35",
          "on-error": "#FFFFFF",
          "on-error-container": "#D93025",
          "on-success": "#FFFFFF",
          "on-success-container": "#137333",
          "on-warning": "#FFFFFF",
          "on-warning-container": "#EA8600",
          "on-info": "#FFFFFF",
          "on-info-container": "#1A73E8",
          outline: "#79747E",
          "outline-variant": "#CAC4D0",
          shadow: "#000000",
          scrim: "#000000",
          "inverse-surface": "#313033",
          "inverse-on-surface": "#F4EFF4",
          "inverse-primary": "#B4C5FF",
          "surface-dim": "#DED8E1",
          "surface-bright": "#FEF7FF",
          "surface-container-lowest": "#FFFFFF",
          "surface-container-low": "#F7F2FA",
          "surface-container": "#F3EDF7",
          "surface-container-high": "#ECE6F0",
          "surface-container-highest": "#E6E0E9",
        },

        // Dark Mode Colors
        dark: {
          background: "#1C1B1F",
          surface: "#141218",
          "surface-variant": "#49454F",
          primary: "#B4C5FF",
          "primary-container": "#1A73E8",
          secondary: "#CE93D8",
          "secondary-container": "#9C27B0",
          tertiary: "#FFB59D",
          "tertiary-container": "#FF6B35",
          error: "#F2B8B5",
          "error-container": "#D93025",
          success: "#81C784",
          "success-container": "#137333",
          warning: "#FFB74D",
          "warning-container": "#EA8600",
          info: "#90CAF9",
          "info-container": "#1A73E8",
          "on-background": "#E6E1E5", // Light gray for excellent contrast
          "on-surface": "#E6E1E5",
          "on-surface-variant": "#CAC4D0",
          "on-primary": "#1A73E8",
          "on-primary-container": "#B4C5FF",
          "on-secondary": "#9C27B0",
          "on-secondary-container": "#CE93D8",
          "on-tertiary": "#FF6B35",
          "on-tertiary-container": "#FFB59D",
          "on-error": "#D93025",
          "on-error-container": "#F2B8B5",
          "on-success": "#137333",
          "on-success-container": "#81C784",
          "on-warning": "#EA8600",
          "on-warning-container": "#FFB74D",
          "on-info": "#1A73E8",
          "on-info-container": "#90CAF9",
          outline: "#938F99",
          "outline-variant": "#49454F",
          shadow: "#000000",
          scrim: "#000000",
          "inverse-surface": "#E6E1E5",
          "inverse-on-surface": "#313033",
          "inverse-primary": "#1A73E8",
          "surface-dim": "#141218",
          "surface-bright": "#3B383E",
          "surface-container-lowest": "#0F0D13",
          "surface-container-low": "#1A1A1E",
          "surface-container": "#1F1B23",
          "surface-container-high": "#2B2930",
          "surface-container-highest": "#36343B",
        },

        // Apple-inspired colors with proper contrast
        apple: {
          blue: "#007AFF",
          purple: "#AF52DE",
          green: "#34C759",
          orange: "#FF9500",
          red: "#FF3B30",
          pink: "#FF2D92",
          yellow: "#FFCC02",
          indigo: "#5856D6",
          teal: "#5AC8FA",
          brown: "#A2845E",
          mint: "#00C7BE",
          cyan: "#32ADE6",
        },

        // Apple Glass morphism colors for CSS classes
        "apple-glass": {
          50: "rgba(255, 255, 255, 0.05)",
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.2)",
          300: "rgba(255, 255, 255, 0.3)",
          400: "rgba(255, 255, 255, 0.4)",
          500: "rgba(255, 255, 255, 0.5)",
          600: "rgba(255, 255, 255, 0.6)",
          700: "rgba(255, 255, 255, 0.7)",
          800: "rgba(255, 255, 255, 0.8)",
          900: "rgba(255, 255, 255, 0.9)",
        },

        // Apple Dark colors for CSS classes
        "apple-dark": {
          50: "rgba(0, 0, 0, 0.05)",
          100: "rgba(0, 0, 0, 0.1)",
          200: "rgba(0, 0, 0, 0.2)",
          300: "rgba(0, 0, 0, 0.3)",
          400: "rgba(0, 0, 0, 0.4)",
          500: "rgba(0, 0, 0, 0.5)",
          600: "rgba(0, 0, 0, 0.6)",
          700: "rgba(0, 0, 0, 0.7)",
          800: "rgba(0, 0, 0, 0.8)",
          900: "rgba(0, 0, 0, 0.9)",
        },

        // Glass morphism colors for both modes
        glass: {
          light: {
            50: "rgba(255, 255, 255, 0.05)",
            100: "rgba(255, 255, 255, 0.1)",
            200: "rgba(255, 255, 255, 0.2)",
            300: "rgba(255, 255, 255, 0.3)",
            400: "rgba(255, 255, 255, 0.4)",
            500: "rgba(255, 255, 255, 0.5)",
            600: "rgba(255, 255, 255, 0.6)",
            700: "rgba(255, 255, 255, 0.7)",
            800: "rgba(255, 255, 255, 0.8)",
            900: "rgba(255, 255, 255, 0.9)",
          },
          dark: {
            50: "rgba(0, 0, 0, 0.05)",
            100: "rgba(0, 0, 0, 0.1)",
            200: "rgba(0, 0, 0, 0.2)",
            300: "rgba(0, 0, 0, 0.3)",
            400: "rgba(0, 0, 0, 0.4)",
            500: "rgba(0, 0, 0, 0.5)",
            600: "rgba(0, 0, 0, 0.6)",
            700: "rgba(0, 0, 0, 0.7)",
            800: "rgba(0, 0, 0, 0.8)",
            900: "rgba(0, 0, 0, 0.9)",
          },
        },

        // Semantic colors that adapt to mode
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-variant": "var(--color-surface-variant)",
        "on-background": "var(--color-on-background)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",

        // Primary color scale for numbered variants
        "primary-50": "#E3F2FD",
        "primary-100": "#BBDEFB",
        "primary-200": "#90CAF9",
        "primary-300": "#64B5F6",
        "primary-400": "#42A5F5",
        "primary-500": "#2196F3",
        "primary-600": "#1A73E8",
        "primary-700": "#1976D2",
        "primary-800": "#1565C0",
        "primary-900": "#0D47A1",

        // Secondary color scale for numbered variants
        "secondary-50": "#F3E5F5",
        "secondary-100": "#E1BEE7",
        "secondary-200": "#CE93D8",
        "secondary-300": "#BA68C8",
        "secondary-400": "#AB47BC",
        "secondary-500": "#9C27B0",
        "secondary-600": "#8E24AA",
        "secondary-700": "#7B1FA2",
        "secondary-800": "#6A1B9A",
        "secondary-900": "#4A148C",

        // Error color scale for numbered variants
        "error-50": "#FFEBEE",
        "error-100": "#FFCDD2",
        "error-200": "#EF9A9A",
        "error-300": "#E57373",
        "error-400": "#EF5350",
        "error-500": "#F44336",
        "error-600": "#E53935",
        "error-700": "#D32F2F",
        "error-800": "#C62828",
        "error-900": "#B71C1C",
      },

      fontFamily: {
        sans: ["SF Pro Display", "Inter", "Roboto", "system-ui", "sans-serif"],
        display: ["SF Pro Display", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "Roboto", "system-ui", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "monospace"],
      },

      fontSize: {
        // Material Design 3 Type Scale
        "display-large": [
          "57px",
          { lineHeight: "64px", letterSpacing: "-0.25px" },
        ],
        "display-medium": [
          "45px",
          { lineHeight: "52px", letterSpacing: "0px" },
        ],
        "display-small": ["36px", { lineHeight: "44px", letterSpacing: "0px" }],
        "headline-large": [
          "32px",
          { lineHeight: "40px", letterSpacing: "0px" },
        ],
        "headline-medium": [
          "28px",
          { lineHeight: "36px", letterSpacing: "0px" },
        ],
        "headline-small": [
          "24px",
          { lineHeight: "32px", letterSpacing: "0px" },
        ],
        "title-large": ["22px", { lineHeight: "28px", letterSpacing: "0px" }],
        "title-medium": [
          "16px",
          { lineHeight: "24px", letterSpacing: "0.15px", fontWeight: "500" },
        ],
        "title-small": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "500" },
        ],
        "body-large": ["16px", { lineHeight: "24px", letterSpacing: "0.5px" }],
        "body-medium": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.25px" },
        ],
        "body-small": ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
        "label-large": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "500" },
        ],
        "label-medium": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" },
        ],
        "label-small": [
          "11px",
          { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" },
        ],
      },

      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },

      boxShadow: {
        // Material Design 3 Elevation with proper contrast
        "elevation-1":
          "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
        "elevation-2":
          "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
        "elevation-3":
          "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)",
        "elevation-4":
          "0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 4px 0px rgba(0, 0, 0, 0.3)",
        "elevation-5":
          "0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 6px 0px rgba(0, 0, 0, 0.3)",

        // Glass morphism shadows
        "glass-light": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",

        // Apple-specific shadows
        "apple-glass": "0 8px 32px 0 rgba(255, 255, 255, 0.1)",
        "apple-glass-heavy": "0 12px 40px 0 rgba(255, 255, 255, 0.15)",
        "apple-elevation-1":
          "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
        "apple-elevation-2":
          "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
        "apple-elevation-3":
          "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)",
        "apple-elevation-4":
          "0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 4px 0px rgba(0, 0, 0, 0.3)",
      },

      borderRadius: {
        // Material Design 3 Shape
        none: "0px",
        small: "4px",
        medium: "8px",
        large: "12px",
        "extra-large": "16px",
        full: "9999px",

        // Apple-inspired radii
        "apple-sm": "6px",
        "apple-md": "10px",
        "apple-lg": "14px",
        "apple-xl": "18px",
        "apple-2xl": "22px",
        "apple-3xl": "26px",
      },

      animation: {
        // Material Design 3 Motion
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-out": "fadeOut 0.3s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "scale-out": "scaleOut 0.3s ease-in",
        "rotate-in": "rotateIn 0.3s ease-out",
        "rotate-out": "rotateOut 0.3s ease-in",
        "bounce-in": "bounceIn 0.6s ease-out",
        "bounce-out": "bounceOut 0.6s ease-in",
        "flip-in": "flipIn 0.6s ease-out",
        "flip-out": "flipOut 0.6s ease-in",
        "zoom-in": "zoomIn 0.3s ease-out",
        "zoom-out": "zoomOut 0.3s ease-in",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",

        // Apple-inspired animations
        "apple-bounce":
          "appleBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "apple-spring":
          "appleSpring 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "apple-fade": "appleFade 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "apple-slide": "appleSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "apple-scale": "appleScale 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "apple-rotate": "appleRotate 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "apple-pulse": "applePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "apple-shimmer": "appleShimmer 2s linear infinite",
      },

      keyframes: {
        // Material Design 3 Keyframes
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        rotateIn: {
          "0%": { transform: "rotate(-180deg)", opacity: "0" },
          "100%": { transform: "rotate(0deg)", opacity: "1" },
        },
        rotateOut: {
          "0%": { transform: "rotate(0deg)", opacity: "1" },
          "100%": { transform: "rotate(180deg)", opacity: "0" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "30%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(0.3)", opacity: "0" },
        },
        flipIn: {
          "0%": {
            transform: "perspective(400px) rotateY(90deg)",
            opacity: "0",
          },
          "40%": { transform: "perspective(400px) rotateY(-20deg)" },
          "60%": { transform: "perspective(400px) rotateY(10deg)" },
          "80%": { transform: "perspective(400px) rotateY(-5deg)" },
          "100%": {
            transform: "perspective(400px) rotateY(0deg)",
            opacity: "1",
          },
        },
        flipOut: {
          "0%": { transform: "perspective(400px) rotateY(0deg)", opacity: "1" },
          "100%": {
            transform: "perspective(400px) rotateY(-90deg)",
            opacity: "0",
          },
        },
        zoomIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        zoomOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.5)", opacity: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },

        // Apple-inspired keyframes
        appleBounce: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        appleSpring: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        appleFade: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        appleSlide: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        appleScale: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        appleRotate: {
          "0%": { opacity: "0", transform: "rotate(-10deg)" },
          "100%": { opacity: "1", transform: "rotate(0deg)" },
        },
        applePulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        appleShimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },

      backdropBlur: {
        "apple-xs": "2px",
        "apple-sm": "4px",
        "apple-md": "8px",
        "apple-lg": "12px",
        "apple-xl": "16px",
        "apple-2xl": "24px",
        "apple-3xl": "32px",
      },
    },
  },
  plugins: [],
};
