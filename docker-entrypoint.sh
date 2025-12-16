#!/bin/sh
set -e

# Ensure the directories that host runtime data/logs exist before Prisma touches the DB.
APP_DIR=/app
mkdir -p "$APP_DIR/data" "$APP_DIR/logs"
chown -R nodeuser:nodegroup "$APP_DIR/data" "$APP_DIR/logs"

# Run Prisma migrations (push schema) before starting the Next.js server.
# Skip client generation because the optimized build already ships the generated client.
su-exec nodeuser npm run db:push -- --skip-generate

# Drop to nodeuser and run whatever command was passed (`CMD` in the Dockerfile).
exec su-exec nodeuser "$@"
