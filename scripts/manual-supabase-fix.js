#!/usr/bin/env node

console.log(`
🔧 Manual Supabase Auth Configuration Fix
=========================================

🚨 ISSUE: OAuth redirects to localhost:3000 instead of Vercel URL

📋 ROOT CAUSE:
Your Supabase auth configuration has incorrect site_url and redirect URLs.

🔧 MANUAL FIX STEPS:

1. GO TO SUPABASE DASHBOARD:
   https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/url-configuration

2. UPDATE SITE URL:
   Change from: http://127.0.0.1:3000
   Change to: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app

3. UPDATE REDIRECT URLS:
   Remove: https://127.0.0.1:3000
   Add: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app
   Add: http://localhost:5173 (for local development)

4. SAVE THE CONFIGURATION

🎯 WHAT THIS FIXES:
- OAuth will redirect to your Vercel deployment instead of localhost:3000
- Local development will still work with localhost:5173
- Production OAuth flow will complete successfully

✅ AFTER THE FIX:
- Test OAuth at: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth
- Both GitHub and Google OAuth should work correctly
- No more localhost:3000 redirects

🔗 USEFUL LINKS:
- Supabase Auth Config: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/url-configuration
- Current Vercel URL: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app
- Auth Page: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth
`);
