#!/bin/bash

# Test Paymob integration through actual API endpoints
# This simulates the real user flow

echo "🧪 Testing Paymob Integration via API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check if server is running
echo "1️⃣ Checking if server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "   ❌ Server is not running. Please start with: npm run dev"
    exit 1
fi
echo "   ✅ Server is running"
echo ""

# Step 2: Test payment config endpoint
echo "2️⃣ Testing payment config endpoint..."
CONFIG_RESPONSE=$(curl -s http://localhost:3000/api/payments/config)
if echo "$CONFIG_RESPONSE" | grep -q "success"; then
    echo "   ✅ Payment config endpoint is working"
    echo "$CONFIG_RESPONSE" | jq '.' 2>/dev/null || echo "$CONFIG_RESPONSE"
else
    echo "   ⚠️  Payment config endpoint returned:"
    echo "$CONFIG_RESPONSE"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Basic API test complete!"
echo ""
echo "📋 To test the full flow:"
echo "   1. Go to http://localhost:3000"
echo "   2. Sign in or create account"
echo "   3. Add items to cart"
echo "   4. Go to checkout (/order)"
echo "   5. Select 'Card' payment method"
echo "   6. Place order"
echo "   7. Complete payment with test card: 4987654321098769"
echo ""
echo "💡 The payment will appear in your Paymob test account dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

