#!/bin/bash

# Manual Paymob Environment Variable Sync
# Extracts Paymob variables from .env and provides commands to sync to Vercel/GitHub

echo "🔐 Paymob Environment Variable Sync Tool"
echo "========================================"
echo ""

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Extract Paymob variables from .env
echo "📋 Extracting Paymob variables from .env..."
echo ""

# Create temp file with extracted variables
TEMP_FILE=$(mktemp)
grep -E "^(PAYMOB_|NEXT_PUBLIC_PAYMOB_)" .env | grep -v "^#" > "$TEMP_FILE" || true

if [ ! -s "$TEMP_FILE" ]; then
    echo "⚠️  No Paymob variables found in .env file"
    echo "   Make sure your .env file contains PAYMOB_* variables"
    exit 1
fi

echo "Found Paymob variables:"
cat "$TEMP_FILE" | cut -d'=' -f1
echo ""

# Check for Vercel CLI
if command -v vercel >/dev/null 2>&1; then
    echo "✅ Vercel CLI found"
    echo ""
    echo "📤 Syncing to Vercel (Production)..."
    echo ""
    
    while IFS='=' read -r var_name value; do
        # Skip empty lines
        [ -z "$var_name" ] && continue
        
        # Remove any trailing comments or whitespace
        value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
        
        echo "  Adding: ${var_name}"
        
        # Determine scope
        if [[ "$var_name" == NEXT_PUBLIC_* ]]; then
            # Public vars go to all environments
            printf '%s' "$value" | vercel env add "$var_name" production 2>/dev/null && echo "    ✅ Production" || echo "    ⚠️  Production (may already exist)"
            printf '%s' "$value" | vercel env add "$var_name" preview 2>/dev/null && echo "    ✅ Preview" || echo "    ⚠️  Preview (may already exist)"
            printf '%s' "$value" | vercel env add "$var_name" development 2>/dev/null && echo "    ✅ Development" || echo "    ⚠️  Development (may already exist)"
        else
            # Private vars go to production only
            printf '%s' "$value" | vercel env add "$var_name" production 2>/dev/null && echo "    ✅ Production" || echo "    ⚠️  Production (may already exist)"
        fi
    done < "$TEMP_FILE"
    
    echo ""
    echo "✅ Vercel sync complete!"
else
    echo "⚠️  Vercel CLI not found"
    echo "   Install with: npm i -g vercel"
    echo ""
    echo "📋 Manual Vercel Commands:"
    echo ""
    while IFS='=' read -r var_name value; do
        [ -z "$var_name" ] && continue
        value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
        if [[ "$var_name" == NEXT_PUBLIC_* ]]; then
            echo "printf '%s' '${value}' | vercel env add ${var_name} production"
            echo "printf '%s' '${value}' | vercel env add ${var_name} preview"
            echo "printf '%s' '${value}' | vercel env add ${var_name} development"
        else
            echo "printf '%s' '${value}' | vercel env add ${var_name} production"
        fi
        echo ""
    done < "$TEMP_FILE"
fi

echo ""

# Check for GitHub CLI
if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        echo "✅ GitHub CLI found and authenticated"
        echo ""
        echo "📤 Syncing to GitHub Actions Secrets..."
        echo ""
        
        while IFS='=' read -r var_name value; do
            [ -z "$var_name" ] && continue
            value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
            
            echo "  Adding secret: ${var_name}"
            echo "$value" | gh secret set "$var_name" 2>/dev/null && echo "    ✅ Added" || echo "    ⚠️  May already exist"
        done < "$TEMP_FILE"
        
        echo ""
        echo "✅ GitHub sync complete!"
    else
        echo "⚠️  GitHub CLI not authenticated"
        echo "   Run: gh auth login"
        echo ""
        generate_github_commands
    fi
else
    echo "⚠️  GitHub CLI not found"
    echo "   Install with: brew install gh"
    echo ""
    generate_github_commands
fi

generate_github_commands() {
    echo "📋 Manual GitHub Commands:"
    echo ""
    while IFS='=' read -r var_name value; do
        [ -z "$var_name" ] && continue
        value=$(echo "$value" | sed 's/#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/')
        echo "gh secret set ${var_name} --body \"${value}\""
        echo ""
    done < "$TEMP_FILE"
}

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo "✅ Sync process complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Vercel: Run 'vercel --prod' to redeploy"
echo "   2. GitHub: Variables are ready for workflows"
echo "   3. Verify in dashboards:"
echo "      - Vercel: Dashboard → Project → Settings → Environment Variables"
echo "      - GitHub: Repository → Settings → Secrets → Actions"
echo ""
