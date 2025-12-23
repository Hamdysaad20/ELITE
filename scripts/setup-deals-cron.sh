#!/bin/bash

# Setup cron jobs for deals product rotation
# This script adds cron jobs to rotate Happy Hour and Flash Sales products daily

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================================"
echo "🔄 SETTING UP DEALS ROTATION CRON JOBS"
echo "============================================================"
echo ""

# Get full paths
HAPPY_HOUR_SCRIPT="$PROJECT_DIR/scripts/rotate-happy-hour-product.ts"
FLASH_SALES_SCRIPT="$PROJECT_DIR/scripts/rotate-flash-sales-product.ts"

# Check if scripts exist
if [ ! -f "$HAPPY_HOUR_SCRIPT" ]; then
    echo "❌ Error: Happy Hour rotation script not found: $HAPPY_HOUR_SCRIPT"
    exit 1
fi

if [ ! -f "$FLASH_SALES_SCRIPT" ]; then
    echo "❌ Error: Flash Sales rotation script not found: $FLASH_SALES_SCRIPT"
    exit 1
fi

# Get npx path
NPX_PATH=$(which npx)
if [ -z "$NPX_PATH" ]; then
    echo "❌ Error: npx not found in PATH"
    exit 1
fi

echo "Project directory: $PROJECT_DIR"
echo "NPX path: $NPX_PATH"
echo ""

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Get existing crontab (if any)
crontab -l 2>/dev/null > "$TEMP_CRON" || true

# Remove existing deals rotation jobs if they exist
sed -i.bak '/rotate-happy-hour-product/d' "$TEMP_CRON" 2>/dev/null || true
sed -i.bak '/rotate-flash-sales-product/d' "$TEMP_CRON" 2>/dev/null || true

# Add new cron jobs
echo "" >> "$TEMP_CRON"
echo "# Deals Product Rotation - Happy Hour (runs at 2 PM daily, before Happy Hour starts at 3 PM)" >> "$TEMP_CRON"
echo "0 14 * * * cd $PROJECT_DIR && $NPX_PATH tsx scripts/rotate-happy-hour-product.ts >> /tmp/happy-hour-rotation.log 2>&1" >> "$TEMP_CRON"
echo "" >> "$TEMP_CRON"
echo "# Deals Product Rotation - Flash Sales (runs at 1 PM daily, before Flash Sales starts at 2 PM)" >> "$TEMP_CRON"
echo "0 13 * * * cd $PROJECT_DIR && $NPX_PATH tsx scripts/rotate-flash-sales-product.ts >> /tmp/flash-sales-rotation.log 2>&1" >> "$TEMP_CRON"

# Install new crontab
crontab "$TEMP_CRON"

# Clean up
rm -f "$TEMP_CRON" "$TEMP_CRON.bak"

echo "✅ Cron jobs installed successfully!"
echo ""
echo "📋 Installed jobs:"
echo "   - Happy Hour rotation: Daily at 2:00 PM"
echo "   - Flash Sales rotation: Daily at 1:00 PM"
echo ""
echo "📝 View cron jobs:"
echo "   crontab -l"
echo ""
echo "📝 View logs:"
echo "   tail -f /tmp/happy-hour-rotation.log"
echo "   tail -f /tmp/flash-sales-rotation.log"
echo ""
echo "🗑️  To remove cron jobs:"
echo "   crontab -e"
echo "   (Remove the lines with rotate-happy-hour-product and rotate-flash-sales-product)"

