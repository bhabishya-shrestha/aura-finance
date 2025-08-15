# Localhost Login Troubleshooting Guide

This guide helps resolve login issues that occur on localhost but not on the hosted version.

## 🔍 Quick Diagnosis

When you encounter login issues on localhost, the app will automatically detect and display configuration problems. Look for:

1. **Yellow warning box** on the login page with specific issues
2. **Browser console logs** with detailed debugging information
3. **Error messages** in the authentication flow

## 🚨 Common Localhost Login Issues

### 1. Missing Environment Variables
**Symptoms:** OAuth button doesn't work, Firebase errors
**Solution:** Ensure `.env` file exists with correct Firebase configuration

```bash
# Check if .env file exists
ls -la .env

# If missing, copy from example
cp env.example .env
```

### 2. OAuth Not Enabled
**Symptoms:** Google OAuth button shows error or doesn't work
**Solution:** Set OAuth flag in `.env` file

```env
VITE_ENABLE_OAUTH=true
```

### 3. Firebase Auth Domain Issues
**Symptoms:** "Unauthorized domain" errors
**Solution:** Verify Firebase Console settings

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Add these domains:
   - `localhost`
   - `127.0.0.1`

### 4. OAuth Redirect URL Issues
**Symptoms:** OAuth redirect fails or loops
**Solution:** Configure OAuth redirect URLs in Firebase Console

1. Go to **Authentication** > **Sign-in method**
2. Edit **Google** provider
3. Add redirect URLs:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`

### 5. CORS Issues
**Symptoms:** "Cross-Origin-Opener-Policy" errors
**Solution:** The app now uses `signInWithRedirect` instead of `signInWithPopup` to avoid CORS issues

## 🔧 Step-by-Step Fix

### Step 1: Verify Environment Configuration

Check your `.env` file has all required variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OAuth Configuration
VITE_ENABLE_OAUTH=true
```

### Step 2: Check Firebase Console Settings

1. **Authorized Domains:**
   - Go to Authentication > Settings > Authorized domains
   - Add: `localhost`, `127.0.0.1`

2. **OAuth Redirect URLs:**
   - Go to Authentication > Sign-in method > Google
   - Add: `http://localhost:5173`, `http://127.0.0.1:5173`

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Clear Browser Data

1. Open browser developer tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## 🐛 Debugging Tools

### Automatic Debugging

The app includes automatic debugging for localhost:

1. **Login Page Warnings:** Yellow boxes show detected issues
2. **Console Logs:** Detailed debugging information
3. **Error Messages:** Specific Firebase error codes and solutions

### Manual Debugging

Run the debug function in browser console:

```javascript
// Import the debug function
import { debugLocalhostAuth } from './src/utils/localhostConfig.js';

// Run debugging
debugLocalhostAuth();
```

### Debug Script

Use the included debug script:

```bash
node debug-localhost-login.js
```

## 📋 Environment Variables Checklist

Ensure these variables are set in your `.env` file:

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_ENABLE_OAUTH=true`

## 🔐 Firebase Console Checklist

Verify these settings in Firebase Console:

- [ ] **Authentication** > **Sign-in method** > **Google** is enabled
- [ ] **Authentication** > **Settings** > **Authorized domains** includes `localhost`
- [ ] **Authentication** > **Sign-in method** > **Google** > **Web SDK configuration** has correct redirect URLs

## 🚀 Testing the Fix

1. **Clear browser cache and cookies**
2. **Restart development server**
3. **Try email/password login first**
4. **Then try Google OAuth**
5. **Check browser console for any remaining errors**

## 📞 Getting Help

If issues persist:

1. **Check browser console** for specific error messages
2. **Run debug function** in console: `debugLocalhostAuth()`
3. **Verify Firebase Console** settings match this guide
4. **Check network tab** for failed requests
5. **Try incognito/private browsing** to rule out browser extensions

## 🔄 Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Firebase Console |
| `auth/redirect-cancelled-by-user` | User cancelled OAuth | Normal behavior, try again |
| `auth/redirect-operation-pending` | OAuth already in progress | Wait or refresh page |
| `auth/invalid-api-key` | Wrong API key | Check `.env` file |
| `auth/auth-domain-config-required` | Missing auth domain | Check Firebase config |

## 🎯 Success Indicators

When localhost login is working correctly:

- ✅ No yellow warning boxes on login page
- ✅ Google OAuth button works without errors
- ✅ Email/password login works
- ✅ No CORS errors in console
- ✅ Successful redirect after OAuth
- ✅ User profile created/updated in Firestore
