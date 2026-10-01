#!/bin/sh
set -e

PROJECT_DIR="/home/node"
BACKEND_DIR="${PROJECT_DIR}/apps/server"

cd ${BACKEND_DIR}

if [ -f "/run/secrets/db_username" ] && [ -f "/run/secrets/db_password" ]; then
    DB_USER=$(cat /run/secrets/db_username)
    DB_PASS=$(cat /run/secrets/db_password)
    DB_HOST="${DB_HOST:-localhost}"
    DB_NAME="${DB_NAME:-ft_transcendence}"

    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}?schema=public"
fi

npx prisma db push
exec "$@"
