# GitHub Token Setup Guide

This guide will help you set up persistent GitHub token configuration for the Aura Finance project, eliminating the need to export tokens manually for each operation.

## 🚀 Quick Setup

### 1. Get Your GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Aura Finance Development")
4. Set expiration (recommended: 90 days)
5. Select these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `admin:org` (Full control of orgs and teams)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

### 2. Set Up Persistent Token

Run the setup script with your token:

```bash
./scripts/setup-github-token.sh YOUR_GITHUB_TOKEN_HERE
```

This will:

- ✅ Validate your token
- ✅ Set up Git credentials
- ✅ Create environment files
- ✅ Configure shell profile
- ✅ Create validation and refresh scripts

### 3. Restart Terminal

Restart your terminal or run:

```bash
source ~/.bashrc  # or ~/.zshrc if using zsh
```

### 4. Verify Setup

Test that everything is working:

```bash
./scripts/setup-github-token.sh validate
```

## 📋 Available Commands

### Token Management

```bash
# Set up token (one-time setup)
./scripts/setup-github-token.sh YOUR_TOKEN

# Validate current token
./scripts/setup-github-token.sh validate

# Refresh/update token
./scripts/setup-github-token.sh refresh NEW_TOKEN
```

### GitHub Workflow

```bash
# Complete workflow (create PR, merge, release, deploy)
./scripts/github-workflow.sh complete [version] [feature-name]

# Create pull request only
./scripts/github-workflow.sh create-pr "Title" "Description" "branch-name"

# Merge pull request
./scripts/github-workflow.sh merge-pr PR_NUMBER

# Validate token
./scripts/github-workflow.sh validate
```

### Legacy Commands (Still Work)

```bash
# Create PR (now uses persistent token)
./create-pr-with-token.sh

# Release (now uses persistent token)
./scripts/release.sh [patch|minor|major]
```

## 🔄 Complete Workflow Example

Here's how to use the complete workflow for a new feature:

```bash
# 1. Set up token (one-time)
./scripts/setup-github-token.sh YOUR_TOKEN

# 2. Make your code changes
# ... edit files ...

# 3. Run complete workflow
./scripts/github-workflow.sh complete minor mobile-optimization
```

This will:

1. ✅ Create a feature branch
2. ✅ Run tests and build
3. ✅ Commit and push changes
4. ✅ Create a pull request
5. ✅ Wait for your confirmation
6. ✅ Merge the PR
7. ✅ Create a release
8. ✅ Deploy to production

## 🔧 Configuration Files Created

The setup script creates these files (automatically added to `.gitignore`):

- `.env` - Environment variables
- `.github-env` - Project-specific GitHub environment
- `.git-credentials` - Git authentication
- Token validation and refresh are now built into `setup-github-token.sh`

## 🛡️ Security Features

- ✅ Tokens are stored in `.gitignore` files
- ✅ Automatic token validation
- ✅ Secure credential storage
- ✅ Project-specific configuration
- ✅ Easy token refresh process

## 🚨 Troubleshooting

### Token Not Found

```bash
./scripts/setup-github-token.sh YOUR_TOKEN
```

### Invalid Token

1. Check if token is expired
2. Verify scopes are correct
3. Generate a new token if needed

### Permission Denied

1. Ensure token has correct scopes
2. Check if you have access to the repository
3. Verify organization permissions

### Script Not Found

```bash
chmod +x scripts/*.sh
```

## 📚 Additional Resources

- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub API Authentication](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)
- [Git Credential Storage](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage)

## 🎯 Next Steps

After setting up your token:

1. **Test the setup**: `./scripts/setup-github-token.sh validate`
2. **Create your first PR**: `./scripts/github-workflow.sh complete patch test-feature`
3. **Review the workflow**: Check the created PR in your browser
4. **Deploy to production**: The workflow will automatically deploy to Vercel

## 🔄 Token Refresh

When your token expires:

1. Generate a new token on GitHub
2. Run: `./scripts/setup-github-token.sh refresh NEW_TOKEN`
3. Restart your terminal

That's it! Your token is now persistent and will be automatically available for all GitHub operations.
