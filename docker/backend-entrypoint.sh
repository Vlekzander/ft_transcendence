#!/bin/sh
set -e

PROJECT_DIR="/home/node"
BACKEND_DIR="${PROJECT_DIR}/apps/server"

cd ${BACKEND_DIR}

export DATABASE_URL=$(node -e '
	const user = encodeURIComponent(process.env.DB_USER || "");
	const password = encodeURIComponent(process.env.DB_PASSWORD || "");
	const host = process.env.DB_HOST || "";
	const name = process.env.DB_NAME || "";
	console.log(`postgresql://${user}:${password}@${host}:5432/${name}`);
')

npx prisma db push
npx prisma generate
exec "$@"
