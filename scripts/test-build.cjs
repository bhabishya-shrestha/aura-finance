#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testing production build...");

try {
  // Check if dist directory exists
  if (!fs.existsSync("dist")) {
    console.log("📦 Building project...");
    execSync("npm run build", { stdio: "inherit" });
  }

  // Check if build files exist
  const distPath = path.join(process.cwd(), "dist");
  const files = fs.readdirSync(distPath);

  if (files.length === 0) {
    throw new Error("Build directory is empty");
  }

  // Check for essential files
  const requiredFiles = ["index.html", "assets"];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(distPath, file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  console.log("✅ Production build test passed");
  console.log("📁 Build files found:", files.length);
} catch (error) {
  console.error("❌ Production build test failed:", error.message);
  process.exit(1);
}
