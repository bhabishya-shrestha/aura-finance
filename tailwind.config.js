/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Apple's new glass trend colors
        "apple-glass": {
          50: "rgba(255, 255, 255, 0.05)",
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.15)",
          300: "rgba(255, 255, 255, 0.2)",
          400: "rgba(255, 255, 255, 0.25)",
          500: "rgba(255, 255, 255, 0.3)",
          600: "rgba(255, 255, 255, 0.35)",
          700: "rgba(255, 255, 255, 0.4)",
          800: "rgba(255, 255, 255, 0.45)",
          900: "rgba(255, 255, 255, 0.5)",
        },
        "apple-dark": {
          50: "rgba(0, 0, 0, 0.05)",
          100: "rgba(0, 0, 0, 0.1)",
          200: "rgba(0, 0, 0, 0.15)",
          300: "rgba(0, 0, 0, 0.2)",
          400: "rgba(0, 0, 0, 0.25)",
          500: "rgba(0, 0, 0, 0.3)",
          600: "rgba(0, 0, 0, 0.35)",
          700: "rgba(0, 0, 0, 0.4)",
          800: "rgba(0, 0, 0, 0.45)",
          900: "rgba(0, 0, 0, 0.5)",
        },
        // Modern color palette
        "dark-charcoal": "#17181c",
        "glass-white": "rgba(255, 255, 255, 0.15)",
        "soft-white": "#F0F0F0",
        "muted-gray": "#a1a1a1",
        teal: "#00f2fe",
        purple: "#6a00f4",
        // Apple's system colors
        "apple-blue": "#007AFF",
        "apple-green": "#34C759",
        "apple-orange": "#FF9500",
        "apple-red": "#FF3B30",
        "apple-purple": "#AF52DE",
        "apple-pink": "#FF2D92",
        "apple-yellow": "#FFCC02",
        "apple-gray": {
          100: "#F2F2F7",
          200: "#E5E5EA",
          300: "#D1D1D6",
          400: "#C7C7CC",
          500: "#AEAEB2",
          600: "#8E8E93",
          700: "#636366",
          800: "#48484A",
          900: "#1C1C1E",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        "sf-pro": ["SF Pro Display", "Inter", "sans-serif"],
      },
      backdropBlur: {
        glass: "20px",
        "glass-heavy": "30px",
        apple: "25px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "apple-glass": "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        "apple-glass-light": "0 4px 16px 0 rgba(0, 0, 0, 0.05)",
        "apple-elevation":
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "apple-elevation-2":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "apple-elevation-3":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "glass-glow": "glassGlow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glassGlow: {
          "0%": { boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)" },
          "100%": { boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.4)" },
        },
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "16px",
        "apple-xl": "20px",
        "apple-2xl": "24px",
      },
    },
  },
  plugins: [],
};
