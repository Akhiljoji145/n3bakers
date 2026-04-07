# Render Deploy

This repo is set up to deploy the Django backend to Render.

## Files added

- `render.yaml`: Render Blueprint definition
- `backend/build.sh`: Render build script
- `backend/requirements.txt`: Python dependencies for Render
- `deploy-render.bat`: Windows helper to validate the backend locally before pushing

## What Render will deploy

- Service: Django backend in `backend/`
- Database: Render PostgreSQL

The Expo frontend is not deployed to Render as a mobile app. After the backend is live, point the frontend API URL to the Render backend.

## Local preparation on Windows

Run from the repo root:

```bat
deploy-render.bat
```

This will:

- create `backend\.venv` if needed
- install backend dependencies
- run `python manage.py check`
- run migrations locally
- create the demo login users
- collect static files

## Deploy on Render

1. Push this repo to GitHub.
2. Open Render.
3. Create a new Blueprint and connect the repository.
4. Render will detect `render.yaml`.
5. Apply the Blueprint.
6. Wait for the web service and Postgres database to finish provisioning.

## Important environment values

`render.yaml` already defines:

- `SECRET_KEY`
- `DATABASE_URL`
- `WEB_CONCURRENCY`
- `PYTHON_VERSION`

Optional env vars you can add later in Render if needed:

- `ALLOWED_HOSTS`
- `CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`
- `DEMO_USER_PASSWORD`
- `DEMO_BRANCH_NAME`
- `DEMO_BRANCH_LOCATION`

## After deploy

1. The deploy automatically seeds these users:

```text
admin_test
manager_test
baker_test
customer_test
```

2. Default password:

```text
password123
```

Set `DEMO_USER_PASSWORD` in Render if you want a different value.

3. Copy your Render backend URL, for example:

```text
https://n3-bakers-api.onrender.com
```

4. In the frontend, set:

```text
EXPO_PUBLIC_API_URL=https://n3-bakers-api.onrender.com/api/
```

## Notes

- Render Postgres is used in production instead of SQLite.
- Static files are served with WhiteNoise.
- Uploaded media files are still stored on the web service filesystem. If you need persistent user-uploaded files, move media storage to object storage later.
