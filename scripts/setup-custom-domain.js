#!/usr/bin/env node

console.log(`
🌐 Custom Domain Setup Guide
============================

🚨 PROBLEM: Vercel deployment URLs change with each deployment
💡 SOLUTION: Set up a custom domain for consistent OAuth redirects

📋 CURRENT SITUATION:
- Your OAuth is configured for: https://aura-finance-tool.vercel.app
- Your actual deployment is at: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app
- This mismatch is causing OAuth failures

🔧 OPTION 1: Set up Custom Domain (RECOMMENDED)

1. Go to Vercel Dashboard:
   https://vercel.com/dashboard

2. Select your aura-finance project

3. Go to Settings > Domains

4. Add a custom domain:
   - aura-finance-tool.vercel.app (if available)
   - Or use your own domain if you have one

5. Update OAuth configurations to use the custom domain

🔧 OPTION 2: Update OAuth for Current URL (QUICK FIX)

If you prefer to use the current deployment URL:

1. Update Supabase OAuth redirect URLs to:
   https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback

2. Update Google OAuth redirect URIs to:
   https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback

3. Update GitHub OAuth callback URL to:
   https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth/callback

⚠️  WARNING: Option 2 will break again on next deployment!

🎯 RECOMMENDED APPROACH:
1. Set up a custom domain in Vercel
2. Update all OAuth configurations to use the custom domain
3. This will provide a stable URL that won't change with deployments

🔗 Useful Links:
- Vercel Domains: https://vercel.com/dashboard
- Supabase Auth: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/providers
- Google OAuth: https://console.cloud.google.com/apis/credentials
- GitHub OAuth: https://github.com/settings/developers
`);
