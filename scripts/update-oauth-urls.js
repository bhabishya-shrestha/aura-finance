#!/usr/bin/env node

console.log(`
🔧 OAuth Redirect URL Update Guide
==================================

🚨 ISSUE: OAuth redirects are going to localhost instead of Vercel domain

📋 REQUIRED UPDATES:

1. SUPABASE DASHBOARD:
   Go to: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/providers
   
   For GitHub OAuth:
   - Redirect URL: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback
   
   For Google OAuth:
   - Redirect URL: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback

2. GOOGLE CLOUD CONSOLE:
   Go to: https://console.cloud.google.com/apis/credentials
   
   Find your OAuth 2.0 Client ID and add to Authorized redirect URIs:
   - https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback

3. GITHUB OAuth APP:
   Go to: https://github.com/settings/developers
   
   Update Authorization callback URL to:
   - https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback

4. REMOVE LOCALHOST URLs:
   Remove any localhost URLs from the redirect configurations
   - http://localhost:5173/auth/callback (remove this)

✅ After making these changes:
- OAuth will redirect to the correct Vercel domain
- Authentication will work properly in production
- Local development will still work with localhost

🔗 Current Vercel URL: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app
`);
