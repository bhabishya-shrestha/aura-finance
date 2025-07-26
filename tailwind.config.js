/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-charcoal": "#17181c",
        "glass-white": "rgba(255, 255, 255, 0.15)",
        "soft-white": "#F0F0F0",
        "muted-gray": "#a1a1a1",
        teal: "#00f2fe",
        purple: "#6a00f4",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        glass: "16px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },
    },
  },
  plugins: [],
};
