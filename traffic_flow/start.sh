#!/bin/sh

set -e

echo "run db migration"
goose postgres "$DB_SOURCE" -dir /app/migration up

echo "start the app"
exec "$@"