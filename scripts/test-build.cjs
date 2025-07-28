#!/usr/bin/env node

/**
 * Build Test Script
 *
 * This script tests the build process to ensure the application
 * can be built successfully for deployment.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function runCommand(command, options = {}) {
  try {
    console.log(`Running: ${command}`);
    const result = execSync(command, {
      encoding: "utf8",
      stdio: "inherit",
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function checkDependencies() {
  console.log("📦 Checking dependencies...");

  if (!fs.existsSync("package.json")) {
    console.error("❌ package.json not found");
    return false;
  }

  if (!fs.existsSync("package-lock.json")) {
    console.error("❌ package-lock.json not found");
    return false;
  }

  console.log("✅ Dependencies files found");
  return true;
}

function installDependencies() {
  console.log("📦 Installing dependencies...");

  const result = runCommand("npm ci");
  if (!result.success) {
    console.error("❌ Failed to install dependencies");
    return false;
  }

  console.log("✅ Dependencies installed successfully");
  return true;
}

function runLinting() {
  console.log("🔍 Running linting...");

  const result = runCommand("npm run lint");
  if (!result.success) {
    console.error("❌ Linting failed");
    return false;
  }

  console.log("✅ Linting passed");
  return true;
}

function runTests() {
  console.log("🧪 Running tests...");

  const result = runCommand("npm test", { stdio: "pipe" });
  if (!result.success) {
    console.error("❌ Tests failed");
    return false;
  }

  console.log("✅ Tests passed");
  return true;
}

function buildApplication() {
  console.log("🏗️  Building application...");

  // Clean dist directory
  const distPath = path.join(__dirname, "../dist");
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log("🗑️  Cleaned dist directory");
  }

  const result = runCommand("npm run build");
  if (!result.success) {
    console.error("❌ Build failed");
    return false;
  }

  // Check if build artifacts exist
  if (!fs.existsSync(distPath)) {
    console.error("❌ Build artifacts not found");
    return false;
  }

  const files = fs.readdirSync(distPath);
  if (files.length === 0) {
    console.error("❌ Build directory is empty");
    return false;
  }

  console.log("✅ Build completed successfully");
  console.log(`📁 Build artifacts: ${files.join(", ")}`);
  return true;
}

function checkBuildArtifacts() {
  console.log("🔍 Checking build artifacts...");

  const distPath = path.join(__dirname, "../dist");
  const indexHtmlPath = path.join(distPath, "index.html");

  if (!fs.existsSync(indexHtmlPath)) {
    console.error("❌ index.html not found in build artifacts");
    return false;
  }

  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  if (!indexHtml.includes("<title>")) {
    console.error("❌ index.html appears to be invalid");
    return false;
  }

  console.log("✅ Build artifacts are valid");
  return true;
}

function main() {
  console.log("🚀 Starting build test...\n");

  const steps = [
    { name: "Check Dependencies", fn: checkDependencies },
    { name: "Install Dependencies", fn: installDependencies },
    { name: "Run Linting", fn: runLinting },
    { name: "Run Tests", fn: runTests },
    { name: "Build Application", fn: buildApplication },
    { name: "Check Build Artifacts", fn: checkBuildArtifacts },
  ];

  for (const step of steps) {
    console.log(`\n--- ${step.name} ---`);
    if (!step.fn()) {
      console.error(`\n❌ Build test failed at: ${step.name}`);
      process.exit(1);
    }
  }

  console.log("\n🎉 Build test completed successfully!");
  console.log("✅ All checks passed");
  console.log("🚀 Ready for deployment");
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDependencies,
  installDependencies,
  runLinting,
  runTests,
  buildApplication,
  checkBuildArtifacts,
};
