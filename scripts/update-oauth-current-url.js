#!/usr/bin/env node

console.log(`
🔧 UPDATE OAUTH CONFIGURATIONS - CURRENT DEPLOYMENT
==================================================

📋 CURRENT VERCELL URL:
   https://aura-finance-8w7dmobl5-bhabishya-shresthas-projects.vercel.app

🚨 IMPORTANT: DO NOT CHANGE SUPABASE CALLBACK URL
   It should ALWAYS remain: https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback

🔧 WHAT YOU NEED TO UPDATE:

1. SUPABASE AUTH CONFIGURATION:
   Go to: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/url-configuration
   
   ✅ CHANGE SITE URL TO:
   https://aura-finance-8w7dmobl5-bhabishya-shresthas-projects.vercel.app
   
   ✅ CHANGE REDIRECT URLS TO:
   - https://aura-finance-8w7dmobl5-bhabishya-shresthas-projects.vercel.app
   - http://localhost:5173
   
   ❌ DO NOT CHANGE:
   - The Supabase callback URL (leave it as is)

2. GOOGLE OAUTH CONFIGURATION:
   Go to: https://console.cloud.google.com/apis/credentials
   
   ✅ CHANGE AUTHORIZED JAVASCRIPT ORIGINS TO:
   - https://aura-finance-8w7dmobl5-bhabishya-shresthas-projects.vercel.app
   - http://localhost:5173
   
   ✅ KEEP AUTHORIZED REDIRECT URIS AS:
   - https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback (DO NOT CHANGE)

3. GITHUB OAUTH CONFIGURATION:
   Go to: https://github.com/settings/developers
   
   ✅ CHANGE HOMEPAGE URL TO:
   https://aura-finance-8w7dmobl5-bhabishya-shresthas-projects.vercel.app
   
   ✅ KEEP AUTHORIZATION CALLBACK URL AS:
   - https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback (DO NOT CHANGE)

🎯 WHY THIS FIXES THE PHONE ISSUE:
- Your phone was trying to redirect to an old URL that no longer exists
- The new deployment URL is now correctly configured
- OAuth will work on both desktop and mobile

✅ AFTER MAKING THESE CHANGES:
- Test OAuth at: https://aura-finance-8w7dmobl5-bhabishya-shresthas-projects.vercel.app/auth
- Should work on both MacBook and phone
- No more Vercel login redirects

⚠️  REMEMBER:
- Supabase callback URL is FIXED and should NEVER be changed
- Only change the site URLs and JavaScript origins
- Clear browser cache on your phone if issues persist
`);
