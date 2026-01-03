@echo off
echo Starting Dayflow HRMS...
echo.

REM Check if node_modules exist
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo Starting server and client...
echo.
call npm start

