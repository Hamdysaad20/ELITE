#!/bin/bash

# Fix Paymob variable names in .env file
# This corrects variable names to match what the code expects

echo "🔧 Fixing Paymob Variable Names in .env"
echo "========================================"
echo ""

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Create backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Created backup: .env.backup.$(date +%Y%m%d_%H%M%S)"
echo ""

# Fix variable names in .env
echo "📝 Fixing variable names..."
echo ""

# Fix PAYMOB_INTEGRATION_CARD → PAYMOB_INTEGRATION_ID
sed -i.bak 's/^PAYMOB_INTEGRATION_CARD=/PAYMOB_INTEGRATION_ID=/' .env
echo "  ✅ Fixed: PAYMOB_INTEGRATION_CARD → PAYMOB_INTEGRATION_ID"

# Fix PAYMOB_INTEGRATION_WALLET → PAYMOB_WALLET_INTEGRATION_ID
sed -i.bak 's/^PAYMOB_INTEGRATION_WALLET=/PAYMOB_WALLET_INTEGRATION_ID=/' .env
echo "  ✅ Fixed: PAYMOB_INTEGRATION_WALLET → PAYMOB_WALLET_INTEGRATION_ID"

# Check if PAYMOB_PUBLIC_KEY exists, if not add it
if ! grep -q "^PAYMOB_PUBLIC_KEY=" .env; then
    # Add PAYMOB_PUBLIC_KEY after PAYMOB_SECRET_KEY
    # Use the same value as NEXT_PUBLIC_PAYMOB_PUBLIC_KEY if it exists
    PUBLIC_KEY_VALUE=$(grep "^NEXT_PUBLIC_PAYMOB_PUBLIC_KEY=" .env | cut -d'=' -f2)
    if [ -n "$PUBLIC_KEY_VALUE" ]; then
        # Insert after PAYMOB_SECRET_KEY line
        sed -i.bak "/^PAYMOB_SECRET_KEY=/,/^PAYMOB_HMAC_SECRET=/{
            /^PAYMOB_SECRET_KEY=/a\
PAYMOB_PUBLIC_KEY=${PUBLIC_KEY_VALUE}
        }" .env
        echo "  ✅ Added: PAYMOB_PUBLIC_KEY=${PUBLIC_KEY_VALUE}"
    else
        echo "  ⚠️  Warning: Could not find NEXT_PUBLIC_PAYMOB_PUBLIC_KEY to use for PAYMOB_PUBLIC_KEY"
        echo "     Please add PAYMOB_PUBLIC_KEY manually"
    fi
else
    echo "  ✅ PAYMOB_PUBLIC_KEY already exists"
fi

# Remove backup file created by sed
rm -f .env.bak

echo ""
echo "✅ Variable names fixed!"
echo ""
echo "📋 Updated variables at lines 72-88:"
sed -n '72,88p' .env
echo ""
echo "📝 Next steps:"
echo "   1. Verify the changes above"
echo "   2. Run: ./scripts/sync-paymob-vars.sh"
echo ""
