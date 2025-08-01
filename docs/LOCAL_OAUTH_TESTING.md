# Local OAuth Testing Guide

## Overview

This guide explains how to test OAuth functionality locally without redirecting to production URLs.

## Current Setup

Your Supabase project is configured to allow OAuth redirects to:
- `https://aura-finance-tool.vercel.app` (production)
- `http://localhost:5173` (local development)

## Testing OAuth Locally

### 1. Start Local Development Server

```bash
./scripts/dev-local.sh
```

### 2. Test OAuth Flow

1. Open http://localhost:5173 in your browser
2. Click "Sign in with GitHub" or "Sign in with Google"
3. Complete the OAuth flow
4. You should be redirected back to `http://localhost:5173/auth/callback`
5. The app should handle the callback and redirect to the dashboard

### 3. Troubleshooting OAuth Issues

#### Issue: Redirect to Production URL
**Cause**: OAuth provider configuration still points to production
**Solution**: 
- Check your OAuth provider settings (GitHub/Google)
- Ensure localhost:5173 is in the allowed redirect URLs
- Clear browser cache and cookies

#### Issue: "Invalid redirect URL" Error
**Cause**: Supabase doesn't recognize the redirect URL
**Solution**:
- Verify `http://localhost:5173` is in your Supabase auth settings
- Check that the URL exactly matches (no trailing slash)

#### Issue: Session Not Persisting
**Cause**: Local storage or cookie issues
**Solution**:
- Clear browser storage for localhost:5173
- Check browser console for errors
- Verify environment variables are loaded correctly

### 4. Alternative Testing Methods

#### Method 1: Use Demo Account
```bash
# Create demo account
npm run demo:setup

# Use credentials:
# Email: test@gmail.com
# Password: demo123
```

#### Method 2: Mock OAuth (Development Only)
For testing without OAuth, you can temporarily modify the auth flow to skip OAuth and use email/password only.

#### Method 3: Use Production OAuth with Local Development
1. Start local server: `./scripts/dev-local.sh`
2. Use OAuth providers (will redirect to production)
3. After OAuth, manually navigate back to localhost:5173
4. The session should still be valid

## Environment Variables

Make sure your `.env.local` file contains:

```env
VITE_SUPABASE_URL=https://mdpfwvqpwkiojnzpctou.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_GEMINI_API_KEY=your_gemini_key_optional
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

## Testing Checklist

- [ ] Local server starts without errors
- [ ] Environment variables load correctly
- [ ] OAuth buttons are visible and functional
- [ ] OAuth flow completes successfully
- [ ] User is redirected to dashboard after OAuth
- [ ] Session persists across page refreshes
- [ ] Demo account works as fallback
- [ ] All features work with authenticated user

## Debugging

### Browser Console
Check for:
- Network errors
- JavaScript errors
- OAuth-related errors

### Network Tab
Monitor:
- OAuth redirects
- API calls to Supabase
- Session management

### Application Tab
Check:
- Local storage
- Session storage
- Cookies

## Common Issues and Solutions

### Issue: "OAuth provider not configured"
**Solution**: Check Supabase dashboard > Authentication > Providers

### Issue: "Invalid client ID"
**Solution**: Verify OAuth app configuration in GitHub/Google

### Issue: "Redirect URI mismatch"
**Solution**: Add `http://localhost:5173` to OAuth provider settings
