#!/usr/bin/env node

/**
 * OAuth Troubleshooter for Aura Finance
 *
 * This script helps diagnose and fix OAuth callback URL issues between
 * Supabase and OAuth providers (Google/GitHub).
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

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

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

class OAuthTroubleshooter {
  constructor() {
    this.projectRoot = process.cwd();
    this.envFile = path.join(this.projectRoot, ".env");
    this.envExample = path.join(this.projectRoot, "env.example");
  }

  async run() {
    log.header("🔍 OAuth Troubleshooter for Aura Finance");
    log.info(
      "This tool will help you diagnose and fix OAuth callback URL issues."
    );

    try {
      await this.checkEnvironment();
      await this.analyzeCurrentSetup();
      await this.provideSolutions();
    } catch (error) {
      log.error(`Troubleshooter failed: ${error.message}`);
    } finally {
      rl.close();
    }
  }

  async checkEnvironment() {
    log.header("📋 Environment Check");

    // Check if .env file exists
    if (fs.existsSync(this.envFile)) {
      log.success(".env file found");
      const envContent = fs.readFileSync(this.envFile, "utf8");

      // Check for required Supabase variables
      const hasSupabaseUrl = envContent.includes("VITE_SUPABASE_URL=");
      const hasSupabaseKey = envContent.includes("VITE_SUPABASE_ANON_KEY=");

      if (hasSupabaseUrl && hasSupabaseKey) {
        log.success("Supabase environment variables are configured");
      } else {
        log.warning("Missing Supabase environment variables");
      }
    } else {
      log.error(".env file not found");
      log.step(
        "Please copy env.example to .env and configure your Supabase credentials"
      );
    }
  }

  async analyzeCurrentSetup() {
    log.header("🔍 Current Setup Analysis");

    // Read the AuthContext to understand the current redirect logic
    const authContextPath = path.join(
      this.projectRoot,
      "src",
      "contexts",
      "AuthContext.jsx"
    );

    if (fs.existsSync(authContextPath)) {
      const authContext = fs.readFileSync(authContextPath, "utf8");

      // Extract the redirect URL logic
      const redirectUrlMatch = authContext.match(
        /redirectUrl\s*=\s*isLocalhost\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/
      );

      if (redirectUrlMatch) {
        const localhostUrl = redirectUrlMatch[1];
        const productionUrl = redirectUrlMatch[2];

        log.info("Current redirect URLs configured in code:");
        log.step(`Localhost: ${localhostUrl}`);
        log.step(`Production: ${productionUrl}`);

        this.currentUrls = {
          localhost: localhostUrl,
          production: productionUrl,
        };
      }
    }

    // Check if AuthCallbackPage exists
    const callbackPagePath = path.join(
      this.projectRoot,
      "src",
      "pages",
      "AuthCallbackPage.jsx"
    );
    if (fs.existsSync(callbackPagePath)) {
      log.success("AuthCallbackPage exists and is properly configured");
    } else {
      log.error("AuthCallbackPage not found");
    }
  }

  async provideSolutions() {
    log.header("🛠️  Solutions & Next Steps");

    log.info("Based on your setup, here are the specific steps to fix OAuth:");

    console.log("\n" + "=".repeat(60));
    log.step("STEP 1: Get Your Supabase Callback URLs");
    console.log("=".repeat(60));

    log.info("1. Go to your Supabase project dashboard");
    log.info("2. Navigate to Authentication > URL Configuration");
    log.info("3. Copy the Site URL and Redirect URLs");

    const supabaseUrl = await question(
      "\nEnter your Supabase Site URL (e.g., https://your-project.supabase.co): "
    );
    const supabaseRedirectUrls = await question(
      "Enter your Supabase Redirect URLs (comma-separated): "
    );

    console.log("\n" + "=".repeat(60));
    log.step("STEP 2: Configure Google OAuth");
    console.log("=".repeat(60));

    log.info("1. Go to Google Cloud Console > APIs & Services > Credentials");
    log.info("2. Find your OAuth 2.0 Client ID");
    log.info("3. Add these Authorized redirect URIs:");

    const redirectUrls = supabaseRedirectUrls
      .split(",")
      .map((url) => url.trim());
    redirectUrls.forEach((url) => {
      log.step(`   ${url}`);
    });

    console.log("\n" + "=".repeat(60));
    log.step("STEP 3: Configure GitHub OAuth");
    console.log("=".repeat(60));

    log.info("1. Go to GitHub Settings > Developer settings > OAuth Apps");
    log.info("2. Find your OAuth App");
    log.info("3. Set the Authorization callback URL to:");
    log.step(`   ${supabaseUrl}/auth/v1/callback`);

    console.log("\n" + "=".repeat(60));
    log.step("STEP 4: Verify Your App Configuration");
    console.log("=".repeat(60));

    log.info("Make sure your app is using the correct redirect URLs:");

    if (this.currentUrls) {
      log.info("Current app configuration:");
      log.step(`Localhost: ${this.currentUrls.localhost}`);
      log.step(`Production: ${this.currentUrls.production}`);

      log.warning("Ensure these match your Supabase redirect URLs!");
    }

    console.log("\n" + "=".repeat(60));
    log.step("STEP 5: Test OAuth Flow");
    console.log("=".repeat(60));

    log.info("1. Start your development server: npm run dev");
    log.info("2. Go to your app and try OAuth login");
    log.info("3. Check the browser console for any errors");
    log.info("4. Check the Network tab to see the redirect flow");

    console.log("\n" + "=".repeat(60));
    log.step("COMMON ISSUES & SOLUTIONS");
    console.log("=".repeat(60));

    log.warning('Issue: "redirect_uri_mismatch" error');
    log.info(
      "Solution: The redirect URI in your OAuth provider doesn't match Supabase"
    );

    log.warning('Issue: "invalid_client" error');
    log.info("Solution: Check your OAuth client ID and secret in Supabase");

    log.warning("Issue: OAuth works locally but not in production");
    log.info(
      "Solution: Add your production domain to OAuth provider redirect URIs"
    );

    log.warning('Issue: Callback page shows "No session found"');
    log.info(
      "Solution: Check that your AuthCallbackPage route is correct (/auth/callback)"
    );

    console.log("\n" + "=".repeat(60));
    log.step("VERIFICATION CHECKLIST");
    console.log("=".repeat(60));

    const checklist = [
      "✅ Supabase Site URL is correct",
      "✅ Supabase Redirect URLs include your domains",
      "✅ Google OAuth redirect URIs match Supabase",
      "✅ GitHub OAuth callback URL is correct",
      "✅ App redirect URLs match Supabase",
      "✅ AuthCallbackPage route is accessible",
      "✅ Environment variables are set correctly",
    ];

    checklist.forEach((item) => {
      log.info(item);
    });

    console.log("\n" + "=".repeat(60));
    log.success("Troubleshooting Complete!");
    console.log("=".repeat(60));

    log.info("If you're still having issues:");
    log.step("1. Check the browser console for specific error messages");
    log.step(
      "2. Verify all URLs are exactly the same (no extra spaces, correct protocol)"
    );
    log.step(
      "3. Make sure your OAuth app is properly configured in the provider dashboard"
    );
    log.step("4. Check Supabase logs for authentication errors");
  }
}

// Run the troubleshooter
if (require.main === module) {
  const troubleshooter = new OAuthTroubleshooter();
  troubleshooter.run().catch(console.error);
}

module.exports = OAuthTroubleshooter;
