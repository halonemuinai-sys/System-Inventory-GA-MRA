#!/bin/sh
set -e

BACKUP_DIR="/backups"
KEEP_DAYS=${BACKUP_KEEP_DAYS:-7}
INTERVAL=${BACKUP_INTERVAL_SECONDS:-86400}

echo "=== DATABASE BACKUP DAEMON STARTED ==="
echo "Backup Output Directory: ${BACKUP_DIR}"
echo "Retention Period: ${KEEP_DAYS} days"
echo "Backup Interval: ${INTERVAL} seconds"

# Ensure output directory exists
mkdir -p "$BACKUP_DIR"

# Function to run pg_dump safely by stripping schema query parameter
run_safe_dump() {
  CONN_URL="$1"
  OUT_FILE="$2"
  ERR_FILE="$3"

  # Strip schema param from connection string and pass to pg_dump --schema
  if echo "$CONN_URL" | grep -q "schema="; then
    SCHEMA_NAME=$(echo "$CONN_URL" | sed -E 's/.*[?&]schema=([^&]*).*/\1/')
    # Remove schema parameter from URI
    CLEANED_URL=$(echo "$CONN_URL" | sed -E 's/([?&])schema=[^&]*&?/\1/g' | sed -E 's/[?&]$//')
    echo "Extracted schema: $SCHEMA_NAME"
    MASKED_URL=$(echo "$CLEANED_URL" | sed -E 's/:([^@:]*)@/:****@/g')
    echo "pg_dump target: $MASKED_URL"
    pg_dump "$CLEANED_URL" --schema="$SCHEMA_NAME" -F p > "$OUT_FILE" 2>"$ERR_FILE"
  else
    MASKED_URL=$(echo "$CONN_URL" | sed -E 's/:([^@:]*)@/:****@/g')
    echo "pg_dump target: $MASKED_URL"
    pg_dump "$CONN_URL" -F p > "$OUT_FILE" 2>"$ERR_FILE"
  fi
}

while true; do
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  echo "--------------------------------------------------"
  echo "Starting backup process at $(date)..."

  # 1. Backup GA Database (db ga mra)
  if [ -n "$DATABASE_URL" ]; then
    echo "Backing up GA Database (db ga mra)..."
    GA_FILE="${BACKUP_DIR}/db_ga_mra_backup_${TIMESTAMP}.sql"
    
    # Run pg_dump and capture error logs
    if run_safe_dump "$DATABASE_URL" "$GA_FILE" "/tmp/pg_dump_ga.log"; then
      echo "GA Database backup successful: $(basename "$GA_FILE")"
      gzip -f "$GA_FILE"
      echo "Compressed: $(basename "$GA_FILE").gz"
    else
      echo "ERROR: GA Database backup failed!"
      cat /tmp/pg_dump_ga.log
      rm -f "$GA_FILE"
    fi
  else
    echo "WARNING: DATABASE_URL is not set. Skipping GA Database backup."
  fi

  # 2. Backup IT Helpdesk Database
  if [ -n "$HELPDESK_DATABASE_URL" ]; then
    echo "Backing up IT Helpdesk Database..."
    HD_FILE="${BACKUP_DIR}/db_it_helpdesk_backup_${TIMESTAMP}.sql"
    
    # Run pg_dump and capture error logs
    if run_safe_dump "$HELPDESK_DATABASE_URL" "$HD_FILE" "/tmp/pg_dump_hd.log"; then
      echo "IT Helpdesk Database backup successful: $(basename "$HD_FILE")"
      gzip -f "$HD_FILE"
      echo "Compressed: $(basename "$HD_FILE").gz"
    else
      echo "ERROR: IT Helpdesk Database backup failed!"
      cat /tmp/pg_dump_hd.log
      rm -f "$HD_FILE"
    fi
  else
    echo "WARNING: HELPDESK_DATABASE_URL is not set. Skipping IT Helpdesk Database backup."
  fi

  # 3. Clean up old backups (Retention)
  echo "Cleaning up backups older than ${KEEP_DAYS} days..."
  # Clean up compressed (.gz) and uncompressed (.sql) backups
  find "$BACKUP_DIR" -type f \( -name "db_ga_mra_backup_*" -o -name "db_it_helpdesk_backup_*" \) -mtime +"$KEEP_DAYS" -exec rm -f {} \;
  echo "Clean up completed."

  echo "Backup cycle finished at $(date). Next backup in ${INTERVAL} seconds..."
  sleep "$INTERVAL"
done
