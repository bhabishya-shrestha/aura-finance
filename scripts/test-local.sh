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
