#!/usr/bin/env bash
# exit on error
set -o errexit



python manage.py collectstatic --noinput
python manage.py migrate

# Create admin user if it doesn't exist
# This uses the custom command we created in users/management/commands/create_admin.py
python manage.py create_admin
python manage.py runserver 0.0.0.0:8000
