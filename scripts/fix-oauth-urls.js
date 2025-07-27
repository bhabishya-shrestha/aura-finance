#!/usr/bin/env node

/**
 * OAuth URL Fixer for Aura Finance
 *
 * This script provides the exact URLs you need to configure in your
 * OAuth providers to match Supabase's expected callback URLs.
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
  url: (msg) => console.log(`${colors.green}🔗 ${msg}${colors.reset}`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

class OAuthUrlFixer {
  constructor() {
    this.projectRoot = process.cwd();
  }

  async run() {
    log.header("🔧 OAuth URL Fixer for Aura Finance");
    log.info(
      "This tool will help you configure the correct callback URLs in your OAuth providers."
    );

    try {
      await this.getSupabaseInfo();
      await this.generateCorrectUrls();
      await this.provideConfigurationSteps();
    } catch (error) {
      log.error(`URL fixer failed: ${error.message}`);
    } finally {
      rl.close();
    }
  }

  async getSupabaseInfo() {
    log.header("📋 Supabase Configuration");

    log.info("First, let's get your Supabase project information:");

    this.supabaseUrl = await question(
      "Enter your Supabase project URL (e.g., https://your-project.supabase.co): "
    );

    if (!this.supabaseUrl.startsWith("https://")) {
      this.supabaseUrl = `https://${this.supabaseUrl}`;
    }

    // Remove trailing slash if present
    this.supabaseUrl = this.supabaseUrl.replace(/\/$/, "");

    log.success(`Supabase URL: ${this.supabaseUrl}`);
  }

  async generateCorrectUrls() {
    log.header("🔗 Correct OAuth URLs");

    // Generate the correct callback URLs
    const supabaseCallbackUrl = `${this.supabaseUrl}/auth/v1/callback`;

    log.info("Here are the URLs you need to configure:");
    console.log("");

    log.step("For Google OAuth:");
    log.info("Go to Google Cloud Console > APIs & Services > Credentials");
    log.info(
      "Find your OAuth 2.0 Client ID and add these Authorized redirect URIs:"
    );
    console.log("");

    // Common development and production URLs
    const googleRedirectUrls = [
      "http://localhost:5173/auth/callback",
      "http://localhost:3000/auth/callback",
      "https://aura-finance-tool.vercel.app/auth/callback",
      "https://your-custom-domain.com/auth/callback", // Replace with your actual domain
    ];

    googleRedirectUrls.forEach((url) => {
      log.url(url);
    });

    console.log("");
    log.step("For GitHub OAuth:");
    log.info("Go to GitHub Settings > Developer settings > OAuth Apps");
    log.info("Set the Authorization callback URL to:");
    log.url(supabaseCallbackUrl);

    console.log("");
    log.step("For Supabase Configuration:");
    log.info("Go to Supabase Dashboard > Authentication > URL Configuration");
    log.info("Set these URLs:");
    log.url(`Site URL: ${this.supabaseUrl}`);
    log.url(`Redirect URLs: ${googleRedirectUrls.join(", ")}`);

    this.correctUrls = {
      supabaseCallback: supabaseCallbackUrl,
      googleRedirects: googleRedirectUrls,
      siteUrl: this.supabaseUrl,
    };
  }

  async provideConfigurationSteps() {
    log.header("📝 Step-by-Step Configuration");

    console.log("\n" + "=".repeat(60));
    log.step("GOOGLE OAUTH CONFIGURATION");
    console.log("=".repeat(60));

    log.info("1. Go to https://console.cloud.google.com/");
    log.info("2. Select your project");
    log.info("3. Go to APIs & Services > Credentials");
    log.info("4. Find your OAuth 2.0 Client ID");
    log.info("5. Click on the client ID to edit");
    log.info('6. In "Authorized redirect URIs", add these URLs:');

    this.correctUrls.googleRedirects.forEach((url) => {
      log.url(`   ${url}`);
    });

    log.info('7. Click "Save"');

    console.log("\n" + "=".repeat(60));
    log.step("GITHUB OAUTH CONFIGURATION");
    console.log("=".repeat(60));

    log.info("1. Go to https://github.com/settings/developers");
    log.info("2. Find your OAuth App");
    log.info('3. Click "Edit"');
    log.info("4. Set Authorization callback URL to:");
    log.url(`   ${this.correctUrls.supabaseCallback}`);
    log.info('5. Click "Update application"');

    console.log("\n" + "=".repeat(60));
    log.step("SUPABASE CONFIGURATION");
    console.log("=".repeat(60));

    log.info("1. Go to your Supabase project dashboard");
    log.info("2. Navigate to Authentication > URL Configuration");
    log.info("3. Set Site URL to:");
    log.url(`   ${this.correctUrls.siteUrl}`);
    log.info("4. Set Redirect URLs to (comma-separated):");
    this.correctUrls.googleRedirects.forEach((url) => {
      log.url(`   ${url}`);
    });
    log.info('5. Click "Save"');

    console.log("\n" + "=".repeat(60));
    log.step("VERIFICATION");
    console.log("=".repeat(60));

    log.info("After making these changes:");
    log.step("1. Wait 5-10 minutes for changes to propagate");
    log.step("2. Clear your browser cache and cookies");
    log.step("3. Try OAuth login again");
    log.step("4. Check browser console for any remaining errors");

    console.log("\n" + "=".repeat(60));
    log.step("TROUBLESHOOTING TIPS");
    console.log("=".repeat(60));

    log.warning('If you still get "redirect_uri_mismatch":');
    log.info("- Double-check that URLs match exactly (including protocol)");
    log.info("- Make sure there are no extra spaces or characters");
    log.info("- Verify the URLs are saved in the OAuth provider dashboard");

    log.warning("If OAuth works locally but not in production:");
    log.info("- Add your production domain to the redirect URIs");
    log.info("- Make sure your production domain is in Supabase redirect URLs");

    log.warning('If you get "invalid_client" error:');
    log.info("- Verify your OAuth client ID and secret in Supabase");
    log.info("- Make sure the OAuth app is properly configured");

    console.log("\n" + "=".repeat(60));
    log.success("Configuration Complete!");
    console.log("=".repeat(60));

    log.info(
      "Your OAuth should now work correctly. If you continue to have issues,"
    );
    log.info(
      "run the troubleshooter script: node scripts/oauth-troubleshooter.js"
    );
  }
}

// Run the URL fixer
if (require.main === module) {
  const urlFixer = new OAuthUrlFixer();
  urlFixer.run().catch(console.error);
}

module.exports = OAuthUrlFixer;
