# 🚀 Professional Development Pipeline

## Overview

This document establishes the proper development workflow for Aura Finance, addressing all critical issues and ensuring professional software engineering practices.

## 🏗️ Branch Strategy

### Main Branches

- **`main`** - Production-ready code (deploys to `aura-finance-tool.vercel.app`)
- **`develop`** - Development/staging code (deploys to `aura-finance-app.vercel.app`)

### Feature Branches

- **`feature/*`** - New features and enhancements
- **`fix/*`** - Bug fixes and patches
- **`hotfix/*`** - Critical production fixes
- **`release/*`** - Release preparation

## 🔄 Development Workflow

### 1. Feature Development

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Development work...
git add .
git commit -m "feat: descriptive commit message"

# Push and create PR
git push origin feature/your-feature-name
gh pr create --base develop --title "feat: your feature title"
```

### 2. Local Testing (MANDATORY - No OAuth)

```bash
# Run local tests before pushing
npm run test:local
npm run lint
npm run build
npm run test:build
```

**Note**: Local testing excludes OAuth functionality due to Supabase configuration constraints.

### 3. PR Process

1. **Create PR to `develop`** (not main)
2. **All CI/CD checks must pass**
3. **Code review required**
4. **Local testing verification** (excluding OAuth)
5. **Merge to `develop`**

### 4. Staging Deployment & Testing

- `develop` branch automatically deploys to `aura-finance-app.vercel.app`
- **MANDATORY**: Test in staging environment
- **MANDATORY**: Verify OAuth and all integrations work
- **MANDATORY**: Test all features and user flows

### 5. Production Release

```bash
# Create release PR from develop to main
git checkout main
git pull origin main
git checkout -b release/v1.x.x
git merge develop
git push origin release/v1.x.x
gh pr create --base main --title "release: v1.x.x"
```

## 🧪 Testing Requirements

### Local Testing (MANDATORY - Excludes OAuth)

```bash
# Complete test suite (excluding OAuth)
npm run test:local

# Individual test categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security
```

### Staging Testing (MANDATORY)

- **OAuth Authentication**: Test login/logout flows
- **All Features**: Dashboard, transactions, analytics, settings
- **Mobile Responsiveness**: Test on different screen sizes
- **Performance**: Page load times and responsiveness
- **Error Handling**: Test error scenarios and edge cases

### CI/CD Pipeline

- **Linting**: ESLint + Prettier
- **Unit Tests**: Vitest
- **Integration Tests**: API and database
- **Security Audit**: npm audit + custom checks
- **Build Test**: Production build verification

## 🔧 Environment Configuration

### Development Environment (Local)

```bash
# Local development (OAuth disabled)
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_GEMINI_API_KEY=your_prod_gemini_key
```

### Staging Environment

```bash
# Staging (develop branch)
VITE_APP_ENV=staging
VITE_APP_URL=https://aura-finance-app.vercel.app
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_GEMINI_API_KEY=your_prod_gemini_key
```

### Production Environment

```bash
# Production (main branch)
VITE_APP_ENV=production
VITE_APP_URL=https://aura-finance-tool.vercel.app
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_GEMINI_API_KEY=your_prod_gemini_key
```

## 🔐 OAuth Configuration

### Supabase OAuth Setup

Due to Supabase configuration constraints, OAuth is only tested in staging and production:

1. **Staging**: `https://aura-finance-app.vercel.app/auth/callback`
2. **Production**: `https://aura-finance-tool.vercel.app/auth/callback`

### OAuth Management Scripts

```bash
# Setup OAuth for current environment
npm run oauth:setup

# Verify OAuth configuration
npm run oauth:verify

# Configure OAuth for specific environment
npm run oauth:configure --env=staging
npm run oauth:configure --env=production
```

## 🚀 Deployment Pipeline

### Automatic Deployments

- **`develop`** → `aura-finance-app.vercel.app` (staging)
- **`main`** → `aura-finance-tool.vercel.app` (production)

