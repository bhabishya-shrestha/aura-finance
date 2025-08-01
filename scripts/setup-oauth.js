#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔐 Setting up OAuth configuration...');

const environments = {
  development: {
    name: 'Development',
    url: 'http://localhost:5173',
    callback: 'http://localhost:5173/auth/callback'
  },
  staging: {
    name: 'Staging',
    url: 'https://aura-finance-app.vercel.app',
    callback: 'https://aura-finance-app.vercel.app/auth/callback'
  },
  production: {
    name: 'Production',
    url: 'https://aura-finance-tool.vercel.app',
    callback: 'https://aura-finance-tool.vercel.app/auth/callback'
  }
};

function createOAuthConfig() {
  const configPath = path.join(process.cwd(), 'oauth-config.json');
  
  const config = {
    environments,
    setupInstructions: {
      development: [
        '1. Go to Supabase Dashboard > Authentication > URL Configuration',
        '2. Set Site URL to: http://localhost:5173',
        '3. Add Redirect URLs: http://localhost:5173/auth/callback',
        '4. Save configuration'
      ],
      staging: [
        '1. Go to Supabase Dashboard > Authentication > URL Configuration',
        '2. Set Site URL to: https://aura-finance-app.vercel.app',
        '3. Add Redirect URLs: https://aura-finance-app.vercel.app/auth/callback',
        '4. Save configuration'
      ],
      production: [
        '1. Go to Supabase Dashboard > Authentication > URL Configuration',
        '2. Set Site URL to: https://aura-finance-tool.vercel.app',
        '3. Add Redirect URLs: https://aura-finance-tool.vercel.app/auth/callback',
        '4. Save configuration'
      ]
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ OAuth configuration file created: oauth-config.json');
  
  return config;
}

function displaySetupInstructions(config) {
  console.log('\n📋 OAuth Setup Instructions:');
  console.log('============================');
  
  Object.entries(config.environments).forEach(([env, details]) => {
    console.log(`\n🔧 ${details.name} Environment:`);
    console.log(`   URL: ${details.url}`);
    console.log(`   Callback: ${details.callback}`);
    
    console.log('\n   Setup Steps:');
    config.setupInstructions[env].forEach(step => {
      console.log(`   ${step}`);
    });
  });
}

function main() {
  try {
    const config = createOAuthConfig();
    displaySetupInstructions(config);
    
    console.log('\n✅ OAuth setup completed successfully!');
    console.log('📝 Review oauth-config.json for detailed configuration');
    
  } catch (error) {
    console.error('❌ OAuth setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createOAuthConfig, environments }; 