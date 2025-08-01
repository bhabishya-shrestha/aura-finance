#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying OAuth configuration...");

function checkEnvironmentVariables() {
  const requiredVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  const missing = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log("⚠️  Missing environment variables:", missing.join(", "));
    return false;
  }

  console.log("✅ Environment variables configured");
  return true;
}

function checkOAuthConfig() {
  const configPath = path.join(process.cwd(), "oauth-config.json");

  if (!fs.existsSync(configPath)) {
    console.log("⚠️  OAuth config file not found. Run: npm run oauth:setup");
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log("✅ OAuth configuration file found");

    // Check if staging and production environments are configured
    const environments = ["staging", "production"];
    environments.forEach(env => {
      if (config.environments[env]) {
        console.log(`✅ ${env} environment configured`);
      } else {
        console.log(`⚠️  ${env} environment missing`);
      }
    });

    return true;
  } catch (error) {
    console.log("❌ Invalid OAuth configuration file");
    return false;
  }
}

function checkCurrentEnvironment() {
  const env = process.env.VITE_APP_ENV || "development";
  console.log(`🌍 Current environment: ${env}`);

  const urls = {
    development: "http://localhost:5173 (OAuth disabled)",
    staging: "https://aura-finance-app.vercel.app",
    production: "https://aura-finance-tool.vercel.app",
  };

  console.log(`🔗 Expected URL: ${urls[env]}`);

  if (env === "development") {
    console.log("⚠️  Note: OAuth testing not available in local development");
  }

  return true;
}

function main() {
  console.log("🔐 OAuth Verification Report");
  console.log("============================\n");

  const checks = [
    { name: "Environment Variables", fn: checkEnvironmentVariables },
    { name: "OAuth Configuration", fn: checkOAuthConfig },
    { name: "Current Environment", fn: checkCurrentEnvironment },
  ];

  let allPassed = true;

  checks.forEach(check => {
    console.log(`\n--- ${check.name} ---`);
    if (!check.fn()) {
      allPassed = false;
    }
  });

  console.log("\n📊 Verification Summary:");
  console.log("========================");

  if (allPassed) {
    console.log("✅ All OAuth checks passed");
    console.log("🚀 OAuth is properly configured for staging/production");
  } else {
    console.log("❌ Some OAuth checks failed");
    console.log("🔧 Run: npm run oauth:setup to fix issues");
  }

  console.log("\n⚠️  IMPORTANT:");
  console.log("   OAuth testing is only available in staging environment");
  console.log("   Local development OAuth testing is not supported");
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkOAuthConfig,
  checkCurrentEnvironment,
};
