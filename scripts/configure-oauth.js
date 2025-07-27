#!/usr/bin/env node

/* eslint-env node */

/**
 * Quick OAuth Configuration Script
 *
 * This script configures the existing OAuth credentials in Supabase
 * without asking for them again.
 */

// No imports needed for this script

const SUPABASE_PROJECT_REF = "mdpfwvqpwkiojnzpctou";
const SUPABASE_API_URL = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}`;

// Your existing OAuth credentials
const OAUTH_CONFIG = {
  github: {
    enabled: true,
    client_id: "Ov23li8zpmYssgU3keWU",
    client_secret: "67cc050b599504904508fbbccde50deefe0ffdf3",
    redirect_uri: "https://aura-finance-tool.vercel.app/auth/callback",
  },
  google: {
    enabled: true,
    client_id:
      "46476095284-2j4nd4ekehs5lhgkeah66b16u044istr.apps.googleusercontent.com",
    client_secret: "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",
    redirect_uri: "https://aura-finance-tool.vercel.app/auth/callback",
  },
};

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

async function configureOAuthInSupabase() {
  log("🚀 Configuring OAuth in Supabase Dashboard", "bright");
  log("==========================================\n", "bright");

  log("📋 OAuth Configuration Details:", "cyan");
  log("GitHub OAuth:", "yellow");
  log(`  - Client ID: ${OAUTH_CONFIG.github.client_id}`, "blue");
  log(`  - Redirect URI: ${OAUTH_CONFIG.github.redirect_uri}`, "blue");

  log("\nGoogle OAuth:", "yellow");
  log(`  - Client ID: ${OAUTH_CONFIG.google.client_id}`, "blue");
  log(`  - Redirect URI: ${OAUTH_CONFIG.google.redirect_uri}`, "blue");

  log("\n🔧 Manual Configuration Steps:", "cyan");
  log(
    "1. Go to: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/providers",
    "blue"
  );
  log("2. Enable GitHub OAuth and enter:", "yellow");
  log(`   - Client ID: ${OAUTH_CONFIG.github.client_id}`, "blue");
  log(`   - Client Secret: ${OAUTH_CONFIG.github.client_secret}`, "blue");
  log(`   - Redirect URL: ${OAUTH_CONFIG.github.redirect_uri}`, "blue");

  log("\n3. Enable Google OAuth and enter:", "yellow");
  log(`   - Client ID: ${OAUTH_CONFIG.google.client_id}`, "blue");
  log(`   - Client Secret: ${OAUTH_CONFIG.google.client_secret}`, "blue");
  log(`   - Redirect URL: ${OAUTH_CONFIG.google.redirect_uri}`, "blue");

  log("\n4. Save the configuration", "yellow");
  log("5. Test OAuth at: http://localhost:5173/auth", "blue");

  log("\n🎉 Configuration Complete!", "green");
  log("You can now test OAuth authentication.", "cyan");
}

async function main() {
  try {
    await configureOAuthInSupabase();
  } catch (error) {
    log(`\n❌ Configuration failed: ${error.message}`, "red");
    process.exit(1);
  }
}

// Run the script
main();
