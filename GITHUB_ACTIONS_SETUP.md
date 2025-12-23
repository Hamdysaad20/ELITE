# 🚀 GitHub Actions Cron Setup - Quick Start

## ✅ What's Been Created

Three workflow files are ready in `.github/workflows/`:

1. **`sync-products.yml`** - Syncs products every 5 minutes
2. **`retry-odoo-sync.yml`** - Retries Odoo sync daily at 3 AM
3. **`new-product-launch.yml`** - Updates new product deals daily at 2 AM

---

## 🔑 Required Setup (5 minutes)

### Step 1: Add GitHub Secrets

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these two secrets:

#### Secret 1: `VERCEL_URL`
- **Name**: `VERCEL_URL`
- **Value**: Your production URL
  - Example: `https://www.officieleliteeg.com`
  - Or: `https://your-app.vercel.app`

#### Secret 2: `ADMIN_TOKEN`
- **Name**: `ADMIN_TOKEN`
- **Value**: Copy from your `.env` file
  - Same value as `ADMIN_TOKEN` in your Vercel environment variables

---

## 🎯 How It Works

### Product Sync (Every 5 Minutes)
```yaml
Schedule: */5 * * * * (every 5 minutes)
Action: POST /api/sync/products
Headers: x-admin-token: ${{ secrets.ADMIN_TOKEN }}
```

### Odoo Retry (Daily)
```yaml
Schedule: 0 3 * * * (3 AM UTC daily)
Action: GET /api/cron/retry-odoo-sync
Headers: x-admin-token: ${{ secrets.ADMIN_TOKEN }}
Note: Also accepts CRON_SECRET via Authorization header (for Vercel cron)
```

### New Product Launch (Daily)
```yaml
Schedule: 0 2 * * * (2 AM UTC daily)
Action: Runs TypeScript script directly
Script: scripts/create-new-product-launch-pricelist.ts
```

---

## 📋 Next Steps

1. ✅ **Add secrets** (see Step 1 above)
2. ✅ **Commit and push** the workflow files
3. ✅ **Test manually**: Go to Actions tab → Select workflow → Run workflow
4. ✅ **Monitor**: Check Actions tab for execution logs

---

## 🔍 Verify It's Working

### Check Workflow Runs

1. Go to **Actions** tab in GitHub
2. You should see:
   - "Sync Products from Odoo"
   - "Retry Odoo Sync"
   - "Update New Product Launch Deals"

### Test Manual Trigger

1. Click on a workflow
2. Click **Run workflow** → **Run workflow**
3. Watch it execute in real-time

### View Logs

- Click on any workflow run
- Click on the job name
- See detailed execution logs

---

## ⚙️ Customize Schedule

Edit the cron expression in any workflow file:

```yaml
schedule:
  - cron: '*/5 * * * *'  # Every 5 minutes
  # Change to:
  - cron: '*/10 * * * *' # Every 10 minutes
  - cron: '0 * * * *'    # Every hour
  - cron: '0 9 * * *'    # Daily at 9 AM UTC
```

---

## 🆚 Vercel Cron vs GitHub Actions

| Feature | Vercel (Hobby) | GitHub Actions |
|---------|----------------|----------------|
| **Cost** | Free (1/day) | Free (unlimited) |
| **Frequency** | Once/day max | Every 5 min ✅ |
| **Setup** | `vercel.json` | YAML files |
| **Logs** | Limited | Full history ✅ |
| **Manual Trigger** | No | Yes ✅ |

**Recommendation**: Use GitHub Actions for frequent syncs, keep Vercel cron as backup.

---

## 🔒 Security Notes

- ✅ Secrets are encrypted in GitHub
- ✅ Never logged in workflow output
- ✅ Only repository admins can see secrets
- ✅ API calls use `x-admin-token` header

---

## 🐛 Troubleshooting

### Workflow Not Running?
- Check repository is **public** (required for free cron)
- Verify cron syntax: Use [crontab.guru](https://crontab.guru)
- Check Actions is enabled: Settings → Actions → General

### API Calls Failing?
- Verify `VERCEL_URL` secret is correct (include `https://`)
- Verify `ADMIN_TOKEN` matches your `.env` file
- Check API endpoint is accessible from internet
- Review workflow logs for detailed errors

### Timeout Issues?
- Increase `timeout-minutes` in workflow
- Check API endpoint performance
- Consider optimizing sync process

---

## ✅ Status

**Ready to use!** Just add the secrets and push to GitHub.

---

## 📞 Support

- GitHub Actions Docs: https://docs.github.com/en/actions
- Cron Expression Help: https://crontab.guru
- Workflow logs: Repository → Actions tab

