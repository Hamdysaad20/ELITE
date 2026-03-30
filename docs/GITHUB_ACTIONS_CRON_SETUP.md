# GitHub Actions Cron Setup Guide

## Overview

GitHub Actions provides **free** cron job scheduling for public repositories, allowing you to run tasks every 5 minutes (or any interval) without upgrading your Vercel plan.

---

## ✅ Benefits

- **Free**: Unlimited runs for public repos
- **Flexible**: Run every 5 minutes (or any interval)
- **Reliable**: GitHub's infrastructure
- **Logs**: Full execution history in GitHub
- **Manual Trigger**: Can trigger manually via GitHub UI
- **Notifications**: GitHub account notifications on workflow failures

---

## 📋 Setup Instructions

### 1. Create GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

1. **`VERCEL_URL`**
   - Value: Your production URL (e.g., `https://www.officieleliteeg.com`)
   - Used to call your API endpoints

2. **`ADMIN_TOKEN`**
   - Value: Your `ADMIN_TOKEN` from `.env` (same as used in Vercel)
   - Used to authenticate API calls

### 2. Workflows Created

Three workflow files have been created:

#### `/.github/workflows/sync-products.yml`
- **Schedule**: Every 5 minutes
- **Purpose**: Sync products from Odoo to Redis
- **Endpoint**: `POST /api/sync/products`

#### `/.github/workflows/retry-odoo-sync.yml`
- **Schedule**: Daily at 3 AM UTC
- **Purpose**: Retry failed Odoo syncs
- **Endpoint**: `POST /api/cron/retry-odoo-sync`

#### `/.github/workflows/new-product-launch.yml`
- **Schedule**: Daily at 2 AM UTC
- **Purpose**: Update New Product Launch pricelist
- **Runs**: The TypeScript script directly (needs Node.js)

---

## 🔧 Configuration

### Change Sync Frequency

Edit `.github/workflows/sync-products.yml`:

```yaml
schedule:
  # Every 5 minutes
  - cron: '*/5 * * * *'
  
  # Every 10 minutes
  - cron: '*/10 * * * *'
  
  # Every hour
  - cron: '0 * * * *'
```

### Cron Expression Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Examples:**
- `*/5 * * * *` - Every 5 minutes
- `0 */2 * * *` - Every 2 hours
- `0 2 * * *` - Daily at 2 AM UTC
- `0 9 * * 1-5` - Weekdays at 9 AM UTC

---

## 🚀 Usage

### Automatic Execution

Workflows run automatically based on their schedule. No action needed!

### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select the workflow (e.g., "Sync Products from Odoo")
3. Click **Run workflow** → **Run workflow**

### View Logs

1. Go to **Actions** tab
2. Click on a workflow run
3. Click on the job to see detailed logs

---

## 🔒 Security

### Secrets Management

- Secrets are encrypted and only visible to repository admins
- Never commit secrets to code
- Use GitHub Secrets for all sensitive values

### API Authentication

- All API calls use `x-admin-token` header
- Token is stored in GitHub Secrets
- Never logged in workflow output

---

## 📊 Monitoring

### Check Workflow Status

- **Green checkmark**: Success
- **Red X**: Failure
- **Yellow circle**: In progress

### GitHub Notifications

GitHub will email you when:
- A workflow fails
- A workflow is disabled due to errors

Configure in: **Settings** → **Notifications** → **Actions**

---

## 🆚 Comparison: GitHub Actions vs Vercel Cron

| Feature | GitHub Actions | Vercel Cron (Hobby) |
|---------|----------------|---------------------|
| **Cost** | Free (public repos) | Free (1/day limit) |
| **Frequency** | Every 5 min ✅ | Once per day ❌ |
| **Logs** | Full history ✅ | Limited |
| **Manual Trigger** | Yes ✅ | No |
| **Setup** | YAML files | `vercel.json` |
| **Reliability** | High ✅ | High ✅ |

---

## 🎯 Recommended Setup

### For Your Use Case

1. **Product Sync (every 5 min)**: Use GitHub Actions ✅
2. **Odoo Retry (daily)**: Use GitHub Actions ✅
3. **New Product Launch (daily)**: Use GitHub Actions ✅

### Update `vercel.json`

You can now remove the cron jobs from `vercel.json` since GitHub Actions handles them:

```json
{
  "crons": [], // Empty - handled by GitHub Actions
  ...
}
```

**OR** keep them as backup (they'll only run once per day anyway).

---

## 🐛 Troubleshooting

### Workflow Not Running

1. Check if repository is **public** (required for free cron)
2. Verify cron syntax is correct
3. Check GitHub Actions is enabled: **Settings** → **Actions** → **General**

### API Calls Failing

1. Verify `VERCEL_URL` secret is correct
2. Verify `ADMIN_TOKEN` secret matches your `.env`
3. Check API endpoint is accessible
4. Review workflow logs for error details

### Timeout Issues

- Increase `timeout-minutes` in workflow file
- Check API endpoint performance
- Consider optimizing sync process

---

## 📝 Next Steps

1. ✅ Add secrets to GitHub repository
2. ✅ Push workflow files to repository
3. ✅ Test manual trigger
4. ✅ Monitor first automatic run
5. ✅ (Optional) Remove Vercel cron jobs

---

## 💡 Tips

- **Test First**: Use `workflow_dispatch` to test manually before relying on schedule
- **Monitor**: Check Actions tab regularly for failures
- **Logs**: Review logs to optimize sync performance
- **Backup**: Keep Vercel cron as backup (runs once/day anyway)

---

## Status: ✅ Ready to Use

Once you add the secrets and push the workflows, they'll start running automatically!

