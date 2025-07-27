# OAuth Setup Guide for Aura Finance

This guide will help you set up OAuth authentication providers (GitHub and Google) in your Supabase project.

## Prerequisites

- Supabase project created
- GitHub account (for GitHub OAuth)
- Google Cloud Console account (for Google OAuth)

## 1. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: `Aura Finance`
   - **Homepage URL**: `https://aura-finance-tool.vercel.app`
   - **Authorization callback URL**: `https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### Step 2: Configure GitHub OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** > **Providers**
3. Find **GitHub** and click **Enable**
4. Enter the **Client ID** and **Client Secret** from GitHub
5. Set **Redirect URL** to: `https://aura-finance-tool.vercel.app/auth/callback`
6. Click **Save**

## 2. Google OAuth Setup

### Step 1: Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Fill in the following details:
   - **Name**: `Aura Finance`
   - **Authorized JavaScript origins**:
     - `https://aura-finance-tool.vercel.app`
     - `http://localhost:5173` (for development)
   - **Authorized redirect URIs**:
     - `https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback`
     - `https://aura-finance-tool.vercel.app/auth/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Enable**
4. Enter the **Client ID** and **Client Secret** from Google
5. Set **Redirect URL** to: `https://aura-finance-tool.vercel.app/auth/callback`
6. Click **Save**

## 3. Environment Variables

Make sure your `.env` file contains the correct Supabase URL and anon key:

```env
VITE_SUPABASE_URL=https://mdpfwvqpwkiojnzpctou.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 4. Testing OAuth

### Local Development

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Go to `http://localhost:5173/auth`

3. Test both OAuth providers:
   - Click "Continue with GitHub"
   - Click "Continue with Google"

### Production

1. Deploy to Vercel:

   ```bash
   vercel --prod
   ```

2. Test OAuth at `https://aura-finance-tool.vercel.app/auth`

## 5. Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in Supabase matches exactly
   - Check for trailing slashes or protocol mismatches

2. **"Client ID not found" error**
   - Verify the Client ID is correctly copied from GitHub/Google
   - Check that the OAuth app is properly configured

3. **"Callback URL mismatch" error**
   - Ensure the callback URL in your OAuth provider matches Supabase
   - For GitHub: `https://mdpfwvqpwkiojnzpctou.supabase.co/auth/v1/callback`
   - For Google: Same as GitHub

4. **Session not persisting**
   - Check that `persistSession: true` is set in Supabase client
   - Verify browser storage is not blocked

### Debug Steps

1. Check browser console for errors
2. Verify Supabase Auth settings
3. Test with email/password authentication first
4. Check network tab for failed requests

## 6. Security Considerations

- Never commit OAuth secrets to version control
- Use environment variables for all sensitive data
- Regularly rotate OAuth client secrets
- Monitor OAuth usage in Supabase dashboard
- Implement proper error handling for OAuth failures

## 7. Additional OAuth Providers

To add more OAuth providers (Discord, Twitter, etc.):

1. Follow the same pattern as GitHub/Google
2. Add the provider configuration in Supabase
3. Update the `LoginForm.jsx` component with new buttons
4. Test thoroughly before deploying

## Support

If you encounter issues:

1. Check the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. Review the [OAuth Provider Documentation](https://supabase.com/docs/guides/auth/social-login/auth-github)
3. Check the browser console for detailed error messages
4. Verify all URLs and credentials are correct
