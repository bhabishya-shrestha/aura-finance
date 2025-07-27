# Security Setup and Monitoring

This document outlines the security measures implemented for the Aura Finance project.

## GitGuardian Integration

### Local Setup

1. **Installation**: GitGuardian CLI is installed via Homebrew

   ```bash
   brew install gitguardian/tap/ggshield
   ```

2. **Authentication**: Authenticated with GitGuardian dashboard

   ```bash
   ggshield auth login
   ```

3. **Pre-push Hook**: Prevents pushing code with exposed secrets
   ```bash
   ggshield install --mode local -t pre-push
   ```

### Manual Scanning

Scan the entire repository for secrets:

```bash
ggshield secret scan repo .
```

Scan specific files:

```bash
ggshield secret scan path <file_path>
```

### GitHub Actions Integration

A GitHub Actions workflow (`.github/workflows/security-scan.yml`) automatically scans:

- All pushes to `main` and `develop` branches
- All pull requests to `main` and `develop` branches

**Setup Required**: Add `GITGUARDIAN_API_KEY` to GitHub repository secrets.

## Security Issues Resolved

### ✅ Fixed Issues

1. **Google OAuth2 Keys Exposure**
   - **File**: `scripts/configure-oauth.js`
   - **Fix**: Replaced hardcoded credentials with environment variables
   - **Status**: ✅ Resolved

2. **Demo Account Password Exposure**
   - **File**: `scripts/create-demo-account.js`
   - **Fix**: Use environment variables for sensitive data
   - **Status**: ✅ Resolved

3. **Repository Cleanup**
   - **Action**: Removed 20+ one-time OAuth setup scripts
   - **Kept**: Only essential scripts (deploy.sh, dev.sh, version.sh, configure-oauth.js, create-demo-account.js)
   - **Status**: ✅ Completed

## Environment Variables

### Required for OAuth Configuration

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Required for Demo Account

```bash
DEMO_EMAIL=test@gmail.com
DEMO_PASSWORD=your_demo_password
```

## Best Practices

### ✅ Implemented

- Environment variables for sensitive data
- Pre-push hooks to prevent secret leaks
- Automated security scanning in CI/CD
- Repository cleanup and maintenance

### 🔄 Ongoing

- Regular security scans
- Monitoring for new security issues
- Keeping dependencies updated

## Incident Response

If new security issues are detected:

1. **Immediate Action**: Remove exposed secrets from code
2. **Rotate Credentials**: Update any exposed API keys or tokens
3. **Document**: Update this file with incident details
4. **Prevent**: Add additional security measures as needed

## Resources

- [GitGuardian Documentation](https://docs.gitguardian.com/)
- [GitGuardian CLI Reference](https://docs.gitguardian.com/ggshield-docs/reference/)
- [GitHub Actions Integration](https://docs.gitguardian.com/ggshield-docs/integrations/cicd-integrations/github-actions)
- [Pre-push Hooks](https://docs.gitguardian.com/ggshield-docs/integrations/git-hooks/pre-push)

## Security Contacts

For security issues, please:

1. Create a private GitHub issue
2. Contact the development team
3. Do not post sensitive information in public channels
