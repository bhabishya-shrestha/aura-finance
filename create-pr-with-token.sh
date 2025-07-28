#!/bin/bash

# Aura Finance PR Creation Script
# This script creates a PR using GitHub API

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Load project-specific environment if exists
if [ -f ".github-env" ]; then
    source .github-env
fi

echo "🚀 Creating Pull Request for Aura Finance v1.1.0"

# Check if token is provided as argument or from environment
if [ -n "$1" ]; then
    export GITHUB_TOKEN="$1"
    echo "✅ Using token from command line argument"
elif [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ Using token from environment"
else
    echo "❌ Error: GitHub token not found"
    echo "Usage: ./create-pr-with-token.sh [YOUR_GITHUB_TOKEN]"
    echo ""
    echo "Or set up persistent token:"
    echo "./scripts/setup-github-token.sh YOUR_TOKEN"
    exit 1
fi

# PR data
PR_TITLE="Release v1.1.0: Mobile Optimization & Professional Versioning"
PR_BODY=$(cat PR_DESCRIPTION.md)
BASE_BRANCH="main"
HEAD_BRANCH="feature/v1.1.0-mobile-optimization"
REPO="bhabishya-shrestha/aura-finance"

echo "📝 Creating PR with title: $PR_TITLE"

# Create PR using GitHub API
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO/pulls \
  -d "{
    \"title\": \"$PR_TITLE\",
    \"body\": $(echo "$PR_BODY" | jq -R -s .),
    \"head\": \"$HEAD_BRANCH\",
    \"base\": \"$BASE_BRANCH\"
  }")

# Check if PR was created successfully
if echo "$RESPONSE" | grep -q "html_url"; then
    PR_URL=$(echo "$RESPONSE" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Pull Request created successfully!"
    echo "🔗 PR URL: $PR_URL"
    
    # Open PR in browser
    echo "🌐 Opening PR in browser..."
    cmd //c start "$PR_URL"
    
    echo ""
    echo "🎯 Next steps:"
    echo "1. Review the PR in the browser"
    echo "2. Click 'Merge pull request'"
    echo "3. Come back here to run: npm run release:minor"
    
else
    echo "❌ Error creating PR:"
    echo "$RESPONSE"
    exit 1
fi 