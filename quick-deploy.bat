@echo off
REM Quick deployment script for Windows

set SERVER_IP=%1
set SERVER_USER=%2

if "%SERVER_IP%"=="" (
    set /p SERVER_IP="Enter server IP: "
)

if "%SERVER_USER%"=="" (
    set /p SERVER_USER="Enter server user [root]: "
    if "%SERVER_USER%"=="" set SERVER_USER=root
)

echo === Building Tax Advisor System ===

REM Build Backend
echo Building backend...
cd taxprofessionals
call mvn clean package -DskipTests
cd ..

REM Build Tax Professional Frontend
echo Building Tax Professional Frontend...
cd taxProfessionalsFrontend
call npm install
call npm run build
cd ..

REM Build Officer Frontend
echo Building Officer Frontend...
cd Officer_app
call npm install
call npm run build
cd ..

echo === Creating deployment package ===
mkdir deploy\tax-advisor\backend 2>nul
mkdir deploy\tax-advisor\taxprofessional-frontend 2>nul
mkdir deploy\tax-advisor\officer-frontend 2>nul
mkdir deploy\tax-advisor\config 2>nul
mkdir deploy\tax-advisor\scripts 2>nul

REM Copy artifacts
copy taxprofessionals\target\taxprofessionals-0.0.1-SNAPSHOT.jar deploy\tax-advisor\backend\
xcopy taxProfessionalsFrontend\dist\* deploy\tax-advisor\taxprofessional-frontend\ /E /Y
xcopy Officer_app\dist\* deploy\tax-advisor\officer-frontend\ /E /Y

REM Copy configs
copy taxprofessionals\.env deploy\tax-advisor\config\backend.env
copy taxProfessionalsFrontend\.env deploy\tax-advisor\config\taxprofessional-frontend.env
copy Officer_app\.env deploy\tax-advisor\config\officer-frontend.env

echo === Transfer to server ===
scp -r deploy/tax-advisor %SERVER_USER%@%SERVER_IP%:/tmp/

echo === Deploy on server ===
ssh %SERVER_USER%@%SERVER_IP% "cd /tmp/tax-advisor && sudo chmod +x scripts/deploy.sh && sudo ./scripts/deploy.sh"

echo === Deployment Complete ===
pause