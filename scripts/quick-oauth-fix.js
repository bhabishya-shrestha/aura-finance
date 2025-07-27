#!/usr/bin/env node

/**
 * Quick OAuth Fix for Aura Finance
 *
 * This script shows the exact URLs you need to configure in your OAuth providers.
 */

console.log(`
🔧 QUICK OAUTH FIX FOR AURA FINANCE
=====================================

🚨 THE ISSUE:
Your OAuth providers (Google/GitHub) are pointing to the wrong callback URLs.

✅ THE SOLUTION:
Update your OAuth providers to use the Supabase callback URL.

🔗 REQUIRED URLS:

SUPABASE CALLBACK URL (FIXED - DO NOT CHANGE):
https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback

📋 STEP-BY-STEP FIX:

1. GOOGLE OAUTH:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Set "Authorized redirect URIs" to:
     https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback
   - Remove any old URLs (localhost, old Vercel domains)
   - Click "Save"

2. GITHUB OAUTH:
   - Go to: https://github.com/settings/developers
   - Click on your OAuth App
   - Set "Authorization callback URL" to:
     https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback
   - Remove any old URLs
   - Click "Update application"

3. VERIFY SUPABASE (DO NOT CHANGE):
   - Go to: https://app.supabase.com/project/mdpfwvqpwkiojnzpctou/auth/providers
   - Verify GitHub and Google OAuth are enabled
   - Verify redirect URLs are: https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback
   - DO NOT CHANGE these URLs

🎯 HOW IT WORKS:
1. User clicks "Login with Google/GitHub"
2. Redirects to Google/GitHub OAuth
3. Google/GitHub redirects to Supabase callback
4. Supabase processes authentication
5. Supabase redirects to your Vercel app

✅ AFTER FIX:
- OAuth will work on both localhost and production
- No more "redirect_uri_mismatch" errors
- Authentication flow completes successfully

🧪 TEST:
- Go to: https://aura-finance-qz9vfyerc-bhabishya-shresthas-projects.vercel.app/auth
- Try logging in with Google or GitHub
- Should work without errors

⚠️ IMPORTANT:
- DO NOT change Supabase callback URLs
- Only update Google and GitHub OAuth settings
- Wait 5-10 minutes for changes to propagate
- Clear browser cache if needed
`);

// Check if running directly
if (require.main === module) {
  console.log("\n✅ Quick fix guide displayed above.");
  console.log("Follow the steps to fix your OAuth configuration.\n");
}
