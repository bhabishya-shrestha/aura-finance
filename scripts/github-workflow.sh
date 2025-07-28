#!/bin/bash

# Aura Finance GitHub Workflow Script
# Complete workflow for PR creation, merging, and deployment

set -e

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Load project-specific environment if exists
if [ -f ".github-env" ]; then
    source .github-env
fi

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

# Function to validate GitHub token
validate_github_token() {
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "GitHub token not found"
        echo "Run: ./scripts/setup-github-token.sh YOUR_TOKEN"
        exit 1
    fi
    
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
    if ! echo "$response" | grep -q '"login"'; then
        print_error "Invalid GitHub token"
        exit 1
    fi
    
    local username=$(echo "$response" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
    print_success "GitHub token valid for user: $username"
    echo "$username"
}

# Function to check current branch
check_current_branch() {
    local current_branch=$(git branch --show-current)
    print_status "Current branch: $current_branch"
    echo "$current_branch"
}

# Function to create feature branch
create_feature_branch() {
    local branch_name=$1
    local current_branch=$(check_current_branch)
    
    if [ "$current_branch" != "main" ]; then
        print_status "Switching to main branch..."
        git checkout main
        git pull origin main
    fi
    
    print_status "Creating feature branch: $branch_name"
    git checkout -b "$branch_name"
    print_success "Feature branch created: $branch_name"
}

# Function to commit and push changes
commit_and_push() {
    local commit_message=$1
    local branch_name=$(git branch --show-current)
    
    print_status "Committing changes..."
    git add .
    git commit -m "$commit_message"
    
    print_status "Pushing to remote..."
    git push origin "$branch_name"
    print_success "Changes pushed to remote"
}

# Function to create pull request
create_pull_request() {
    local title=$1
    local body=$2
    local head_branch=$3
    local base_branch=${4:-main}
    local repo="bhabishya-shrestha/aura-finance"
    
    print_status "Creating pull request..."
    
    local response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/$repo/pulls \
        -d "{
            \"title\": \"$title\",
            \"body\": $(echo "$body" | jq -R -s .),
            \"head\": \"$head_branch\",
            \"base\": \"$base_branch\"
        }")
    
    if echo "$response" | grep -q "html_url"; then
        local pr_url=$(echo "$response" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)
        local pr_number=$(echo "$response" | grep -o '"number":[0-9]*' | cut -d':' -f2)
        print_success "Pull request created successfully!"
        print_status "PR URL: $pr_url"
        print_status "PR Number: $pr_number"
        echo "$pr_number"
    else
        print_error "Failed to create pull request:"
        echo "$response"
        exit 1
    fi
}

# Function to merge pull request
merge_pull_request() {
    local pr_number=$1
    local repo="bhabishya-shrestha/aura-finance"
    
    print_status "Merging pull request #$pr_number..."
    
    local response=$(curl -s -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/$repo/pulls/$pr_number/merge \
        -d '{
            "merge_method": "squash",
            "commit_title": "Merge pull request #'$pr_number'",
            "commit_message": "Automated merge via workflow script"
        }')
    
    if echo "$response" | grep -q '"merged":true'; then
        print_success "Pull request merged successfully!"
    else
        print_error "Failed to merge pull request:"
        echo "$response"
        exit 1
    fi
}

# Function to delete feature branch
delete_feature_branch() {
    local branch_name=$1
    local repo="bhabishya-shrestha/aura-finance"
    
    print_status "Deleting feature branch: $branch_name"
    
    local response=$(curl -s -X DELETE \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/$repo/git/refs/heads/$branch_name)
    
    if [ $? -eq 0 ]; then
        print_success "Feature branch deleted"
    else
        print_warning "Failed to delete feature branch (may not exist)"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Function to build project
build_project() {
    print_status "Building project..."
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Function to deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Skipping deployment."
        print_warning "Install Vercel CLI: npm i -g vercel"
        return
    fi
    
    if vercel --prod; then
        print_success "Deployed to production"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to complete workflow
complete_workflow() {
    local version_type=${1:-patch}
    local feature_name=${2:-"feature-update"}
    
    print_status "Starting complete GitHub workflow..."
    
    # Validate token
    local username=$(validate_github_token)
    
    # Create feature branch
    local branch_name="feature/v$(date +%Y%m%d)-$feature_name"
    create_feature_branch "$branch_name"
    
    # Run quality checks
    run_tests
    build_project
    
    # Commit changes
    commit_and_push "feat: $feature_name - $(date)"
    
    # Create PR
    local pr_title="Release: $feature_name"
    local pr_body="Automated PR for $feature_name

## Changes
- Feature implementation
- Quality assurance passed
- Ready for review and merge

## Checklist
- [x] Tests passing
- [x] Build successful
- [x] Code review ready"
    
    local pr_number=$(create_pull_request "$pr_title" "$pr_body" "$branch_name")
    
    # Wait for user confirmation
    echo ""
    print_status "Pull request created successfully!"
    print_status "Please review the PR and confirm to continue..."
    read -p "Press Enter to merge the PR and deploy, or Ctrl+C to cancel..."
    
    # Merge PR
    merge_pull_request "$pr_number"
    
    # Switch back to main and pull latest
    git checkout main
    git pull origin main
    
    # Delete feature branch
    delete_feature_branch "$branch_name"
    
    # Create release
    print_status "Creating release..."
    ./scripts/release.sh "$version_type"
    
    # Deploy to production
    deploy_to_vercel
    
    print_success "Complete workflow finished successfully!"
    print_status "Production URL: https://aura-finance-tool.vercel.app"
}

# Function to show help
show_help() {
    echo "Aura Finance GitHub Workflow Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
echo "  complete [version] [feature]  Complete workflow (create PR, merge, release, deploy)"
echo "  create-pr [title] [body] [branch]  Create a pull request"
echo "  merge-pr [number]            Merge a pull request"
echo "  validate                     Validate GitHub token"
echo "  setup-token [token]          Set up persistent GitHub token"
    echo ""
    echo "Examples:"
    echo "  $0 complete minor mobile-optimization"
    echo "  $0 create-pr \"My PR\" \"PR description\" feature-branch"
    echo "  $0 merge-pr 123"
    echo "  $0 setup-token YOUR_TOKEN"
    echo ""
    echo "Version types: patch, minor, major (default: patch)"
}

# Main script logic
case "${1:-}" in
    "complete")
        complete_workflow "${2:-patch}" "${3:-feature-update}"
        ;;
    "create-pr")
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            print_error "Missing arguments for create-pr"
            echo "Usage: $0 create-pr \"Title\" \"Body\" \"Branch\""
            exit 1
        fi
        validate_github_token > /dev/null
        create_pull_request "$2" "$3" "$4"
        ;;
    "merge-pr")
        if [ -z "$2" ]; then
            print_error "Missing PR number"
            echo "Usage: $0 merge-pr PR_NUMBER"
            exit 1
        fi
        validate_github_token > /dev/null
        merge_pull_request "$2"
        ;;
    "validate-token")
        validate_github_token
        ;;
    "setup-token")
        if [ -z "$2" ]; then
            print_error "Missing token"
            echo "Usage: $0 setup-token YOUR_TOKEN"
            exit 1
        fi
        ./scripts/setup-github-token.sh "$2"
        ;;
    "validate")
        ./scripts/setup-github-token.sh validate
        ;;
    -h|--help)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 