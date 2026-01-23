#!/bin/bash

# Sync Paymob Environment Variables to Vercel and GitHub
# This script reads Paymob variables from .env and syncs them to production

set -e  # Exit on error

echo "🔐 Syncing Paymob Environment Variables..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Paymob variable names (in order from .env lines 72-88)
PAYMOB_VARS=(
    "PAYMOB_ENVIRONMENT"
    "PAYMOB_API_KEY"
    "PAYMOB_SECRET_KEY"
    "PAYMOB_PUBLIC_KEY"
    "PAYMOB_HMAC_SECRET"
    "PAYMOB_INTEGRATION_ID"
    "PAYMOB_WALLET_INTEGRATION_ID"
    "PAYMOB_INTEGRATION_SUBSCRIPTION"
    "PAYMOB_INTEGRATION_HOST"
    "PAYMOB_INTEGRATION_BALANCE_TRANSFER"
    "PAYMOB_INTEGRATION_CASH_COLLECTION"
    "PAYMOB_INTEGRATION_BILL_PAYMENT"
    "NEXT_PUBLIC_PAYMOB_PUBLIC_KEY"
    "NEXT_PUBLIC_PAYMOB_IFRAME_ID"
)

# Function to get value from .env file
get_env_value() {
    local var_name=$1
    # Extract value after = sign, handling comments and quoted values
    grep -E "^${var_name}=" .env | sed 's/^[^=]*=//' | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/'
}

# Function to sync to Vercel
sync_to_vercel() {
    echo -e "${BLUE}📤 Syncing to Vercel (Production)...${NC}"
    echo ""
    
    local count=0
    for var_name in "${PAYMOB_VARS[@]}"; do
        local value=$(get_env_value "$var_name")
        
        if [ -z "$value" ]; then
            echo -e "${YELLOW}⚠️  Warning: ${var_name} not found in .env, skipping...${NC}"
            continue
        fi
        
        # Determine environment scope
        # Public vars go to all environments, private vars go to production only
        if [[ "$var_name" == NEXT_PUBLIC_* ]]; then
            echo "  Adding ${var_name} (Public) to Production, Preview, Development..."
            printf '%s' "$value" | vercel env add "$var_name" production
            printf '%s' "$value" | vercel env add "$var_name" preview
            printf '%s' "$value" | vercel env add "$var_name" development
        else
            echo "  Adding ${var_name} (Private) to Production..."
            printf '%s' "$value" | vercel env add "$var_name" production
        fi
        
        count=$((count + 1))
    done
    
    echo ""
    echo -e "${GREEN}✅ Successfully synced ${count} variables to Vercel!${NC}"
    echo ""
}

# Function to generate GitHub Actions commands
generate_github_commands() {
    echo -e "${BLUE}📋 GitHub Actions Secrets Setup:${NC}"
    echo ""
    echo "Run these commands to add secrets to GitHub Actions:"
    echo ""
    echo "Or use GitHub UI: Repository → Settings → Secrets → Actions → New repository secret"
    echo ""
    
    for var_name in "${PAYMOB_VARS[@]}"; do
        local value=$(get_env_value "$var_name")
        
        if [ -z "$value" ]; then
            continue
        fi
        
        echo "# ${var_name}"
        if command -v gh >/dev/null 2>&1; then
            # Use GitHub CLI if available
            echo "gh secret set ${var_name} --body \"${value}\""
        else
            # Manual instructions
            echo "# Add in GitHub UI: Name='${var_name}', Value='${value}'"
        fi
        echo ""
    done
    
    echo -e "${GREEN}✅ GitHub secrets list generated above${NC}"
    echo ""
}

# Function to sync to GitHub using GitHub CLI
sync_to_github() {
    if ! command -v gh >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed. Showing manual commands instead...${NC}"
        echo ""
        generate_github_commands
        return
    fi
    
    # Check if authenticated
    if ! gh auth status >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated. Please run: gh auth login${NC}"
        echo ""
        generate_github_commands
        return
    fi
    
    echo -e "${BLUE}📤 Syncing to GitHub Actions Secrets...${NC}"
    echo ""
    
    local count=0
    for var_name in "${PAYMOB_VARS[@]}"; do
        local value=$(get_env_value "$var_name")
        
        if [ -z "$value" ]; then
            echo -e "${YELLOW}⚠️  Warning: ${var_name} not found in .env, skipping...${NC}"
            continue
        fi
        
        echo "  Adding secret: ${var_name}..."
        echo "$value" | gh secret set "$var_name"
        
        count=$((count + 1))
    done
    
    echo ""
    echo -e "${GREEN}✅ Successfully synced ${count} secrets to GitHub Actions!${NC}"
    echo ""
}

# Main execution
echo "Reading Paymob variables from .env file..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Please install: npm i -g vercel${NC}"
    echo ""
else
    sync_to_vercel
fi

# GitHub sync
echo ""
read -p "Sync to GitHub Actions? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sync_to_github
else
    generate_github_commands
fi

echo ""
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. If synced to Vercel: Run 'vercel --prod' to redeploy"
echo "   2. If synced to GitHub: Push a commit to trigger workflows"
echo "   3. Verify variables in:"
echo "      - Vercel: Dashboard → Project → Settings → Environment Variables"
echo "      - GitHub: Repository → Settings → Secrets → Actions"
echo ""
