@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"

if not exist "%BACKEND_DIR%\manage.py" (
    echo Backend directory not found: "%BACKEND_DIR%"
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

echo Collecting static files
python manage.py collectstatic --noinput
if errorlevel 1 exit /b 1

echo.
echo Render deploy preparation completed.
echo Next steps:
echo 1. Commit and push your code.
echo 2. In Render, create a Blueprint from render.yaml.
echo 3. Set your frontend EXPO_PUBLIC_API_URL to your Render backend URL.
echo.

endlocal
