#!/bin/bash

# Aura Finance Release Script
# Professional release process following Fortune 500 standards

set -e  # Exit on any error

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

# Function to check if we're on main branch
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        print_error "You must be on the main branch to create a release"
        print_error "Current branch: $current_branch"
        exit 1
    fi
}

# Function to check for uncommitted changes
check_clean_working_tree() {
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes. Please commit or stash them before releasing."
        git status --short
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Please fix them before releasing."
        exit 1
    fi
}

# Function to build the project
build_project() {
    print_status "Building project..."
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed. Please fix the issues before releasing."
        exit 1
    fi
}

# Function to get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to update version
update_version() {
    local version_type=$1
    print_status "Updating version to $version_type..."
    
    case $version_type in
        "patch")
            npm version patch --no-git-tag-version
            ;;
        "minor")
            npm version minor --no-git-tag-version
            ;;
        "major")
            npm version major --no-git-tag-version
            ;;
        *)
            print_error "Invalid version type. Use patch, minor, or major"
            exit 1
            ;;
    esac
    
    new_version=$(get_current_version)
    print_success "Version updated to $new_version"
}

# Function to create git tag
create_git_tag() {
    local version=$1
    print_status "Creating git tag v$version..."
    
    if git tag -l "v$version" | grep -q "v$version"; then
        print_error "Tag v$version already exists"
        exit 1
    fi
    
    git add package.json package-lock.json
    git commit -m "Release v$version"
    git tag "v$version"
    print_success "Git tag v$version created"
}

# Function to push to remote
push_to_remote() {
    local version=$1
    print_status "Pushing to remote repository..."
    
    git push origin main
    git push origin "v$version"
    print_success "Pushed to remote repository"
}

# Function to create GitHub release
create_github_release() {
    local version=$1
    print_status "Creating GitHub release..."
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI not found. Skipping GitHub release creation."
        print_warning "Install GitHub CLI to automatically create releases: https://cli.github.com/"
        return
    fi
    
    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        print_warning "GitHub CLI not authenticated. Skipping GitHub release creation."
        return
    fi
    
    # Create release
    gh release create "v$version" \
        --title "Release v$version" \
        --notes "See CHANGELOG.md for detailed changes" \
        --draft=false \
        --prerelease=false
    
    print_success "GitHub release created"
}

# Function to deploy to production
deploy_to_production() {
    print_status "Deploying to production..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Skipping deployment."
        print_warning "Install Vercel CLI to automatically deploy: npm i -g vercel"
        return
    fi
    
    # Deploy to production
    if vercel --prod; then
        print_success "Deployed to production"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to validate release
validate_release() {
    local version=$1
    print_status "Validating release..."
    
    # Check if version is properly set
    current_version=$(get_current_version)
    if [ "$current_version" != "$version" ]; then
        print_error "Version mismatch. Expected: $version, Got: $current_version"
        exit 1
    fi
    
    # Check if tag exists
    if ! git tag -l "v$version" | grep -q "v$version"; then
        print_error "Git tag v$version not found"
        exit 1
    fi
    
    print_success "Release validation passed"
}

# Main release function
main() {
    local version_type=${1:-patch}
    
    print_status "Starting release process for $version_type version..."
    
    # Pre-release checks
    check_branch
    check_clean_working_tree
    
    # Get current version
    old_version=$(get_current_version)
    print_status "Current version: $old_version"
    
    # Run quality checks
    run_tests
    build_project
    
    # Update version
    update_version "$version_type"
    new_version=$(get_current_version)
    
    # Create git tag
    create_git_tag "$new_version"
    
    # Push to remote
    push_to_remote "$new_version"
    
    # Create GitHub release
    create_github_release "$new_version"
    
    # Deploy to production
    deploy_to_production
    
    # Validate release
    validate_release "$new_version"
    
    print_success "Release v$new_version completed successfully!"
    print_status "Version updated from $old_version to $new_version"
    print_status "Production URL: https://aura-finance-tool.vercel.app"
}

# Help function
show_help() {
    echo "Aura Finance Release Script"
    echo ""
    echo "Usage: $0 [patch|minor|major]"
    echo ""
    echo "Arguments:"
    echo "  patch    Increment patch version (1.0.0 -> 1.0.1)"
    echo "  minor    Increment minor version (1.0.0 -> 1.1.0)"
    echo "  major    Increment major version (1.0.0 -> 2.0.0)"
    echo ""
    echo "Default: patch"
    echo ""
    echo "This script will:"
    echo "  1. Check you're on main branch"
    echo "  2. Verify no uncommitted changes"
    echo "  3. Run tests"
    echo "  4. Build the project"
    echo "  5. Update version in package.json"
    echo "  6. Create git tag"
    echo "  7. Push to remote repository"
    echo "  8. Create GitHub release (if gh CLI available)"
    echo "  9. Deploy to production (if Vercel CLI available)"
    echo "  10. Validate the release"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    patch|minor|major)
        main "$1"
        ;;
    "")
        main "patch"
        ;;
    *)
        print_error "Invalid argument: $1"
        show_help
        exit 1
        ;;
esac 