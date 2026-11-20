#!/bin/sh
# Runs once, on the first start of an empty data volume: creates the app_runtime role (RLS).
set -e
psql -v ON_ERROR_STOP=1 -v runtime_password="$APP_RUNTIME_PASSWORD" \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /rls-setup.sql
