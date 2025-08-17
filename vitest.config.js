import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.test.js",
        "**/*.test.jsx",
        "**/*.spec.js",
        "**/*.spec.jsx",
        "**/setup.js",
        "**/test-utils.js",
        "**/mocks/**",
        "**/stories/**",
        "**/*.stories.js",
        "**/*.stories.jsx",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/coverage/**",
        "**/scripts/**",
        "**/config/**",
        "**/vite.config.js",
        "**/vitest.config.js",
        "**/tailwind.config.js",
        "**/postcss.config.js",
        "**/firebase.json",
        "**/firestore.rules",
        "**/firestore.indexes.json",
        "**/vercel.json",
        "**/lighthouserc.json",
        "**/.env*",
        "**/package.json",
        "**/package-lock.json",
        "**/README.md",
        "**/CHANGELOG.md",
        "**/*.md",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
