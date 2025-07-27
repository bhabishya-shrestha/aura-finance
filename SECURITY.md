# Security Guide - Aura Finance

## 🔒 Security Considerations for Public Repository

This is a **public GitHub repository**. Please ensure you never commit sensitive information.

## 🚨 Never Commit These Files

- `.env` files (any environment files)
- API keys or secrets
- Database connection strings
- Personal information
- Private keys or certificates
- Access tokens

## ✅ Safe to Commit

- Configuration templates (without real values)
- Documentation
- Code files
- Build configurations
- Test files

## 🔧 Environment Variables

### Required for Development

Create a `.env` file locally (never commit this):

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
VITE_APP_NAME=Aura Finance
VITE_APP_VERSION=0.1.0
```

### For Production Deployment

Set environment variables in your deployment platform (Vercel, etc.) through their dashboard, not in code.

## 🛡️ Security Best Practices

### 1. Environment Variables

- ✅ Use `.env` files locally (in `.gitignore`)
- ✅ Set production env vars in deployment platform
- ❌ Never hardcode secrets in code
- ❌ Never commit `.env` files

### 2. Database Security

- ✅ Use Row Level Security (RLS) in Supabase
- ✅ Use environment variables for connection strings
- ❌ Never expose database credentials

### 3. API Keys

- ✅ Use Supabase anon key (public, safe to expose)
- ❌ Never expose service role keys
- ❌ Never expose admin credentials

### 4. Authentication

- ✅ Use Supabase Auth (handles security)
- ✅ Implement proper session management
- ❌ Never store passwords in plain text

## 🔍 Security Checklist

Before committing code:

- [ ] No `.env` files in repository
- [ ] No hardcoded API keys
- [ ] No database connection strings
- [ ] No personal information
- [ ] No private keys or certificates
- [ ] Environment variables use placeholder values
- [ ] Documentation doesn't contain real credentials

## 🚀 Deployment Security

### Vercel

- Set environment variables in Vercel dashboard
- Use Vercel's built-in security features
- Enable automatic security scanning

### Supabase

- Use anon key for client-side operations
- Keep service role key secure (server-side only)
- Enable RLS on all tables
- Use proper authentication policies

## 📞 Security Issues

If you accidentally commit sensitive information:

1. **Immediately** revoke/rotate the exposed credentials
2. **Remove** the sensitive data from git history
3. **Update** any affected services
4. **Review** the repository for other potential exposures

## 🔐 Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Supabase Security Documentation](https://supabase.com/docs/guides/security)
- [Vercel Security Documentation](https://vercel.com/docs/security)
