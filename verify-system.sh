#!/bin/bash

echo "=========================================="
echo "🔍 MAGIC LINK SYSTEM VERIFICATION"
echo "=========================================="
echo ""

# Check 1: Environment variables
echo "✓ Checking .env configuration..."
if grep -q "^EMAIL_SERVER_PASSWORD=" .env; then
  echo "  ✅ EMAIL_SERVER_PASSWORD: SET AND UNCOMMENTED"
else
  echo "  ❌ EMAIL_SERVER_PASSWORD: NOT SET"
fi

if grep -q "^EMAIL_SERVER_HOST=smtp.gmail.com" .env; then
  echo "  ✅ EMAIL_SERVER_HOST: smtp.gmail.com"
fi

if grep -q "^EMAIL_SERVER_PORT=587" .env; then
  echo "  ✅ EMAIL_SERVER_PORT: 587"
fi

if grep -q "^EMAIL_FROM=contact@jointhedragons.com" .env; then
  echo "  ✅ EMAIL_FROM: contact@jointhedragons.com"
fi

echo ""
echo "✓ Checking critical auth files..."

# Check 2: Auth route file
if [ -f "src/app/api/auth/\[...nextauth\]/route.ts" ]; then
  echo "  ✅ NextAuth route: EXISTS"
  if grep -q "EmailProvider" src/app/api/auth/\[...nextauth\]/route.ts; then
    echo "  ✅ Email Provider: CONFIGURED"
  fi
fi

# Check 3: Sign-in page
if [ -f "src/app/auth/signin/page.tsx" ]; then
  echo "  ✅ Sign-in page: EXISTS"
fi

# Check 4: Verify-request page
if [ -f "src/app/auth/verify-request/page.tsx" ]; then
  echo "  ✅ Verify-request page: EXISTS"
fi

# Check 5: Email templates
if [ -f "src/server/auth/emailTemplates.ts" ]; then
  echo "  ✅ Email templates: EXISTS"
  if grep -q "generateMagicLinkHtml" src/server/auth/emailTemplates.ts; then
    echo "  ✅ HTML template function: PRESENT"
  fi
fi

# Check 6: Rate limiting
if [ -f "src/server/auth/rateLimit.ts" ]; then
  echo "  ✅ Rate limiting: EXISTS"
  if grep -q "MAGIC_LINK" src/server/auth/rateLimit.ts; then
    echo "  ✅ Magic link rate limit: CONFIGURED"
  fi
fi

# Check 7: Database schema
if [ -f "prisma/schema.prisma" ]; then
  echo "  ✅ Prisma schema: EXISTS"
  if grep -q "VerificationToken" prisma/schema.prisma; then
    echo "  ✅ VerificationToken table: PRESENT"
  fi
fi

echo ""
echo "=========================================="
echo "✅ VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "📌 NEXT: Run 'npm run dev' and test signing in"
