#!/usr/bin/env node

console.log(`
🔧 OAUTH FIX CHECKLIST
======================

📋 CURRENT STATUS:
   ✅ Code updated to use: https://aura-finance-tool.vercel.app
   ✅ Deployed to production
   ❌ OAuth providers still need updating

🎯 THE PROBLEM:
   Your OAuth providers (Google & GitHub) are still configured with old URLs,
   so they redirect to Vercel login instead of your app.

🔧 FIX REQUIRED (5 minutes):

1. GOOGLE OAUTH:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Change "Authorized JavaScript origins" to:
     • https://aura-finance-tool.vercel.app
     • http://localhost:5173
   - SAVE

2. GITHUB OAUTH:
   - Go to: https://github.com/settings/developers
   - Find your OAuth App
   - Change "Homepage URL" to: https://aura-finance-tool.vercel.app
   - SAVE

3. TEST:
   - Go to: https://aura-finance-tool.vercel.app/auth
   - Try logging in with Google or GitHub
   - Should work on both desktop and mobile

⚠️  IMPORTANT:
   - DO NOT change the Supabase callback URL
   - Only update the site URLs and JavaScript origins
   - Wait 5-10 minutes after saving for changes to take effect

✅ AFTER THIS:
   - OAuth will work permanently
   - No more Vercel login redirects
   - Works on all devices
`);
