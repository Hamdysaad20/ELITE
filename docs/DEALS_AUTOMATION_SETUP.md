# Deals Automation Setup Guide

This guide explains how to set up automated product rotation for Happy Hour and Flash Sales deals.

## Overview

Both Happy Hour and Flash Sales require daily product rotation:
- **Happy Hour**: Random product gets 20% off (daily 3-6 PM)
- **Flash Sales**: Random product gets 30-50% off (daily 2-3 PM)

## Rotation Scripts

### 1. Happy Hour Product Rotation
**Script:** `scripts/rotate-happy-hour-product.ts`

**What it does:**
- Gets all eligible products from allowed categories
- Selects a random product (excludes current product)
- Updates Happy Hour Deals pricelist with new product
- Sets 20% discount

**Manual run:**
```bash
npx tsx scripts/rotate-happy-hour-product.ts
```

### 2. Flash Sales Product Rotation
**Script:** `scripts/rotate-flash-sales-product.ts`

**What it does:**
- Gets all eligible products from allowed categories
- Selects a random product (excludes current product)
- Selects a random discount (30-50%)
- Updates Flash Sales pricelist with new product and discount

**Manual run:**
```bash
npx tsx scripts/rotate-flash-sales-product.ts
```

## Automation Options

### Option 1: Cron Job (Recommended for Linux/Mac)

#### Setup Cron Jobs

1. **Open crontab:**
   ```bash
   crontab -e
   ```

2. **Add these lines:**
   ```cron
   # Happy Hour rotation - runs at 2 PM daily (before Happy Hour starts at 3 PM)
   0 14 * * * cd /path/to/ELITE && /usr/local/bin/npx tsx scripts/rotate-happy-hour-product.ts >> /tmp/happy-hour-rotation.log 2>&1

   # Flash Sales rotation - runs at 1 PM daily (before Flash Sales starts at 2 PM)
   0 13 * * * cd /path/to/ELITE && /usr/local/bin/npx tsx scripts/rotate-flash-sales-product.ts >> /tmp/flash-sales-rotation.log 2>&1
   ```

3. **Replace `/path/to/ELITE`** with your actual project path

4. **Verify npx path:**
   ```bash
   which npx
   # Use the full path in cron (e.g., /usr/local/bin/npx)
   ```

#### Cron Schedule Explanation

- `0 14 * * *` = Every day at 2:00 PM (14:00)
- `0 13 * * *` = Every day at 1:00 PM (13:00)

**Time zones:**
- Cron uses system timezone
- Make sure your server timezone is set correctly (Africa/Cairo)

### Option 2: Systemd Timer (Linux)

Create systemd service files for more control:

**1. Create service file:** `/etc/systemd/system/happy-hour-rotation.service`
```ini
[Unit]
Description=Rotate Happy Hour Product
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/ELITE
ExecStart=/usr/local/bin/npx tsx scripts/rotate-happy-hour-product.ts
User=your-user
Environment="NODE_ENV=production"
```

**2. Create timer file:** `/etc/systemd/system/happy-hour-rotation.timer`
```ini
[Unit]
Description=Daily Happy Hour Product Rotation
Requires=happy-hour-rotation.service

[Timer]
OnCalendar=*-*-* 14:00:00
Timezone=Africa/Cairo

[Install]
WantedBy=timers.target
```

**3. Enable and start:**
```bash
sudo systemctl enable happy-hour-rotation.timer
sudo systemctl start happy-hour-rotation.timer
```

### Option 3: Node.js Scheduler (Node-cron)

Create a scheduler service:

**1. Install node-cron:**
```bash
npm install node-cron
```

