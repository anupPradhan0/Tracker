#!/bin/sh
set -e

cd /app/apps/server

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting API..."
exec node dist/index.js
