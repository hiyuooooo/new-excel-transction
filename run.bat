@echo off
echo ========================================
echo    Transaction Manager - Local Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PNPM not found. Installing PNPM...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install PNPM
        pause
        exit /b 1
    )
)

echo Node.js version:
node --version
echo.
echo PNPM version:
pnpm --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes on first run...
    pnpm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Starting Transaction Manager...
echo.
echo Server will be available at: http://localhost:7020
echo.
echo Your default browser will open automatically.
echo To stop the server, press Ctrl+C in this window.
echo.

REM Start the development server
echo Starting development server...
start "" "http://localhost:7020"
pnpm dev

REM If pnpm dev fails, keep window open to show error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start the development server
    echo Please check the error messages above
    pause
)
