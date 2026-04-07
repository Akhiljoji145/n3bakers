@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

if not exist "%BACKEND_DIR%\manage.py" (
    echo Backend directory not found: "%BACKEND_DIR%"
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo Frontend directory not found: "%FRONTEND_DIR%"
    exit /b 1
)

cd /d "%BACKEND_DIR%"

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment in backend\.venv
    python -m venv .venv
    if errorlevel 1 exit /b 1
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 exit /b 1

echo Upgrading pip
python -m pip install --upgrade pip
if errorlevel 1 exit /b 1

echo Installing backend requirements
pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo Running Django checks
python manage.py check
if errorlevel 1 exit /b 1

echo Applying migrations locally
python manage.py migrate
if errorlevel 1 exit /b 1

echo Seeding demo users
python manage.py seed_demo_users
if errorlevel 1 exit /b 1

echo Collecting static files
python manage.py collectstatic --noinput
if errorlevel 1 exit /b 1

cd /d "%FRONTEND_DIR%"

echo Installing frontend dependencies
call npm.cmd ci
if errorlevel 1 exit /b 1

if "%EXPO_PUBLIC_API_URL%"=="" (
    echo EXPO_PUBLIC_API_URL is not set.
    echo Example:
    echo set EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api/
    echo.
)

echo Building Expo web export for Render
call npx.cmd expo export --platform web --output-dir dist
if errorlevel 1 exit /b 1

echo.
echo Render deploy preparation completed for backend and frontend.
echo Next steps:
echo 1. Commit and push your code.
echo 2. In Render, create a Blueprint from render.yaml.
echo 3. Create a Static Site for the frontend with:
echo    Root Directory: frontend
echo    Build Command: npm ci ^&^& npx expo export --platform web --output-dir dist
echo    Publish Directory: dist
echo    Start Command: leave empty
echo 4. Set EXPO_PUBLIC_API_URL in Render frontend env vars to your backend URL.
echo.

endlocal
