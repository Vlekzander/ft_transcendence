#!/bin/sh
set -e

PROJECT_DIR="/home/node"
BACKEND_DIR="${PROJECT_DIR}/apps/server"

cd ${BACKEND_DIR}

DB_USER="${DB_USER:-$([ -f /run/secrets/db_username ] && cat /run/secrets/db_username || echo "user")}"
DB_PASSWORD="${DB_PASSWORD:-$([ -f /run/secrets/db_password ] && cat /run/secrets/db_password || echo "pass")}"
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-ft_transcendence}"

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public"

npx prisma db push
npx prisma generate
exec "$@"
