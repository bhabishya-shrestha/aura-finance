#!/bin/bash

# Local Development Setup Script for Aura Finance
# This script sets up the local development environment with proper OAuth configuration

set -e

echo "🚀 Setting up local development environment for Aura Finance..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "git is not installed. Please install git first."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Create .env.local for local development
print_status "Setting up environment variables..."

if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
# Local Development Environment Variables
# Copy your production environment variables here and modify as needed

# Supabase Configuration
VITE_SUPABASE_URL=https://mdpfwvqpwkiojnzpctou.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini AI Configuration (Optional for local testing)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Development Settings
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173

# OAuth Configuration for Local Development
# These URLs are already configured in your Supabase project
VITE_OAUTH_REDIRECT_URL=http://localhost:5173/auth/callback
EOF
    print_success "Created .env.local file"
    print_warning "Please update .env.local with your actual API keys"
else
    print_status ".env.local already exists"
fi

# Create local development configuration
print_status "Setting up local development configuration..."

# Create a local development script
cat > scripts/dev-local.sh << 'EOF'
#!/bin/bash

# Local Development Script
# This script runs the application in local development mode with proper OAuth handling

set -e

echo "🚀 Starting local development server..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please run setup-local-dev.sh first."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "your_supabase_url_here" ]; then
    echo "❌ Please update VITE_SUPABASE_URL in .env.local"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "your_supabase_anon_key_here" ]; then
    echo "❌ Please update VITE_SUPABASE_ANON_KEY in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"

# Run the development server
echo "🌐 Starting development server on http://localhost:5173"
echo "📝 OAuth redirect URL: http://localhost:5173/auth/callback"
echo ""
echo "🔧 Development Tips:"
echo "   - Use the demo account (test@gmail.com / demo123) for testing"
echo "   - OAuth will redirect to localhost:5173 for local development"
echo "   - Check browser console for any errors"
echo "   - Use browser dev tools to inspect network requests"
echo ""

npm run dev
EOF

chmod +x scripts/dev-local.sh
print_success "Created local development script"

# Create testing script
cat > scripts/test-local.sh << 'EOF'
#!/bin/bash

# Local Testing Script
# This script runs comprehensive tests for local development

set -e

echo "🧪 Running local tests..."

# Run linting
echo "📝 Running ESLint..."
npm run lint

# Run tests
echo "🧪 Running unit tests..."
npm test

# Run build test
echo "🔨 Testing build process..."
npm run build

echo "✅ All tests passed!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update .env.local with your API keys"
echo "   2. Run: ./scripts/dev-local.sh"
echo "   3. Open http://localhost:5173 in your browser"
echo "   4. Test OAuth flow with localhost redirect"
EOF

chmod +x scripts/test-local.sh
print_success "Created local testing script"

# Create OAuth testing guide
cat > docs/LOCAL_OAUTH_TESTING.md << 'EOF'
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
EOF

print_success "Created OAuth testing documentation"

# Create a comprehensive test runner
cat > scripts/run-all-tests.sh << 'EOF'
#!/bin/bash

# Comprehensive Test Runner
# This script runs all tests and checks for local development

set -e

echo "🧪 Running comprehensive test suite..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to run a test and report status
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Running:${NC} $test_name"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED:${NC} $test_name"
        return 0
    else
        echo -e "${RED}❌ FAILED:${NC} $test_name"
        return 1
    fi
}

# Track overall success
overall_success=true

# Test 1: Check dependencies
echo ""
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Dependencies not installed${NC}"
    overall_success=false
fi

# Test 2: Environment variables
echo ""
echo "🔧 Checking environment variables..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
    
    # Check if environment variables are set
    if grep -q "your_supabase_anon_key_here" .env.local; then
        echo -e "${YELLOW}⚠️  WARNING: Please update API keys in .env.local${NC}"
    else
        echo -e "${GREEN}✅ Environment variables configured${NC}"
    fi
else
    echo -e "${RED}❌ .env.local not found${NC}"
    overall_success=false
fi

# Test 3: Linting
echo ""
echo "📝 Running linting..."
if run_test "ESLint" "npm run lint"; then
    echo -e "${GREEN}✅ Code quality checks passed${NC}"
else
    overall_success=false
fi

# Test 4: Unit tests
echo ""
echo "🧪 Running unit tests..."
if run_test "Unit Tests" "npm test --run"; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    overall_success=false
fi

# Test 5: Build test
echo ""
echo "🔨 Testing build process..."
if run_test "Build Test" "npm run build"; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    overall_success=false
fi

# Test 6: Check for common issues
echo ""
echo "🔍 Checking for common issues..."

# Check for console.log statements in production code
console_count=$(grep -r "console\." src/ --include="*.js" --include="*.jsx" | grep -v "eslint-disable" | wc -l)
if [ "$console_count" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $console_count console statements (consider removing for production)${NC}"
else
    echo -e "${GREEN}✅ No console statements found${NC}"
fi

# Check for TODO comments
todo_count=$(grep -r "TODO" src/ --include="*.js" --include="*.jsx" | wc -l)
if [ "$todo_count" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $todo_count TODO comments${NC}"
else
    echo -e "${GREEN}✅ No TODO comments found${NC}"
fi

# Final report
echo ""
echo "📊 Test Summary"
echo "================"

if [ "$overall_success" = true ]; then
    echo -e "${GREEN}🎉 All tests passed! Your local environment is ready.${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Run: ./scripts/dev-local.sh"
    echo "   2. Open http://localhost:5173"
    echo "   3. Test OAuth flow"
    echo "   4. Test all features"
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
EOF

chmod +x scripts/run-all-tests.sh
print_success "Created comprehensive test runner"

print_success "Local development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update .env.local with your actual API keys"
echo "   2. Run: ./scripts/run-all-tests.sh"
echo "   3. Run: ./scripts/dev-local.sh"
echo "   4. Test OAuth flow at http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - docs/LOCAL_OAUTH_TESTING.md - OAuth testing guide"
echo "   - scripts/dev-local.sh - Local development script"
echo "   - scripts/test-local.sh - Local testing script"
echo "   - scripts/run-all-tests.sh - Comprehensive test runner" 