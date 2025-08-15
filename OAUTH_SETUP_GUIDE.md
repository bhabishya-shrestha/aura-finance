# OAuth Setup Guide for Aura Finance

## Issue Description

The OAuth Google sign-in is redirecting back to the login page instead of the dashboard after successful authentication. This is typically caused by incorrect OAuth redirect URL configuration in Firebase Console.

## Current Status

✅ **Fixed**: MIME type error (module loading issue)  
❌ **Issue**: OAuth redirect not working properly  
✅ **Fixed**: OAuth callback route added  
✅ **Fixed**: Enhanced error handling and debugging

## Required Firebase Console Configuration

### Step 1: Configure Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `aura-finance-9777a`
3. Navigate to **Authentication > Settings**
4. In the **Authorized domains** section, add:
   - `localhost`
   - `127.0.0.1`
   - Your production domain (if applicable)

### Step 2: Configure Google OAuth Redirect URIs

1. In Firebase Console, go to **Authentication > Sign-in method**
2. Click on **Google** provider
3. In the **Authorized redirect URIs** section, add:
   - `http://localhost:5173`
   - `http://localhost:5173/auth/callback`
   - Your production URLs (if applicable):
     - `https://your-domain.com`
     - `https://your-domain.com/auth/callback`

### Step 3: Verify Environment Variables

Ensure your `.env` file contains:

```env
VITE_ENABLE_OAUTH=true
VITE_FIREBASE_API_KEY=AIzaSyC_ICx4SVrBqBni6XI4hKAlVddzycQbyY0
VITE_FIREBASE_AUTH_DOMAIN=aura-finance-9777a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aura-finance-9777a
VITE_FIREBASE_STORAGE_BUCKET=aura-finance-9777a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=5775045267
VITE_FIREBASE_APP_ID=1:5775045267:web:5560ff93790423c1629366
```

## Testing the OAuth Flow

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Browser Console

- Open `http://localhost:5173`
- Open browser developer tools (F12)
- Go to Console tab

### 3. Test OAuth Sign-in

- Go to the login page
- Click "Continue with Google"
- Watch the console for debugging information

### Expected Console Output

```
🔐 OAuth configuration recommendations: [...]
🚀 Starting Google OAuth sign-in...
🔐 OAuth Provider configured with redirect_uri: http://localhost:5173/auth/callback
📱 Calling signInWithRedirect...
✅ signInWithRedirect completed - user should be redirected to Google
🔄 Checking for OAuth redirect result...
✅ OAuth redirect result received: [user-email]
🔄 Auth state changed: [user-email]
✅ User authenticated: [user-email]
🔄 OAuth Callback - Auth State: {isAuthenticated: true, isLoading: false, isInitialized: true}
✅ OAuth Callback - User authenticated, redirecting to dashboard
```

## Troubleshooting

### If OAuth Still Redirects to Login Page

1. **Check Firebase Console Configuration**
   - Verify authorized domains include `localhost`
   - Verify redirect URIs include `http://localhost:5173/auth/callback`

2. **Check Browser Console for Errors**
   - Look for authentication errors
   - Check for CORS errors
   - Verify redirect result is being received

3. **Test with Different Browser**
   - Try incognito/private mode
   - Clear browser cache and cookies

4. **Verify OAuth Provider Settings**
   - Ensure Google OAuth is enabled in Firebase Console
   - Check that the OAuth client ID is correct

### Common Issues and Solutions

#### Issue: "OAuth is not enabled"

**Solution**: Set `VITE_ENABLE_OAUTH=true` in `.env` file

#### Issue: "Invalid Firebase auth domain"

**Solution**: Verify `VITE_FIREBASE_AUTH_DOMAIN` matches your Firebase project

#### Issue: "Unauthorized domain"

**Solution**: Add `localhost` and `127.0.0.1` to authorized domains in Firebase Console

#### Issue: "Redirect URI mismatch"

**Solution**: Add `http://localhost:5173/auth/callback` to authorized redirect URIs

## Code Changes Made

### 1. Added OAuth Callback Route

- **File**: `src/App.jsx`
- **Change**: Added `/auth/callback` route with proper handling

### 2. Enhanced OAuth Configuration

- **File**: `src/contexts/FirebaseAuthContext.jsx`
- **Change**: Added explicit redirect URI and improved redirect result handling

### 3. Improved Debugging

- **File**: `src/utils/localhostConfig.js`
- **Change**: Added OAuth validation and debugging functions

### 4. Enhanced Login Form

- **File**: `src/components/auth/LoginForm.jsx`
- **Change**: Added OAuth configuration validation

## Next Steps

1. **Configure Firebase Console** as described above
2. **Test the OAuth flow** using the testing steps
3. **Monitor console output** for debugging information
4. **Report any remaining issues** with specific error messages

## Support

If you continue to experience issues after following this guide:

1. Check the browser console for specific error messages
2. Verify all Firebase Console settings are correct
3. Test with a different browser or incognito mode
4. Ensure the development server is running on `localhost:5173`
