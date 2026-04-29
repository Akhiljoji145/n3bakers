#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate

# Create admin user if it doesn't exist
# This uses the custom command we created in users/management/commands/create_admin.py
python manage.py create_admin
