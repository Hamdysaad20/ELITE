# ELITE Coffee Shop - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### Option 1: Automatic Deployment (Recommended)
```bash
chmod +x deploy-to-vercel.sh
./deploy-to-vercel.sh
```

This script will:
1. Login to Vercel
2. Link your project
3. Set all environment variables
4. Deploy to production

---

### Option 2: Manual Deployment via Vercel Dashboard

#### Step 1: Create Vercel Account & Project
1. Go to https://vercel.com
2. Sign up or log in with GitHub
3. Click "New Project"
4. Select your repository: `Hamdysaad20/ELITE`
5. Click "Import"

#### Step 2: Configure Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add:

**Production (.prod)**
```
NEXTAUTH_SECRET=vc3QcntU32xYzy0raFRWtnLnRaziubVkeqYUTbUHwE8=
NEXTAUTH_URL=https://www.officieleliteeg.com
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=hamdyhamadavlogs266@gmail.com
EMAIL_SERVER_PASSWORD=trhiocnqohetrucd
EMAIL_FROM=contact@jointhedragons.com
NEXT_PUBLIC_API_BASE=https://www.officieleliteeg.com/api
NEXT_PUBLIC_APP_URL=https://www.officieleliteeg.com
NEXT_PUBLIC_API_URL=https://www.officieleliteeg.com

DATABASE_URL=postgresql://neondb_owner:npg_sKaoNW7jkA6J@ep-restless-rain-a4b9pzkb-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL=postgresql://neondb_owner:npg_sKaoNW7jkA6J@ep-restless-rain-a4b9pzkb-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

KV_REST_API_TOKEN=ARkeAAImcDIyODY2MTMxMWZhNTM0YmU3OTUxNWZmNzU2OGI1ZWM2NHAyNjQzMA
KV_REST_API_URL=https://close-ibex-6430.upstash.io
REDIS_URL=rediss://default:ARkeAAImcDIyODY2MTMxMWZhNTM0YmU3OTUxNWZmNzU2OGI1ZWM2NHAyNjQzMA@close-ibex-6430.upstash.io:6379

ODOO_HOST=https://elitecoffee.odoo.com/
ODOO_DB=elitecoffee
ODOO_USERNAME=hamdysaad.biz@gmail.com
ODOO_API_KEY=8feabdb222853438f9e72f8c21df2e3a2cfa8f10

ADMIN_TOKEN=change-me
```

#### Step 3: Deploy
Click "Deploy" button in Vercel Dashboard

---

## 📋 Environment Variables Breakdown

### Authentication
- `NEXTAUTH_SECRET`: NextAuth encryption key
- `NEXTAUTH_URL`: Your production domain

### Email Service
- `EMAIL_SERVER_HOST`: Gmail SMTP server
- `EMAIL_SERVER_PORT`: SMTP port (587)
- `EMAIL_SERVER_USER`: Gmail account
- `EMAIL_SERVER_PASSWORD`: Gmail app password
- `EMAIL_FROM`: Sender email address

### Database
- `DATABASE_URL`: Neon PostgreSQL connection string (pooled)
- `POSTGRES_URL`: Vercel Postgres template variable

### Cache & Queue
- `KV_REST_API_TOKEN`: Upstash Redis token
- `KV_REST_API_URL`: Upstash Redis URL
- `REDIS_URL`: Redis connection string

### ERP Integration
- `ODOO_HOST`: Odoo server URL
- `ODOO_DB`: Odoo database name
- `ODOO_USERNAME`: Odoo login email
- `ODOO_API_KEY`: Odoo API token

### API
- `NEXT_PUBLIC_API_BASE`: API base URL (public)
- `NEXT_PUBLIC_APP_URL`: App URL (public)
- `NEXT_PUBLIC_API_URL`: API endpoint (public)

---

## ✅ Verification Checklist

After deployment:

- [ ] Build completes successfully (check Deployments tab)
- [ ] Homepage loads at https://www.officieleliteeg.com
- [ ] Magic link email sends (test auth flow)
- [ ] Products load from Odoo
- [ ] Orders can be placed
- [ ] Admin sync works (/api/sync/products)
- [ ] No console errors in browser

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/dashboard/project/[project-name]/settings
- **Environment Variables**: https://vercel.com/dashboard/project/[project-name]/settings/environment-variables
- **Deployments**: https://vercel.com/dashboard/project/[project-name]/deployments
- **Analytics**: https://vercel.com/dashboard/project/[project-name]/analytics

---

## 🐛 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify database connection string is correct
- Check git push completed successfully

### Magic Link Email Not Sending
- Verify `EMAIL_SERVER_PASSWORD` is correct Gmail app password
- Check email logs in Vercel dashboard

### Odoo Sync Not Working
- Verify `ODOO_API_KEY` is valid
- Check Odoo server is accessible from Vercel

### Database Connection Error
- Verify `DATABASE_URL` and `POSTGRES_URL` are identical
- Check Neon whitelist allows Vercel IPs

---

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Review `.env` production values
3. Verify all secrets are set correctly
4. Check firewall/whitelist settings for database

Good luck! 🚀
