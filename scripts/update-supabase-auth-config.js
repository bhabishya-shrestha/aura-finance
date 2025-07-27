#!/usr/bin/env node

/* eslint-env node */

/**
 * Update Supabase Auth Configuration Script
 *
 * This script updates the Supabase auth configuration to use the correct
 * site URL and redirect URLs for both production and development.
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
  log("🔑 Supabase Access Token Required", "yellow");
  log(
    "Get your access token from: https://app.supabase.com/account/tokens",
    "blue"
  );
  log(
    "This token is required to update your Supabase project configuration.\n",
    "blue"
  );

  const token = await question("Enter your Supabase access token: ");
  return token.trim();
}

async function makeRequest(endpoint, accessToken, method = "GET", body = null) {
  const url = `${SUPABASE_API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function getCurrentAuthConfig(accessToken) {
  log("📋 Fetching current auth configuration...", "blue");

  try {
    const config = await makeRequest("/auth/v1/config", accessToken);
    return config;
  } catch (error) {
    log(`⚠️  Could not fetch auth config: ${error.message}`, "yellow");
    log("Proceeding with default configuration...", "blue");
    return {
      site_url: "http://127.0.0.1:3000",
      additional_redirect_urls: ["https://127.0.0.1:3000"],
    };
  }
}

async function updateAuthConfig(accessToken, config) {
  log("🔄 Updating auth configuration...", "blue");

  try {
    await makeRequest("/auth/v1/config", accessToken, "PUT", config);
    log("✅ Auth configuration updated successfully!", "green");
  } catch (error) {
    log(`❌ Failed to update auth configuration: ${error.message}`, "red");
    throw error;
  }
}

async function main() {
  try {
    log("🚀 Supabase Auth Configuration Update", "bright");
    log("=====================================\n", "bright");

    // Get access token
    const accessToken = await getAccessToken();

    // Get current config
    const currentConfig = await getCurrentAuthConfig(accessToken);

    log("\n📊 Current Auth Configuration:", "cyan");
    console.log(JSON.stringify(currentConfig, null, 2));

    // Create updated configuration
    const updatedConfig = {
      ...currentConfig,
      site_url:
        "https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app",
      additional_redirect_urls: [
        "https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app",
        "http://localhost:5173",
      ],
    };

    log("\n📝 Updated Configuration:", "cyan");
    console.log(JSON.stringify(updatedConfig, null, 2));

    // Confirm before updating
    const confirm = await question(
      "\nDo you want to update the auth configuration? (y/N): "
    );

    if (confirm.toLowerCase() !== "y") {
      log("❌ Configuration update cancelled", "red");
      process.exit(0);
    }

    // Update the configuration
    await updateAuthConfig(accessToken, updatedConfig);

    log("\n🎉 Auth Configuration Update Complete!", "green");
    log("Your OAuth redirects should now work correctly.", "cyan");
    log("\n🔗 Test URLs:", "yellow");
    log(
      "  - Production: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth",
      "blue"
    );
    log("  - Local: http://localhost:5173/auth", "blue");
  } catch (error) {
    log(`\n❌ Update failed: ${error.message}`, "red");
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
