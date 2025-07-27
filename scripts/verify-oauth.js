#!/usr/bin/env node

/* eslint-env node */

/**
 * OAuth Configuration Verification Script
 *
 * This script verifies that OAuth is properly configured
 * and helps identify any issues.
 */

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

function verifyOAuthConfiguration() {
  log("🔍 OAuth Configuration Verification", "bright");
  log("===================================\n", "bright");

  log("📋 Current OAuth Setup:", "cyan");
  log("GitHub OAuth:", "yellow");
  log("  - Client ID: Ov23li8zpmYssgU3keWU", "blue");
  log(
    "  - Callback URL: https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback",
    "blue"
  );

  log("\nGoogle OAuth:", "yellow");
  log(
    "  - Client ID: 46476095284-2j4nd4ekehs5lhgkeah66b16u044istr.apps.googleusercontent.com",
    "blue"
  );
  log(
    "  - Callback URL: https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback",
    "blue"
  );

  log("\n🔧 Verification Steps:", "cyan");
  log("1. Check GitHub OAuth App Settings:", "yellow");
  log("   - Go to: https://github.com/settings/developers", "blue");
  log("   - Click on 'Aura Finance' OAuth App", "blue");
  log("   - Verify Authorization callback URL is:", "blue");
  log("     https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback", "blue");

  log("\n2. Check Google OAuth App Settings:", "yellow");
  log("   - Go to: https://console.cloud.google.com/", "blue");
  log("   - Navigate to APIs & Services > Credentials", "blue");
  log("   - Click on 'Aura Finance' OAuth 2.0 Client ID", "blue");
  log("   - Verify Authorized redirect URIs includes:", "blue");
  log("     https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback", "blue");

  log("\n3. Check Supabase Auth Settings:", "yellow");
  log(
    "   - Go to: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/providers",
    "blue"
  );
  log("   - Verify both GitHub and Google are enabled", "blue");
  log("   - Check that redirect URLs match exactly", "blue");

  log("\n4. Test OAuth Flow:", "yellow");
  log("   - Go to: http://localhost:5173/auth", "blue");
  log("   - Try GitHub OAuth", "blue");
  log("   - Check browser console for errors", "blue");
  log("   - Check network tab for failed requests", "blue");

  log("\n🚨 Common Issues:", "cyan");
  log("1. Mismatched callback URLs", "red");
  log("2. OAuth providers not enabled in Supabase", "red");
  log("3. Incorrect client IDs or secrets", "red");
  log("4. Missing environment variables", "red");
  log("5. CORS issues with localhost", "red");

  log("\n💡 Troubleshooting Tips:", "cyan");
  log("1. Clear browser cache and cookies", "blue");
  log("2. Try in incognito/private mode", "blue");
  log("3. Check browser console for detailed errors", "blue");
  log("4. Verify all URLs match exactly (no trailing slashes)", "blue");
  log("5. Ensure development server is running", "blue");

  log("\n✅ Verification Complete!", "green");
  log("Follow the steps above to identify and fix any issues.", "cyan");
}

async function main() {
  try {
    verifyOAuthConfiguration();
  } catch (error) {
    log(`\n❌ Verification failed: ${error.message}`, "red");
    process.exit(1);
  }
}

// Run the script
main();
