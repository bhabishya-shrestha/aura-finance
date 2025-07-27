#!/bin/bash

# Aura Finance Deployment Script
# Deploys to Vercel with Supabase integration

set -e

echo "🚀 Starting Aura Finance deployment..."

# Security check - ensure no sensitive files are being committed
echo "🔒 Running security checks..."
if [ -f .env ]; then
    echo "❌ WARNING: .env file found! This should not be committed to a public repository."
    echo "   Please ensure .env is in your .gitignore and contains only placeholder values."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled for security reasons."
        exit 1
    fi
fi

# Check for any potential secrets in the codebase (simplified)
if find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "sk_" 2>/dev/null | grep -v node_modules | grep -v scripts/deploy.sh; then
    echo "❌ WARNING: Potential secret keys found in codebase!"
    echo "   Please review and remove any hardcoded secrets before deploying."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    brew install supabase/tap/supabase
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
VITE_APP_NAME=Aura Finance
VITE_APP_VERSION=0.1.0
EOF
    echo "📝 Please update .env with your Supabase credentials"
    echo "🔗 Get them from: https://app.supabase.com/project/_/settings/api"
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔗 Your app should be live at the URL shown above"
echo "📊 Check your Supabase dashboard for database status" 