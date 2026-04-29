#!/usr/bin/env bash
set -o errexit

python manage.py collectstatic --noinput

if [ "${VERCEL_ENV:-}" = "production" ] || [ "${RUN_DEPLOY_MIGRATIONS:-}" = "1" ]; then
  python manage.py migrate --noinput
  python manage.py create_admin
fi
