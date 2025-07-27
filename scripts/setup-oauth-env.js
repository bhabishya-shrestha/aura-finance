#!/usr/bin/env node

/* eslint-env node */

/**
 * OAuth Setup Script (Environment Variables Version)
 *
 * This script configures OAuth providers using environment variables.
 * Useful for CI/CD or automated setup.
 *
 * Environment Variables Required:
 * - SUPABASE_ACCESS_TOKEN: Your Supabase access token
 * - GITHUB_CLIENT_ID: GitHub OAuth Client ID
 * - GITHUB_CLIENT_SECRET: GitHub OAuth Client Secret
 * - GOOGLE_CLIENT_ID: Google OAuth Client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth Client Secret
 *
 * Usage:
 * 1. Set environment variables
 * 2. Run: node scripts/setup-oauth-env.js
 */

import fetch from "node-fetch";

const SUPABASE_PROJECT_REF = "mdpfwvqpwkiojnzpctou";
const SUPABASE_API_URL = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}`;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentVariables() {
  const required = [
    "SUPABASE_ACCESS_TOKEN",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];

  const missing = required.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    log("❌ Missing required environment variables:", "red");
    missing.forEach((varName) => {
      log(`   - ${varName}`, "yellow");
    });
    log("\nPlease set these environment variables and try again.", "blue");
    process.exit(1);
  }

  log("✅ All required environment variables are set", "green");
}

async function makeRequest(endpoint, options = {}) {
  const url = `${SUPABASE_API_URL}${endpoint}`;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function getCurrentAuthConfig() {
  log("📋 Fetching current auth configuration...", "blue");

  try {
    // Try the new auth config endpoint
    const config = await makeRequest("/auth/v1/config");
    return config;
  } catch (error) {
    log(`⚠️  Could not fetch auth config: ${error.message}`, "yellow");
    log("Proceeding with default configuration...", "blue");
    return {
      site_url: "https://aura-finance-tool.vercel.app",
      additional_redirect_urls: ["http://localhost:5173"],
      providers: {},
    };
  }
}

async function updateAuthConfig(config) {
  log("🔄 Updating auth configuration...", "blue");

  try {
    const result = await makeRequest("/auth/v1/config", {
      method: "PUT",
      body: JSON.stringify(config),
    });

    log("✅ Auth configuration updated successfully!", "green");
    return result;
  } catch (error) {
    log(`❌ Failed to update auth config: ${error.message}`, "red");
    throw error;
  }
}

function createOAuthConfig() {
  const githubConfig = {
    enabled: true,
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: "https://aura-finance-tool.vercel.app/auth/callback",
  };

  const googleConfig = {
    enabled: true,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: "https://aura-finance-tool.vercel.app/auth/callback",
  };

  return { github: githubConfig, google: googleConfig };
}

async function main() {
  try {
    log("🚀 Aura Finance OAuth Setup (Environment Variables)", "bright");
    log("==================================================\n", "bright");

    // Check environment variables
    checkEnvironmentVariables();

    // Get current config
    const currentConfig = await getCurrentAuthConfig();
    if (!currentConfig) {
      log("❌ Cannot proceed without current auth configuration", "red");
      process.exit(1);
    }

    log("\n📊 Current Auth Configuration:", "cyan");
    console.log(JSON.stringify(currentConfig, null, 2));

    // Create OAuth config
    const oauthConfig = createOAuthConfig();

    // Update configuration
    const updatedConfig = {
      ...currentConfig,
      providers: {
        ...currentConfig.providers,
        ...oauthConfig,
      },
    };

    // Show configuration summary
    log("\n📝 Configuration Summary:", "cyan");
    log("GitHub OAuth:", "yellow");
    log(`  - Enabled: ${oauthConfig.github.enabled}`, "blue");
    log(
      `  - Client ID: ${oauthConfig.github.client_id.substring(0, 8)}...`,
      "blue"
    );
    log(`  - Redirect URI: ${oauthConfig.github.redirect_uri}`, "blue");

    log("\nGoogle OAuth:", "yellow");
    log(`  - Enabled: ${oauthConfig.google.enabled}`, "blue");
    log(
      `  - Client ID: ${oauthConfig.google.client_id.substring(0, 8)}...`,
      "blue"
    );
    log(`  - Redirect URI: ${oauthConfig.google.redirect_uri}`, "blue");

    // Update the configuration
    await updateAuthConfig(updatedConfig);

    log("\n🎉 OAuth Setup Complete!", "green");
    log("You can now test OAuth authentication at:", "cyan");
    log("  - Local: http://localhost:5173/auth", "blue");
    log("  - Production: https://aura-finance-tool.vercel.app/auth", "blue");
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, "red");
    process.exit(1);
  }
}

// Run the script
main();
