#!/usr/bin/env node

/**
 * Firebase Rules Deployment Script
 *
 * This script helps deploy Firebase security rules and indexes to fix permission issues.
 *
 * Prerequisites:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login to Firebase: firebase login
 * 3. Initialize Firebase project: firebase init (if not already done)
 *
 * Usage:
 * node deploy-firebase-rules.js
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Firebase Rules Deployment Script");
console.log("=====================================\n");

// Check if Firebase CLI is installed
try {
  execSync("firebase --version", { stdio: "pipe" });
  console.log("✅ Firebase CLI is installed");
} catch (error) {
  console.error("❌ Firebase CLI is not installed");
  console.log("Please install it with: npm install -g firebase-tools");
  process.exit(1);
}

// Check if user is logged in
try {
  execSync("firebase projects:list", { stdio: "pipe" });
  console.log("✅ Firebase CLI is logged in");
} catch (error) {
  console.error("❌ Firebase CLI is not logged in");
  console.log("Please login with: firebase login");
  process.exit(1);
}

// Check if required files exist
const requiredFiles = [
  "firestore.rules",
  "firestore.indexes.json",
  "firebase.json",
];
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} is missing`);
    process.exit(1);
  }
}

console.log("\n📋 Deploying Firebase rules and indexes...\n");

try {
  // Deploy Firestore rules
  console.log("Deploying Firestore rules...");
  execSync("firebase deploy --only firestore:rules", { stdio: "inherit" });

  // Deploy Firestore indexes
  console.log("\nDeploying Firestore indexes...");
  execSync("firebase deploy --only firestore:indexes", { stdio: "inherit" });

  console.log("\n✅ Firebase rules and indexes deployed successfully!");
  console.log("\n🎉 Your cross-platform data sync should now work properly!");
  console.log("\nThe new rules allow:");
  console.log("- ✅ Read/write/delete operations on user's own data");
  console.log("- ✅ Proper authentication checks");
  console.log("- ✅ Secure data isolation between users");
} catch (error) {
  console.error("\n❌ Deployment failed:", error.message);
  console.log("\nTroubleshooting:");
  console.log("1. Make sure you're in the correct Firebase project");
  console.log("2. Check your Firebase project ID in .firebaserc");
  console.log("3. Ensure you have the necessary permissions");
  process.exit(1);
}