**2. Create:** `scripts/scheduler.ts`
```typescript
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Happy Hour rotation - 2 PM daily
cron.schedule('0 14 * * *', async () => {
  console.log('Rotating Happy Hour product...');
  try {
    await execAsync('npx tsx scripts/rotate-happy-hour-product.ts');
    console.log('Happy Hour rotation complete');
  } catch (error) {
    console.error('Happy Hour rotation failed:', error);
  }
}, {
  timezone: 'Africa/Cairo'
});

// Flash Sales rotation - 1 PM daily
cron.schedule('0 13 * * *', async () => {
  console.log('Rotating Flash Sales product...');
  try {
    await execAsync('npx tsx scripts/rotate-flash-sales-product.ts');
    console.log('Flash Sales rotation complete');
  } catch (error) {
    console.error('Flash Sales rotation failed:', error);
  }
}, {
  timezone: 'Africa/Cairo'
});

console.log('Deals rotation scheduler started');
```

**3. Run scheduler:**
```bash
npx tsx scripts/scheduler.ts
```

**4. Keep it running:**
- Use PM2: `pm2 start scripts/scheduler.ts --name deals-scheduler`
- Use systemd service
- Use Docker container

### Option 4: Odoo Automation (If Available)

If your Odoo instance supports automation:
1. Create scheduled action in Odoo
2. Use Odoo's Python API to update pricelist items
3. Schedule to run daily at specified times

## Testing Rotation

### Test Happy Hour Rotation
```bash
# Run manually
npx tsx scripts/rotate-happy-hour-product.ts

# Check logs
tail -f /tmp/happy-hour-rotation.log
```

### Test Flash Sales Rotation
```bash
# Run manually
npx tsx scripts/rotate-flash-sales-product.ts

# Check logs
tail -f /tmp/flash-sales-rotation.log
```

### Verify in Odoo
1. Go to Odoo → Sales → Pricelists
2. Open "Happy Hour Deals" or "Flash Sales"
3. Check Items tab
4. Verify product and discount are updated

### Verify on Website
1. Visit `/deals` page
2. Check Happy Hour/Flash Sales sections
3. Verify product and discount match Odoo

## Monitoring

### Check Rotation Status

**View cron logs:**
```bash
# Check if cron jobs are running
grep CRON /var/log/syslog | grep rotate

# Check rotation logs
cat /tmp/happy-hour-rotation.log
cat /tmp/flash-sales-rotation.log
```

**Check systemd timers:**
```bash
systemctl status happy-hour-rotation.timer
systemctl list-timers
```

### Alerts

Set up alerts for:
- Rotation failures
- Missing products
- Pricelist not found
- Odoo connection errors

## Troubleshooting

### Rotation Not Running

1. **Check cron service:**
   ```bash
   sudo service cron status
   ```

2. **Check cron logs:**
   ```bash
   grep CRON /var/log/syslog
   ```

3. **Test script manually:**
   ```bash
   cd /path/to/ELITE
   npx tsx scripts/rotate-happy-hour-product.ts
   ```

4. **Check environment variables:**
   - Ensure `.env` file exists
   - Verify Odoo credentials are set

### Wrong Product Selected

- Script excludes current product to avoid duplicates
- If only one product available, it will be used
- Check eligible products list in script output

### Time Zone Issues

- Ensure server timezone is correct (Africa/Cairo)
- Cron uses system timezone
- Verify rotation times match your schedule

## Best Practices

1. **Test First:** Always test rotation manually before automating
2. **Monitor Logs:** Check logs regularly for errors
3. **Backup:** Keep backup of pricelist configurations
4. **Alerts:** Set up alerts for rotation failures
5. **Documentation:** Document any custom changes

## Quick Start

**For immediate setup:**

1. **Test scripts manually:**
   ```bash
   npx tsx scripts/rotate-happy-hour-product.ts
   npx tsx scripts/rotate-flash-sales-product.ts
   ```

2. **Set up cron (if on Linux/Mac):**
   ```bash
   crontab -e
   # Add the cron jobs from above
   ```

3. **Verify:**
   - Check `/deals` page tomorrow at rotation time
   - Verify products changed

---

## Summary

- **Happy Hour**: Rotates daily at 2 PM (before 3 PM start)
- **Flash Sales**: Rotates daily at 1 PM (before 2 PM start)
- **Method**: Choose cron, systemd, or Node.js scheduler
- **Testing**: Always test manually first
- **Monitoring**: Check logs regularly

