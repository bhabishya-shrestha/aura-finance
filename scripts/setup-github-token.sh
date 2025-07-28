#!/bin/bash

# Aura Finance GitHub Token Setup Script
# This script sets up persistent GitHub token configuration

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

# Function to check if token is valid
validate_token() {
    local token=$1
    local response=$(curl -s -H "Authorization: token $token" https://api.github.com/user)
    
    if echo "$response" | grep -q '"login"'; then
        local username=$(echo "$response" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
        echo "$username"
        return 0
    else
        return 1
    fi
}

# Function to create git config for the project
setup_git_config() {
    local token=$1
    local username=$2
    
    print_status "Setting up Git configuration for this project..."
    
    # Set up Git credential helper for this repository
    git config credential.helper store
    
    # Create .git-credentials file in project root
    local credentials_file=".git-credentials"
    echo "https://$username:$token@github.com" > "$credentials_file"
    
    # Add to .gitignore if not already there
    if ! grep -q "^\.git-credentials$" .gitignore; then
        echo "" >> .gitignore
        echo "# GitHub credentials" >> .gitignore
        echo ".git-credentials" >> .gitignore
    fi
    
    print_success "Git credentials configured"
}

# Function to create environment file
setup_env_file() {
    local token=$1
    
    print_status "Setting up environment configuration..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        touch ".env"
    fi
    
    # Add or update GITHUB_TOKEN in .env
    if grep -q "^GITHUB_TOKEN=" .env; then
        # Update existing token
        sed -i "s/^GITHUB_TOKEN=.*/GITHUB_TOKEN=$token/" .env
    else
        # Add new token
        echo "" >> .env
        echo "# GitHub Configuration" >> .env
        echo "GITHUB_TOKEN=$token" >> .env
    fi
    
    print_success "Environment file configured"
}

# Function to create shell profile configuration
setup_shell_profile() {
    local token=$1
    
    print_status "Setting up shell profile configuration..."
    
    # Detect shell
    local shell_profile=""
    if [ -n "$ZSH_VERSION" ]; then
        shell_profile="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        shell_profile="$HOME/.bashrc"
    else
        shell_profile="$HOME/.profile"
    fi
    
    # Create a project-specific environment file
    local project_env_file=".github-env"
    
    # Add or update GITHUB_TOKEN in project env file
    echo "export GITHUB_TOKEN=$token" > "$project_env_file"
    echo "export GITHUB_USERNAME=$(validate_token "$token")" >> "$project_env_file"
    
    # Add source command to shell profile if not already there
    local source_line="source \"$(pwd)/$project_env_file\""
    if ! grep -q "$source_line" "$shell_profile" 2>/dev/null; then
        echo "" >> "$shell_profile"
        echo "# Aura Finance GitHub Configuration" >> "$shell_profile"
        echo "$source_line" >> "$shell_profile"
        print_success "Shell profile updated: $shell_profile"
    else
        print_status "Shell profile already configured"
    fi
    
    # Add to .gitignore
    if ! grep -q "^\.github-env$" .gitignore; then
        echo ".github-env" >> .gitignore
    fi
}

# Function to validate token (built into this script)
validate_token_internal() {
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "GITHUB_TOKEN not set"
        echo "Run: $0 YOUR_TOKEN"
        exit 1
    fi

    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
    if echo "$response" | grep -q '"login"'; then
        local username=$(echo "$response" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
        print_success "Token valid for user: $username"
        return 0
    else
        print_error "Invalid token"
        return 1
    fi
}

# Function to refresh token (built into this script)
refresh_token_internal() {
    local new_token=$1
    if [ -z "$new_token" ]; then
        print_error "Please provide your new GitHub token"
        echo "Usage: $0 refresh YOUR_NEW_TOKEN"
        exit 1
    fi

    # Validate new token
    local response=$(curl -s -H "Authorization: token $new_token" https://api.github.com/user)
    if ! echo "$response" | grep -q '"login"'; then
        print_error "Invalid token provided"
        exit 1
    fi

    # Update all configurations
    main "$new_token"
    print_success "Token refreshed successfully"
}

# Main function
main() {
    if [ -z "$1" ]; then
        print_error "Please provide your GitHub token"
        echo ""
        echo "Usage: $0 YOUR_GITHUB_TOKEN"
        echo ""
        echo "To get a GitHub token:"
        echo "1. Go to https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select scopes: repo, workflow, admin:org"
        echo "4. Copy the token and run this script"
        exit 1
    fi
    
    local token=$1
    
    print_status "Setting up GitHub token configuration..."
    
    # Validate token
    print_status "Validating GitHub token..."
    local username=$(validate_token "$token")
    if [ $? -eq 0 ]; then
        print_success "Token valid for user: $username"
    else
        print_error "Invalid GitHub token"
        exit 1
    fi
    
    # Set up configurations
    setup_git_config "$token" "$username"
    setup_env_file "$token"
    setup_shell_profile "$token"
    
    # Set token for current session
    export GITHUB_TOKEN="$token"
    export GITHUB_USERNAME="$username"
    
    print_success "GitHub token setup completed!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
    echo "2. Test the token: $0 validate"
    echo "3. Create a PR: ./create-pr-with-token.sh"
    echo "4. Run release: ./scripts/release.sh minor"
    echo ""
    echo "📝 Token will be automatically available in future sessions"
    echo "🔄 To update token later: $0 refresh NEW_TOKEN"
}

# Parse command line arguments
case "${1:-}" in
    "validate")
        # Load environment variables
        if [ -f ".env" ]; then
            export $(grep -v '^#' .env | xargs)
        fi
        if [ -f ".github-env" ]; then
            source .github-env
        fi
        validate_token_internal
        ;;
    "refresh")
        refresh_token_internal "$2"
        ;;
    -h|--help)
        echo "GitHub Token Setup Script"
        echo ""
        echo "Usage: $0 [COMMAND] [TOKEN]"
        echo ""
        echo "Commands:"
        echo "  [TOKEN]           Set up GitHub token (default)"
        echo "  validate          Validate current token"
        echo "  refresh [TOKEN]   Refresh/update token"
        echo "  -h, --help        Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 YOUR_TOKEN"
        echo "  $0 validate"
        echo "  $0 refresh NEW_TOKEN"
        ;;
    *)
        main "$@"
        ;;
esac 