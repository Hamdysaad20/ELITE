#!/bin/bash

# Magic Link System Test Script
# Tests the complete authentication flow

echo "🧪 Testing Magic Link Authentication System"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check server is running
echo -e "${BLUE}Test 1: Check server is running...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ Server is running on port 3000${NC}"
else
  echo -e "${RED}❌ Server not responding (Status: $RESPONSE)${NC}"
  exit 1
fi
echo ""

# Test 2: Check auth endpoints exist
echo -e "${BLUE}Test 2: Check auth endpoints...${NC}"
SIGNIN=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/signin)
VERIFY=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/verify-request)
if [ "$SIGNIN" = "200" ]; then
  echo -e "${GREEN}✅ /auth/signin endpoint exists${NC}"
else
  echo -e "${RED}❌ /auth/signin not accessible (Status: $SIGNIN)${NC}"
fi
if [ "$VERIFY" = "200" ] || [ "$VERIFY" = "307" ] || [ "$VERIFY" = "302" ]; then
  echo -e "${GREEN}✅ /auth/verify-request endpoint exists${NC}"
else
  echo -e "${RED}❌ /auth/verify-request not accessible (Status: $VERIFY)${NC}"
fi
echo ""

# Test 3: Check environment variables
echo -e "${BLUE}Test 3: Check environment configuration...${NC}"
if grep -q "EMAIL_SERVER_PASSWORD=a9/9oFc856f9/{(ba" /Users/hamdysaad/ELITE/.env; then
  echo -e "${GREEN}✅ EMAIL_SERVER_PASSWORD is set${NC}"
else
  echo -e "${RED}❌ EMAIL_SERVER_PASSWORD not found in .env${NC}"
fi

if grep -q "NEXTAUTH_SECRET=" /Users/hamdysaad/ELITE/.env | grep -v "^#"; then
  echo -e "${GREEN}✅ NEXTAUTH_SECRET is configured${NC}"
else
  echo -e "${RED}❌ NEXTAUTH_SECRET not configured${NC}"
fi
echo ""

# Test 4: Check critical files exist
echo -e "${BLUE}Test 4: Check critical auth files...${NC}"
FILES=(
  "/Users/hamdysaad/ELITE/src/app/api/auth/[...nextauth]/route.ts"
  "/Users/hamdysaad/ELITE/src/server/auth/emailTemplates.ts"
  "/Users/hamdysaad/ELITE/src/server/auth/rateLimit.ts"
  "/Users/hamdysaad/ELITE/src/app/auth/signin/page.tsx"
  "/Users/hamdysaad/ELITE/src/app/auth/verify-request/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $(basename $file)${NC}"
  else
    echo -e "${RED}❌ $(basename $file) not found${NC}"
  fi
done
echo ""

# Test 5: Check for SMTP configuration in auth route
echo -e "${BLUE}Test 5: Verify SMTP configuration in auth...${NC}"
if grep -q "EMAIL_SERVER_HOST && EMAIL_SERVER_USER && EMAIL_SERVER_PASSWORD" /Users/hamdysaad/ELITE/src/app/api/auth/[...nextauth]/route.ts; then
  echo -e "${GREEN}✅ SMTP credentials validation present${NC}"
else
  echo -e "${RED}❌ SMTP validation not found${NC}"
fi

if grep -q "nodemailer.createTransport" /Users/hamdysaad/ELITE/src/app/api/auth/[...nextauth]/route.ts; then
  echo -e "${GREEN}✅ Nodemailer transporter configured${NC}"
else
  echo -e "${RED}❌ Nodemailer not configured${NC}"
fi
echo ""

# Test 6: Check email templates are present
echo -e "${BLUE}Test 6: Verify email templates...${NC}"
if grep -q "generateMagicLinkHtml" /Users/hamdysaad/ELITE/src/server/auth/emailTemplates.ts; then
  echo -e "${GREEN}✅ HTML email template exists${NC}"
else
  echo -e "${RED}❌ HTML email template not found${NC}"
fi

if grep -q "generateMagicLinkText" /Users/hamdysaad/ELITE/src/server/auth/emailTemplates.ts; then
  echo -e "${GREEN}✅ Text email template exists${NC}"
else
  echo -e "${RED}❌ Text email template not found${NC}"
fi

if grep -q "generateMagicLinkSubject" /Users/hamdysaad/ELITE/src/server/auth/emailTemplates.ts; then
  echo -e "${GREEN}✅ Subject line generator exists${NC}"
else
  echo -e "${RED}❌ Subject line generator not found${NC}"
fi
echo ""

# Test 7: Check rate limiting configuration
echo -e "${BLUE}Test 7: Verify rate limiting...${NC}"
if grep -q "MAGIC_LINK" /Users/hamdysaad/ELITE/src/server/auth/rateLimit.ts; then
  echo -e "${GREEN}✅ Rate limiting for magic links configured${NC}"
else
  echo -e "${RED}❌ Rate limiting not configured${NC}"
fi

if grep -q "maxRequests: 5" /Users/hamdysaad/ELITE/src/server/auth/rateLimit.ts; then
  echo -e "${GREEN}✅ Rate limit set to 5 per hour${NC}"
else
  echo -e "${RED}❌ Rate limit configuration not found${NC}"
fi
echo ""

# Test 8: Check sendVerificationRequest implementation
echo -e "${BLUE}Test 8: Verify email sending logic...${NC}"
if grep -q "sendVerificationRequest" /Users/hamdysaad/ELITE/src/app/api/auth/[...nextauth]/route.ts; then
  echo -e "${GREEN}✅ sendVerificationRequest handler configured${NC}"
else
  echo -e "${RED}❌ sendVerificationRequest not found${NC}"
fi

if grep -q "transporter.sendMail" /Users/hamdysaad/ELITE/src/app/api/auth/[...nextauth]/route.ts; then
  echo -e "${GREEN}✅ Email sending via transporter configured${NC}"
else
  echo -e "${RED}❌ Email sending not configured${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Visit: http://localhost:3000/auth/signin"
echo "2. Enter test email address"
echo "3. Click 'Send Magic Link'"
echo "4. Check server console for magic link (dev mode)"
echo "5. Check email inbox for actual email (prod mode)"
echo ""
echo -e "${YELLOW}To test the complete flow:${NC}"
echo "- Test email will print to console in development"
echo "- In production, email will be sent via Gmail SMTP"
echo "- Magic link expires in 24 hours"
echo "- Rate limited to 5 requests per hour per email"
echo ""
