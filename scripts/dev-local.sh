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
