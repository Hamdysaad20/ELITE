#!/bin/bash

# Sync Paymob variables from .env lines 72-88 to Vercel and GitHub
# Usage: ./scripts/sync-paymob-vars.sh

echo "🔐 Syncing Paymob Environment Variables (lines 72-88 from .env)"
echo "================================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Extract lines 72-88
PAYMOB_LINES=$(sed -n '72,88p' .env)

if [ -z "$PAYMOB_LINES" ]; then
    echo "⚠️  No content found at lines 72-88 in .env"
    echo "   Make sure Paymob variables are at those lines"
    exit 1
fi

echo "📋 Found variables at lines 72-88:"
echo "$PAYMOB_LINES"
echo ""

# Save to temp file for processing
TEMP_FILE=$(mktemp)
echo "$PAYMOB_LINES" > "$TEMP_FILE"

echo "📤 Syncing to Vercel..."
echo ""

# Check Vercel CLI
if ! command -v vercel >/dev/null 2>&1; then
    echo "⚠️  Vercel CLI not installed"
    echo "   Install with: npm i -g vercel"
    echo ""
    echo "📋 Manual Vercel Commands (run these after installing Vercel CLI):"
    echo ""
    
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        
        # Extract variable name and value
        if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Remove quotes and comments
            value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
            
            echo "# ${var_name}"
            if [[ "$var_name" == NEXT_PUBLIC_* ]]; then
                echo "printf '%s' '${value}' | vercel env add ${var_name} production"
                echo "printf '%s' '${value}' | vercel env add ${var_name} preview"
                echo "printf '%s' '${value}' | vercel env add ${var_name} development"
            else
                echo "printf '%s' '${value}' | vercel env add ${var_name} production"
            fi
            echo ""
        fi
    done < "$TEMP_FILE"
else
    echo "✅ Vercel CLI found - syncing now..."
    echo ""
    
    # Sync each variable
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        
        # Extract variable name and value
        if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Remove quotes and comments
            value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
            
            echo "  Adding: ${var_name}"
            
            if [[ "$var_name" == NEXT_PUBLIC_* ]]; then
                # Public vars to all environments
                printf '%s' "$value" | vercel env add "$var_name" production 2>/dev/null && echo "    ✅ Production" || echo "    ⚠️  Production (may exist)"
                printf '%s' "$value" | vercel env add "$var_name" preview 2>/dev/null && echo "    ✅ Preview" || echo "    ⚠️  Preview (may exist)"
                printf '%s' "$value" | vercel env add "$var_name" development 2>/dev/null && echo "    ✅ Development" || echo "    ⚠️  Development (may exist)"
            else
                # Private vars to production only
                printf '%s' "$value" | vercel env add "$var_name" production 2>/dev/null && echo "    ✅ Production" || echo "    ⚠️  Production (may exist)"
            fi
            echo ""
        fi
    done < "$TEMP_FILE"
    
    echo "✅ Vercel sync complete!"
fi

echo ""
echo "📤 Syncing to GitHub Actions..."
echo ""

# Check GitHub CLI
if ! command -v gh >/dev/null 2>&1; then
    echo "⚠️  GitHub CLI not installed"
    echo "   Install with: brew install gh"
    echo ""
    echo "📋 Manual GitHub Commands (run these after installing GitHub CLI):"
    echo ""
    
    while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        
        if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
            
            echo "# ${var_name}"
            echo "gh secret set ${var_name} --body \"${value}\""
            echo ""
        fi
    done < "$TEMP_FILE"
elif ! gh auth status >/dev/null 2>&1; then
    echo "⚠️  GitHub CLI not authenticated"
    echo "   Run: gh auth login"
    echo ""
else
    echo "✅ GitHub CLI found and authenticated - syncing now..."
    echo ""
    
    # Sync each variable
    while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        
        if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
            
            echo "  Adding secret: ${var_name}"
            echo "$value" | gh secret set "$var_name" 2>/dev/null && echo "    ✅ Added" || echo "    ⚠️  May already exist"
        fi
    done < "$TEMP_FILE"
    
    echo ""
    echo "✅ GitHub sync complete!"
fi

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo "✅ Sync process complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Install Vercel CLI: npm i -g vercel (if not installed)"
echo "   2. Install GitHub CLI: brew install gh (if not installed)"
echo "   3. Authenticate GitHub: gh auth login (if needed)"
echo "   4. Run this script again: ./scripts/sync-paymob-vars.sh"
echo "   5. Redeploy: vercel --prod"
echo ""
