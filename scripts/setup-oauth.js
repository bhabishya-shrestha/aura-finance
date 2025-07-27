#!/usr/bin/env node

/* eslint-env node */

/**
 * OAuth Setup Script for Aura Finance
 *
 * This script configures OAuth providers (GitHub and Google) in your Supabase project
 * using the Supabase Management API.
 *
 * Usage:
 * 1. Get your Supabase access token from: https://app.supabase.com/account/tokens
 * 2. Run: node scripts/setup-oauth.js
 */

import fetch from "node-fetch";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getAccessToken() {
  log("\n🔐 Supabase Access Token Required", "cyan");
  log("To get your access token:", "yellow");
  log("1. Go to: https://app.supabase.com/account/tokens", "blue");
  log('2. Create a new access token with "Project API" scope', "blue");
  log("3. Copy the token and paste it below\n", "blue");

  const token = await question("Enter your Supabase access token: ");
  return token.trim();
}

async function makeRequest(endpoint, options = {}) {
  const url = `${SUPABASE_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
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

async function getCurrentAuthConfig(accessToken) {
  log("📋 Fetching current auth configuration...", "blue");

  try {
    // Try the new auth config endpoint
    const config = await makeRequest("/auth/v1/config", { accessToken });
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

async function updateAuthConfig(accessToken, config) {
  log("🔄 Updating auth configuration...", "blue");

  try {
    const result = await makeRequest("/auth/v1/config", {
      method: "PUT",
      accessToken,
      body: JSON.stringify(config),
    });

    log("✅ Auth configuration updated successfully!", "green");
    return result;
  } catch (error) {
    log(`❌ Failed to update auth config: ${error.message}`, "red");
    throw error;
  }
}

async function setupGitHubOAuth() {
  log("\n🐙 GitHub OAuth Setup", "cyan");
  log("To set up GitHub OAuth:", "yellow");
  log("1. Go to: https://github.com/settings/developers", "blue");
  log('2. Click "New OAuth App"', "blue");
  log("3. Fill in the details:", "blue");
  log("   - Application name: Aura Finance", "blue");
  log("   - Homepage URL: https://aura-finance-tool.vercel.app", "blue");
  log(
    "   - Authorization callback URL: https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback",
    "blue"
  );
  log("4. Copy the Client ID and Client Secret\n", "blue");

  const clientId = await question("Enter GitHub Client ID: ");
  const clientSecret = await question("Enter GitHub Client Secret: ");

  return {
    enabled: true,
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    redirect_uri: "https://aura-finance-tool.vercel.app/auth/callback",
  };
}

async function setupGoogleOAuth() {
  log("\n🔍 Google OAuth Setup", "cyan");
  log("To set up Google OAuth:", "yellow");
  log("1. Go to: https://console.cloud.google.com/", "blue");
  log("2. Create a new project or select existing one", "blue");
  log("3. Enable the Google+ API", "blue");
  log(
    "4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs",
    "blue"
  );
  log('5. Choose "Web application"', "blue");
  log("6. Fill in the details:", "blue");
  log("   - Name: Aura Finance", "blue");
  log("   - Authorized JavaScript origins:", "blue");
  log("     * https://aura-finance-tool.vercel.app", "blue");
  log("     * http://localhost:5173", "blue");
  log("   - Authorized redirect URIs:", "blue");
  log(
    "     * https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback",
    "blue"
  );
  log("7. Copy the Client ID and Client Secret\n", "blue");

  const clientId = await question("Enter Google Client ID: ");
  const clientSecret = await question("Enter Google Client Secret: ");

  return {
    enabled: true,
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    redirect_uri: "https://aura-finance-tool.vercel.app/auth/callback",
  };
}

async function main() {
  try {
    log("🚀 Aura Finance OAuth Setup Script", "bright");
    log("=====================================\n", "bright");

    // Get access token
    const accessToken = await getAccessToken();

    // Get current config
    const currentConfig = await getCurrentAuthConfig(accessToken);
    if (!currentConfig) {
      log("❌ Cannot proceed without current auth configuration", "red");
      process.exit(1);
    }

    log("\n📊 Current Auth Configuration:", "cyan");
    console.log(JSON.stringify(currentConfig, null, 2));

    // Setup GitHub OAuth
    const githubConfig = await setupGitHubOAuth();

    // Setup Google OAuth
    const googleConfig = await setupGoogleOAuth();

    // Update configuration
    const updatedConfig = {
      ...currentConfig,
      providers: {
        ...currentConfig.providers,
        github: githubConfig,
        google: googleConfig,
      },
    };

    // Confirm before updating
    log("\n📝 Configuration Summary:", "cyan");
    log("GitHub OAuth:", "yellow");
    log(`  - Enabled: ${githubConfig.enabled}`, "blue");
    log(`  - Client ID: ${githubConfig.client_id.substring(0, 8)}...`, "blue");
    log(`  - Redirect URI: ${githubConfig.redirect_uri}`, "blue");

    log("\nGoogle OAuth:", "yellow");
    log(`  - Enabled: ${googleConfig.enabled}`, "blue");
    log(`  - Client ID: ${googleConfig.client_id.substring(0, 8)}...`, "blue");
    log(`  - Redirect URI: ${googleConfig.redirect_uri}`, "blue");

    const confirm = await question(
      "\nDo you want to update the auth configuration? (y/N): "
    );

    if (confirm.toLowerCase() !== "y") {
      log("❌ Configuration update cancelled", "red");
      process.exit(0);
    }

    // Update the configuration
    await updateAuthConfig(accessToken, updatedConfig);

    log("\n🎉 OAuth Setup Complete!", "green");
    log("You can now test OAuth authentication at:", "cyan");
    log("  - Local: http://localhost:5173/auth", "blue");
    log("  - Production: https://aura-finance-tool.vercel.app/auth", "blue");
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, "red");
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();
