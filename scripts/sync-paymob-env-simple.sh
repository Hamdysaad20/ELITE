#!/bin/bash

# Simple script to sync Paymob variables from .env to Vercel and GitHub
# Usage: ./scripts/sync-paymob-env-simple.sh

set -e

echo "🔐 Syncing Paymob Environment Variables..."
echo ""

# Read variables from .env file (lines 72-88)
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Extract Paymob variables
PAYMOB_ENV=$(grep -E "^PAYMOB_" .env | grep -v "^#" | sed 's/^[^=]*=//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
NEXT_PUBLIC_PAYMOB=$(grep -E "^NEXT_PUBLIC_PAYMOB_" .env | grep -v "^#" | sed 's/^[^=]*=//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

# Function to sync single variable to Vercel (if CLI installed)
sync_var_to_vercel() {
    local var_name=$1
    local value=$2
    local scope=$3  # production, preview, development, or "all"
    
    if command -v vercel >/dev/null 2>&1; then
        echo "  Adding ${var_name} to Vercel (${scope})..."
        if [ "$scope" = "all" ]; then
            printf '%s' "$value" | vercel env add "$var_name" production 2>/dev/null || true
            printf '%s' "$value" | vercel env add "$var_name" preview 2>/dev/null || true
            printf '%s' "$value" | vercel env add "$var_name" development 2>/dev/null || true
        else
            printf '%s' "$value" | vercel env add "$var_name" "$scope" 2>/dev/null || true
        fi
    else
        echo "  ⚠️  Vercel CLI not installed. Skipping Vercel sync."
        echo "     Install: npm i -g vercel"
        return 1
    fi
}

# Function to sync single variable to GitHub
sync_var_to_github() {
    local var_name=$1
    local value=$2
    
    if command -v gh >/dev/null 2>&1; then
        echo "  Adding ${var_name} to GitHub Actions..."
        echo "$value" | gh secret set "$var_name" 2>/dev/null || true
    else
        echo "  ⚠️  GitHub CLI not installed. Skipping GitHub sync."
        return 1
    fi
}

# Sync to Vercel
echo "📤 Syncing to Vercel..."
if command -v vercel >/dev/null 2>&1; then
    # Read each Paymob variable and sync
    while IFS='=' read -r var_name value; do
        # Skip empty lines
        [ -z "$var_name" ] && continue
        
        # Determine scope (public vars go to all environments)
        if [[ "$var_name" == NEXT_PUBLIC_* ]]; then
            sync_var_to_vercel "$var_name" "$value" "all"
        else
            sync_var_to_vercel "$var_name" "$value" "production"
        fi
    done < <(grep -E "^(PAYMOB_|NEXT_PUBLIC_PAYMOB_)" .env | grep -v "^#")
    echo "✅ Vercel sync complete!"
else
    echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
fi

echo ""

# Sync to GitHub
echo "📤 Syncing to GitHub Actions..."
if command -v gh >/dev/null 2>&1; then
    # Read each Paymob variable and sync
    while IFS='=' read -r var_name value; do
        # Skip empty lines
        [ -z "$var_name" ] && continue
        
        # Remove quotes if present
        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/')
        
        sync_var_to_github "$var_name" "$value"
    done < <(grep -E "^(PAYMOB_|NEXT_PUBLIC_PAYMOB_)" .env | grep -v "^#")
    echo "✅ GitHub sync complete!"
else
    echo "⚠️  GitHub CLI not found. Install with: brew install gh"
fi

echo ""
echo "✅ Sync complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Vercel: Run 'vercel --prod' to redeploy"
echo "   2. GitHub: Variables are ready for workflows"
echo ""
