#!/bin/bash

# Script to push environment variables to Vercel
# Usage: ./scripts/push-env-to-vercel.sh

echo "🚀 Pushing environment variables to Vercel..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Critical environment variables
echo "📋 Pushing critical environment variables..."

# NextAuth
vercel env add NEXTAUTH_SECRET production < <(grep "^NEXTAUTH_SECRET=" .env | cut -d'=' -f2-)
vercel env add NEXTAUTH_URL production < <(grep "^NEXTAUTH_URL=" .env | cut -d'=' -f2-)

# Email
vercel env add EMAIL_SERVER_HOST production < <(grep "^EMAIL_SERVER_HOST=" .env | cut -d'=' -f2-)
vercel env add EMAIL_SERVER_PORT production < <(grep "^EMAIL_SERVER_PORT=" .env | cut -d'=' -f2-)
vercel env add EMAIL_SERVER_USER production < <(grep "^EMAIL_SERVER_USER=" .env | cut -d'=' -f2-)
vercel env add EMAIL_SERVER_PASSWORD production < <(grep "^EMAIL_SERVER_PASSWORD=" .env | cut -d'=' -f2-)
vercel env add EMAIL_FROM production < <(grep "^EMAIL_FROM=" .env | cut -d'=' -f2-)

# Database
vercel env add DATABASE_URL production < <(grep "^DATABASE_URL=" .env | head -1 | cut -d'=' -f2-)

# Redis
vercel env add REDIS_URL production < <(grep "^REDIS_URL=" .env | head -1 | cut -d'=' -f2-)

# Odoo
vercel env add ODOO_HOST production < <(grep "^ODOO_HOST=" .env | cut -d'=' -f2-)
vercel env add ODOO_DB production < <(grep "^ODOO_DB=" .env | cut -d'=' -f2-)
vercel env add ODOO_USERNAME production < <(grep "^ODOO_USERNAME=" .env | cut -d'=' -f2-)
vercel env add ODOO_API_KEY production < <(grep "^ODOO_API_KEY=" .env | cut -d'=' -f2-)

# Public URLs
vercel env add NEXT_PUBLIC_API_BASE production < <(grep "^NEXT_PUBLIC_API_BASE=" .env | cut -d'=' -f2-)
vercel env add NEXT_PUBLIC_APP_URL production < <(grep "^NEXT_PUBLIC_APP_URL=" .env | cut -d'=' -f2-)
vercel env add NEXT_PUBLIC_API_URL production < <(grep "^NEXT_PUBLIC_API_URL=" .env | cut -d'=' -f2-)

echo ""
echo "✅ Environment variables pushed to Vercel!"
echo ""
echo "🔄 Now redeploy your project in Vercel dashboard or run:"
echo "   vercel --prod"
