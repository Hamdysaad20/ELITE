#!/bin/bash

# Update Vercel environment variables for production
# Using printf to avoid trailing newlines

echo "Updating Vercel Production Environment Variables..."

# Critical Auth & Email
printf '%s' "vc3QcntU32xYzy0raFRWtnLnRaziubVkeqYUTbUHwE8=" | vercel env add NEXTAUTH_SECRET production
printf '%s' "https://www.officieleliteeg.com" | vercel env add NEXTAUTH_URL production
printf '%s' "smtp.gmail.com" | vercel env add EMAIL_SERVER_HOST production
printf '%s' "587" | vercel env add EMAIL_SERVER_PORT production
printf '%s' "hamdyhamadavlogs266@gmail.com" | vercel env add EMAIL_SERVER_USER production
printf '%s' "trhiocnqohetrucd" | vercel env add EMAIL_SERVER_PASSWORD production
printf '%s' "contact@jointhedragons.com" | vercel env add EMAIL_FROM production

# Database & Cache
printf '%s' "postgresql://neondb_owner:npg_sKaoNW7jkA6J@ep-restless-rain-a4b9pzkb-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" | vercel env add DATABASE_URL production
printf '%s' "rediss://default:ARkeAAImcDIyODY2MTMxMWZhNTM0YmU3OTUxNWZmNzU2OGI1ZWM2NHAyNjQzMA@close-ibex-6430.upstash.io:6379" | vercel env add REDIS_URL production

# Odoo Integration
printf '%s' "https://elitecoffee.odoo.com/" | vercel env add ODOO_HOST production
printf '%s' "elitecoffee" | vercel env add ODOO_DB production
printf '%s' "hamdysaad.biz@gmail.com" | vercel env add ODOO_USERNAME production
printf '%s' "8feabdb222853438f9e72f8c21df2e3a2cfa8f10" | vercel env add ODOO_API_KEY production

# Public URLs
printf '%s' "https://www.officieleliteeg.com/api" | vercel env add NEXT_PUBLIC_API_BASE production
printf '%s' "https://www.officieleliteeg.com" | vercel env add NEXT_PUBLIC_APP_URL production
printf '%s' "https://www.officieleliteeg.com" | vercel env add NEXT_PUBLIC_API_URL production

echo "✅ Environment variables updated successfully!"
echo "Run 'vercel --prod' to redeploy with new variables"
