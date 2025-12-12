#!/bin/bash

# Fix environment variables that have newline characters
# Use printf instead of echo to avoid adding newlines

echo "Fixing environment variables with newlines..."

printf "smtp.gmail.com" | vercel env add EMAIL_SERVER_HOST production --force
printf "587" | vercel env add EMAIL_SERVER_PORT production --force
printf "hamdyhamadavlogs266@gmail.com" | vercel env add EMAIL_SERVER_USER production --force
printf "trhiocnqohetrucd" | vercel env add EMAIL_SERVER_PASSWORD production --force
printf "contact@jointhedragons.com" | vercel env add EMAIL_FROM production --force

printf "vc3QcntU32xYzy0raFRWtnLnRaziubVkeqYUTbUHwE8=" | vercel env add NEXTAUTH_SECRET production --force
printf "https://www.officieleliteeg.com" | vercel env add NEXTAUTH_URL production --force

printf "https://elitecoffee.odoo.com/" | vercel env add ODOO_HOST production --force
printf "elitecoffee" | vercel env add ODOO_DB production --force
printf "hamdysaad.biz@gmail.com" | vercel env add ODOO_USERNAME production --force
printf "8feabdb222853438f9e72f8c21df2e3a2cfa8f10" | vercel env add ODOO_API_KEY production --force

printf "https://www.officieleliteeg.com/api" | vercel env add NEXT_PUBLIC_API_BASE production --force
printf "https://www.officieleliteeg.com" | vercel env add NEXT_PUBLIC_APP_URL production --force
printf "https://www.officieleliteeg.com" | vercel env add NEXT_PUBLIC_API_URL production --force

echo "✅ All environment variables fixed!"
