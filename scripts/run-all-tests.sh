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
