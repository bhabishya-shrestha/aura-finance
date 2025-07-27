#!/bin/bash

# Aura Finance Version Management Script
# Handles semantic versioning and release process

set -e

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

# Get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Check if working directory is clean
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        print_error "Working directory is not clean. Please commit or stash changes first."
        git status --short
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test
    print_success "Tests passed!"
}

# Build project
build_project() {
    print_status "Building project..."
    npm run build
    print_success "Build completed!"
}

# Update changelog
update_changelog() {
    local version=$1
    local date=$(date +%Y-%m-%d)
    
    print_status "Updating CHANGELOG.md..."
    
    # Create temporary changelog entry
    cat > temp_changelog.md << EOF
## [${version}] - ${date}

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

EOF

    # Insert after the [Unreleased] section
    sed -i.bak "/## \[Unreleased\]/r temp_changelog.md" CHANGELOG.md
    rm temp_changelog.md CHANGELOG.md.bak
    
    print_success "CHANGELOG.md updated!"
}

# Create git tag
create_tag() {
    local version=$1
    
    print_status "Creating git tag v${version}..."
    git tag -a "v${version}" -m "Release v${version}"
    print_success "Git tag created!"
}

# Push changes
push_changes() {
    local version=$1
    
    print_status "Pushing changes to remote..."
    git push origin main
    git push origin "v${version}"
    print_success "Changes pushed to remote!"
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production..."
    vercel --prod
    print_success "Deployed to production!"
}

# Main version bump function
bump_version() {
    local bump_type=$1
    
    print_status "Current version: $(get_current_version)"
    
    case $bump_type in
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
            print_error "Invalid bump type. Use: patch, minor, or major"
            exit 1
            ;;
    esac
    
    local new_version=$(get_current_version)
    print_success "Version bumped to: ${new_version}"
    
    return 0
}

# Full release process
release() {
    local bump_type=$1
    
    if [ -z "$bump_type" ]; then
        print_error "Please specify bump type: patch, minor, or major"
        echo "Usage: $0 release [patch|minor|major]"
        exit 1
    fi
    
    print_status "Starting release process..."
    
    # Check git status
    check_git_status
    
    # Run tests
    run_tests
    
    # Bump version
    bump_version $bump_type
    
    local new_version=$(get_current_version)
    
    # Update changelog
    update_changelog $new_version
    
    # Commit changes
    print_status "Committing changes..."
    git add .
    git commit -m "Release v${new_version}"
    
    # Create tag
    create_tag $new_version
    
    # Push changes
    push_changes $new_version
    
    # Deploy to production
    deploy_production
    
    print_success "Release v${new_version} completed successfully!"
    print_status "Your app is now live at: https://aura-finance-tool.vercel.app"
}

# Show current version
show_version() {
    local version=$(get_current_version)
    print_status "Current version: ${version}"
}

# Show help
show_help() {
    echo "Aura Finance Version Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  version                    Show current version"
    echo "  release [patch|minor|major] Complete release process"
    echo "  test                       Run tests"
    echo "  build                      Build project"
    echo "  deploy                     Deploy to production"
    echo "  help                       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 version                 Show current version"
    echo "  $0 release patch           Release patch version (1.0.0 → 1.0.1)"
    echo "  $0 release minor           Release minor version (1.0.0 → 1.1.0)"
    echo "  $0 release major           Release major version (1.0.0 → 2.0.0)"
    echo ""
    echo "Semantic Versioning:"
    echo "  MAJOR: Breaking changes (1.0.0 → 2.0.0)"
    echo "  MINOR: New features, backward compatible (1.0.0 → 1.1.0)"
    echo "  PATCH: Bug fixes, backward compatible (1.0.0 → 1.0.1)"
}

# Main script logic
case $1 in
    "version")
        show_version
        ;;
    "release")
        release $2
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_project
        ;;
    "deploy")
        deploy_production
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 