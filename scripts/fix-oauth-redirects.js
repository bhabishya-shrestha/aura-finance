#!/usr/bin/env node

console.log(`
🔧 OAuth Redirect Configuration - CORRECT SETUP
===============================================

✅ SUPABASE CALLBACK URL (FIXED - DO NOT CHANGE):
   https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback

📋 UPDATE YOUR OAUTH PROVIDERS:

1. GOOGLE CLOUD CONSOLE:
   Go to: https://console.cloud.google.com/apis/credentials
   
   Find your OAuth 2.0 Client ID and set Authorized redirect URIs to:
   ✅ https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback
   
   ❌ REMOVE: http://localhost:5173/auth/callback
   ❌ REMOVE: https://aura-finance-tool.vercel.app/auth/callback

2. GITHUB OAUTH APP:
   Go to: https://github.com/settings/developers
   
   Set Authorization callback URL to:
   ✅ https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback
   
   ❌ REMOVE: http://localhost:5173/auth/callback
   ❌ REMOVE: https://aura-finance-tool.vercel.app/auth/callback

🎯 HOW IT WORKS:
1. User clicks "Login with Google/GitHub"
2. Redirects to Google/GitHub OAuth
3. Google/GitHub redirects to Supabase callback
4. Supabase processes authentication
5. Supabase redirects to your Vercel app

✅ After these changes, OAuth will work correctly on both:
   - Local development (localhost)
   - Production (Vercel)
`);
