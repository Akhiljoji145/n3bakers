@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND_DIR=%ROOT%frontend"

if not exist "%FRONTEND_DIR%\package.json" (
    echo Frontend directory not found: "%FRONTEND_DIR%"
    exit /b 1
)

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
echo Frontend Render build completed.
echo Render Static Site settings:
echo 1. Root Directory: frontend
echo 2. Build Command: npm ci ^&^& npx expo export --platform web --output-dir dist
echo 3. Publish Directory: dist
echo 4. Start Command: leave empty
echo.

endlocal