### Manual Deployments

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Rollback deployment
npm run deploy:rollback
```

## 📋 Quality Gates

### Pre-PR Requirements

- [ ] All tests pass locally (excluding OAuth)
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Security audit clean
- [ ] No console.log statements
- [ ] Environment variables properly configured

### PR Requirements

- [ ] CI/CD pipeline passes
- [ ] Code review completed
- [ ] Security checks pass
- [ ] Performance benchmarks met
- [ ] Documentation updated

### Pre-Production Requirements

- [ ] **MANDATORY**: Staging testing completed
- [ ] **MANDATORY**: OAuth verified in staging
- [ ] **MANDATORY**: All integrations tested
- [ ] **MANDATORY**: Performance testing passed
- [ ] **MANDATORY**: Security audit completed

## 🛠️ Development Scripts

### Essential Scripts

```bash
# Development
npm run dev                    # Start development server (OAuth disabled)
npm run test:local            # Run all local tests (excluding OAuth)
npm run lint                  # Run linting
npm run build                 # Build for production
npm run preview               # Preview production build

# Testing
npm run test                  # Run unit tests
npm run test:ui               # Run tests with UI
npm run test:coverage         # Run tests with coverage
npm run test:e2e              # Run end-to-end tests

# Quality
npm run lint:fix              # Fix linting issues
npm run format                # Format code
npm run security              # Run security audit
npm run audit:fix             # Fix security vulnerabilities

# Deployment
npm run deploy:staging        # Deploy to staging
npm run deploy:production     # Deploy to production
npm run deploy:rollback       # Rollback deployment
```

## 🚨 Critical Issues & Solutions

### 1. OAuth Local Testing Limitation

- **Issue**: Cannot modify Supabase callback URLs for localhost
- **Solution**: OAuth testing only in staging environment
- **Workflow**: Local development → Staging testing → Production release

### 2. Merge Conflicts

- **Solution**: Always rebase on latest develop before creating PR
- **Command**: `git rebase develop`

### 3. Missing CI/CD Checks

- **Solution**: Ensure all workflows are properly configured
- **Verification**: Check `.github/workflows/` directory

### 4. Dev Branch Workflow

- **Solution**: All features go to `develop` first, then `main`
- **Process**: Feature → Develop → Staging → Main → Production

### 5. Local Testing

- **Solution**: MANDATORY local testing before any push (excluding OAuth)
- **Script**: `npm run test:local`

## 📊 Monitoring & Alerts

### Health Checks

- Application uptime monitoring
- API response time monitoring
- Error rate monitoring
- Security vulnerability alerts

### Performance Metrics

- Page load times
- API response times
- Database query performance
- Memory usage

## 🔄 Release Process

### 1. Feature Freeze

- No new features to develop branch
- Focus on bug fixes and testing

### 2. Release Candidate

- Create release branch from develop
- Comprehensive testing in staging
- Security audit and performance testing

### 3. Production Release

- Merge release branch to main
- Deploy to production
- Monitor for issues
- Rollback plan ready

### 4. Post-Release

- Monitor production metrics
- Address any issues
- Update documentation
- Plan next release

## 📚 Documentation

### Required Documentation

- API documentation
- User guides
- Developer setup guide
- Deployment procedures
- Troubleshooting guide

### Documentation Updates

- Update with each feature
- Review before release
- Maintain accuracy

## 🎯 Success Metrics

### Development Metrics

- Time to deploy
- Bug rate
- Test coverage
- Code review time

### Production Metrics

- Uptime percentage
- Error rate
- User satisfaction
- Performance scores

---

## 🚀 Quick Start Commands

```bash
# Setup development environment
npm install
npm run test:local

# Start development (OAuth disabled)
npm run dev

# Create feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
# ... work on feature ...
npm run test:local
git add . && git commit -m "feat: your feature"
git push origin feature/your-feature
gh pr create --base develop --title "feat: your feature"
```

---

**⚠️ IMPORTANT**:

- OAuth testing is ONLY performed in staging environment
- Local development excludes OAuth functionality
- All features must be tested in staging before production release
- This pipeline is MANDATORY for all development work. No exceptions.
