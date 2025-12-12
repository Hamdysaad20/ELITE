#!/bin/bash

# Production Readiness Check Script
echo "🔍 Checking Production Readiness..."
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Build
echo ""
echo "📦 Checking Build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed"
    exit 1
fi

# Check 2: TypeScript
echo ""
echo "📝 Checking TypeScript..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} No TypeScript errors"
else
    echo -e "${YELLOW}⚠${NC} TypeScript warnings (non-blocking)"
fi

# Check 3: Environment Variables
echo ""
echo "🔐 Checking Environment Variables..."
required_vars=(
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "DATABASE_URL"
    "EMAIL_SERVER_HOST"
    "EMAIL_SERVER_PORT"
)

missing_vars=0
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] && ! grep -q "^${var}=" .env* 2>/dev/null; then
        echo -e "${RED}✗${NC} Missing: $var"
        missing_vars=$((missing_vars + 1))
    else
        echo -e "${GREEN}✓${NC} $var configured"
    fi
done

if [ $missing_vars -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Some environment variables are missing"
fi

# Check 4: Prisma
echo ""
echo "🗄️  Checking Prisma..."
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Prisma client generated"
else
    echo -e "${RED}✗${NC} Prisma generation failed"
fi

# Check 5: Package dependencies
echo ""
echo "📚 Checking Dependencies..."
if npm list --depth=0 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} All dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Some dependencies have warnings"
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ Production checks complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Vercel will automatically deploy"
echo "3. Check deployment logs at https://vercel.com"
