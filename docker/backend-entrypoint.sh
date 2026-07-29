#!/bin/sh

PROJECT_DIR="/home/node"
BACKEND_DIR="${PROJECT_DIR}/apps/server"

cd ${BACKEND_DIR}
npx prisma db push
exec "$@"
