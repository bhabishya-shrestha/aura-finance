# Aura Finance Deployment Guide

## Overview

This project is deployed using **Vercel** (frontend) + **Supabase** (database & auth) for a **$0/month** cost.

## Architecture

- **Frontend**: React + Vite deployed on Vercel
- **Database**: PostgreSQL on Supabase (free tier)
- **Authentication**: Supabase Auth
- **API**: Direct Supabase client calls (no separate backend needed)

## Free Tier Limits

### Vercel

- 100GB bandwidth/month
- 100 serverless function executions/day
- Perfect for personal finance apps

### Supabase

- 500MB database
- 50,000 monthly active users
- 2GB bandwidth
- Real-time subscriptions included

## Setup Instructions

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose "Free" plan
4. Select region closest to you (US East for Austin, TX)
5. Wait for project to be created

### 2. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL
   - Anon/Public key

### 3. Set Environment Variables

**⚠️ SECURITY WARNING: This is a public repository. Never commit your `.env` file!**

Create a `.env` file in the root directory (this file is already in `.gitignore`):

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_NAME=Aura Finance
VITE_APP_VERSION=0.1.0
```

**For Production**: Set these environment variables in your Vercel dashboard, not in code.

### 4. Deploy Database Schema

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your_project_ref

# Push the database schema
supabase db push
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy
./scripts/deploy.sh
```

Or manually:

```bash
npm run build
vercel --prod
```

## Security Features

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access their own data
- Automatic user isolation

### Authentication

- Email/password authentication
- Session management
- Secure token handling

### Environment Variables

- All sensitive data in environment variables
- No hardcoded secrets
- Proper separation of concerns

## Cost Monitoring

### Vercel

- Monitor usage in Vercel dashboard
- Free tier is generous for personal projects

### Supabase

- Monitor usage in Supabase dashboard
- Free tier includes:
  - 500MB database storage
  - 50,000 monthly active users
  - 2GB bandwidth

## 🔒 Security Considerations

### Public Repository Safety

- **Never commit `.env` files** - they're already in `.gitignore`
- **Use placeholder values** in documentation
- **Set real credentials** only in deployment platforms
- **Review all commits** for sensitive information

### Environment Variables

- **Development**: Use `.env` file locally (not committed)
- **Production**: Set in Vercel dashboard
- **Supabase**: Use anon key (public) for client-side operations

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Ensure `.env` file exists
   - Check Vercel environment variables

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies

3. **Build Failures**
   - Check for missing dependencies
   - Verify Vite configuration

### Support

- Vercel: [https://vercel.com/support](https://vercel.com/support)
- Supabase: [https://supabase.com/support](https://supabase.com/support)

## Migration from Local Development

If you're migrating from local development:

1. **Export local data** (if any)
2. **Set up Supabase project**
3. **Import data** using Supabase dashboard
4. **Update environment variables**
5. **Deploy to Vercel**

## Future Scaling

When you need to scale beyond free tiers:

### Vercel Pro ($20/month)

- Unlimited bandwidth
- More serverless functions
- Team collaboration

### Supabase Pro ($25/month)

- 8GB database
- 100,000 monthly active users
- Priority support

Total cost for scaling: ~$45/month (still very reasonable for a production app)
