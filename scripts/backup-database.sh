#!/bin/bash
# Backup Script for PostgreSQL and Redis
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "Starting system backups... [$DATE]"

# Backup Postgres if tools exist natively
if command -v pg_dump > /dev/null; then
    # Usually DATABASE_URL string format: postgres://user:password@host:port/dbname
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_$DATE.sql"
    echo "✅ PostgreSQL backup completed: db_$DATE.sql"
else
    echo "⚠️ pg_dump not found in PATH. Skipping PostgreSQL backup."
fi

# Backup Redis if tools exist natively
if command -v redis-cli > /dev/null; then
    redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"
    echo "✅ Redis backup completed: redis_$DATE.rdb"
else
    echo "⚠️ redis-cli not found in PATH. Skipping Redis backup."
fi

echo "Finished backup routine inside local /backups directory."
