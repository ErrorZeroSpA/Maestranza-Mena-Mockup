#!/usr/bin/env bash
# Respaldo diario de Postgres. Cron: 0 3 * * * /opt/sgo/infra/backup.sh
set -euo pipefail
DIR=/var/backups/sgo; mkdir -p "$DIR"
docker compose -f /opt/sgo/docker-compose.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$DIR/sgo-$(date +%F).sql.gz"
find "$DIR" -name 'sgo-*.sql.gz' -mtime +14 -delete
