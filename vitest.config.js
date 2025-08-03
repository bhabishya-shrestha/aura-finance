import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.js"],
    globals: true,
    testTimeout: 10000, // 10 second timeout for all tests
    hookTimeout: 10000, // 10 second timeout for hooks
  },
});
