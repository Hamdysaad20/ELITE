#!/bin/bash

# ELITE Coffee Shop - Vercel Deployment Setup Script
# This script sets up environment variables in Vercel

echo "🚀 ELITE Coffee Shop - Vercel Deployment Setup"
echo "==============================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📝 Step 1: Login to Vercel"
echo "Please log in to your Vercel account:"
vercel login

echo ""
echo "📦 Step 2: Link project to Vercel"
echo "Creating/linking Vercel project..."
vercel link --yes

echo ""
echo "🔐 Step 3: Setting Environment Variables"
echo "Setting production environment variables..."

# Production environment variables
vercel env add NEXTAUTH_SECRET "vc3QcntU32xYzy0raFRWtnLnRaziubVkeqYUTbUHwE8=" --prod
vercel env add NEXTAUTH_URL "https://www.officieleliteeg.com" --prod
vercel env add EMAIL_SERVER_HOST "smtp.gmail.com" --prod
vercel env add EMAIL_SERVER_PORT "587" --prod
vercel env add EMAIL_SERVER_USER "hamdyhamadavlogs266@gmail.com" --prod
vercel env add EMAIL_SERVER_PASSWORD "trhiocnqohetrucd" --prod
vercel env add EMAIL_FROM "contact@jointhedragons.com" --prod
vercel env add NEXT_PUBLIC_API_BASE "https://www.officieleliteeg.com/api" --prod
vercel env add NEXT_PUBLIC_APP_URL "https://www.officieleliteeg.com" --prod
vercel env add NEXT_PUBLIC_API_URL "https://www.officieleliteeg.com" --prod

vercel env add DATABASE_URL "postgresql://neondb_owner:npg_sKaoNW7jkA6J@ep-restless-rain-a4b9pzkb-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" --prod
vercel env add POSTGRES_URL "postgresql://neondb_owner:npg_sKaoNW7jkA6J@ep-restless-rain-a4b9pzkb-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" --prod

vercel env add KV_REST_API_TOKEN "ARkeAAImcDIyODY2MTMxMWZhNTM0YmU3OTUxNWZmNzU2OGI1ZWM2NHAyNjQzMA" --prod
vercel env add KV_REST_API_URL "https://close-ibex-6430.upstash.io" --prod
vercel env add REDIS_URL "rediss://default:ARkeAAImcDIyODY2MTMxMWZhNTM0YmU3OTUxNWZmNzU2OGI1ZWM2NHAyNjQzMA@close-ibex-6430.upstash.io:6379" --prod

vercel env add ODOO_HOST "https://elitecoffee.odoo.com/" --prod
vercel env add ODOO_DB "elitecoffee" --prod
vercel env add ODOO_USERNAME "hamdysaad.biz@gmail.com" --prod
vercel env add ODOO_API_KEY "8feabdb222853438f9e72f8c21df2e3a2cfa8f10" --prod

vercel env add ADMIN_TOKEN "change-me" --prod

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "📤 Step 4: Deploying to Vercel"
echo "Deploying the application..."
vercel --prod

echo ""
echo "🎉 Deployment Complete!"
echo "Your application is now live at: https://www.officieleliteeg.com"
echo ""
echo "📊 Deployment Dashboard: https://vercel.com/dashboard"
echo "📝 View Logs: vercel logs"
