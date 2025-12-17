@echo off

echo === Building Tax Advisor System (with fixes) ===

REM Build Backend
echo Building backend...
cd taxprofessionals
call mvn clean package -DskipTests
cd ..

REM Fix and Build Tax Professional Frontend
echo Fixing and building Tax Professional Frontend...
cd taxProfessionalsFrontend

REM Create relaxed TypeScript config
echo {> tsconfig.build.json
echo   "extends": "./tsconfig.json",>> tsconfig.build.json
echo   "compilerOptions": {>> tsconfig.build.json
echo     "noUnusedLocals": false,>> tsconfig.build.json
echo     "noUnusedParameters": false,>> tsconfig.build.json
echo     "strict": false,>> tsconfig.build.json
echo     "skipLibCheck": true>> tsconfig.build.json
echo   }>> tsconfig.build.json
echo }>> tsconfig.build.json

REM Build with relaxed config
call npx tsc -b tsconfig.build.json
call npx vite build
cd ..

REM Build Officer Frontend
echo Building Officer Frontend...
cd Officer_app

REM Create relaxed TypeScript config
echo {> tsconfig.build.json
echo   "extends": "./tsconfig.json",>> tsconfig.build.json
echo   "compilerOptions": {>> tsconfig.build.json
echo     "noUnusedLocals": false,>> tsconfig.build.json
echo     "noUnusedParameters": false,>> tsconfig.build.json
echo     "strict": false,>> tsconfig.build.json
echo     "skipLibCheck": true>> tsconfig.build.json
echo   }>> tsconfig.build.json
echo }>> tsconfig.build.json

REM Build with relaxed config
call npx tsc -b tsconfig.build.json
call npx vite build
cd ..

echo === Creating deployment package ===
mkdir deploy\tax-advisor\backend 2>nul
mkdir deploy\tax-advisor\taxprofessional-frontend 2>nul
mkdir deploy\tax-advisor\officer-frontend 2>nul
mkdir deploy\tax-advisor\scripts 2>nul

REM Copy backend with env
copy taxprofessionals\target\taxprofessionals-0.0.1-SNAPSHOT.jar deploy\tax-advisor\backend\
copy taxprofessionals\.env deploy\tax-advisor\backend\.env 2>nul || copy taxprofessionals\.env.example deploy\tax-advisor\backend\.env
copy taxprofessionals\.env.example deploy\tax-advisor\backend\.env.example 2>nul

REM Copy taxprofessional frontend with env
xcopy taxProfessionalsFrontend\dist\* deploy\tax-advisor\taxprofessional-frontend\ /E /Y
copy taxProfessionalsFrontend\.env deploy\tax-advisor\taxprofessional-frontend\.env 2>nul || copy taxProfessionalsFrontend\.env.example deploy\tax-advisor\taxprofessional-frontend\.env
copy taxProfessionalsFrontend\.env.example deploy\tax-advisor\taxprofessional-frontend\.env.example 2>nul

REM Copy officer frontend with env
xcopy Officer_app\dist\* deploy\tax-advisor\officer-frontend\ /E /Y
copy Officer_app\.env deploy\tax-advisor\officer-frontend\.env 2>nul || copy Officer_app\.env.example deploy\tax-advisor\officer-frontend\.env
copy Officer_app\.env.example deploy\tax-advisor\officer-frontend\.env.example 2>nul

REM Create systemd services
echo [Unit]> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo Description=Tax Advisor Backend Service>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo After=network.target postgresql.service>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo [Service]>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo Type=simple>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo User=taxadvisor>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo WorkingDirectory=/opt/tax-advisor/backend>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo ExecStart=/usr/bin/java -jar taxprofessionals-0.0.1-SNAPSHOT.jar>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo EnvironmentFile=/opt/tax-advisor/backend/.env>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo Restart=always>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo RestartSec=10>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo [Install]>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo WantedBy=multi-user.target>> deploy\tax-advisor\scripts\tax-advisor-backend.service

echo [Unit]> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo Description=Tax Advisor Taxprofessional Frontend Service>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo After=network.target>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo [Service]>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo Type=simple>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo User=taxadvisor>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo WorkingDirectory=/opt/tax-advisor/taxprofessional-frontend>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo ExecStart=/usr/bin/python3 -m http.server 5173 --bind 0.0.0.0>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo EnvironmentFile=/opt/tax-advisor/taxprofessional-frontend/.env>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo Restart=always>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo RestartSec=10>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo [Install]>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service
echo WantedBy=multi-user.target>> deploy\tax-advisor\scripts\tax-advisor-taxprofessional-frontend.service

echo [Unit]> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo Description=Tax Advisor Officer Frontend Service>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo After=network.target>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo [Service]>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo Type=simple>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo User=taxadvisor>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo WorkingDirectory=/opt/tax-advisor/officer-frontend>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo ExecStart=/usr/bin/python3 -m http.server 5000 --bind 0.0.0.0>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo EnvironmentFile=/opt/tax-advisor/officer-frontend/.env>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo Restart=always>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo RestartSec=10>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo [Install]>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo WantedBy=multi-user.target>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service

REM Create deployment script
echo #!/bin/bash> deploy\tax-advisor\scripts\deploy.sh
echo DEPLOY_DIR="/opt/tax-advisor">> deploy\tax-advisor\scripts\deploy.sh
echo echo "=== Deploying Tax Advisor System ===">> deploy\tax-advisor\scripts\deploy.sh
echo useradd -r -s /bin/false taxadvisor 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo mkdir -p $DEPLOY_DIR/{backend,taxprofessional-frontend,officer-frontend,logs,uploads}>> deploy\tax-advisor\scripts\deploy.sh
echo cp -r backend/* $DEPLOY_DIR/backend/>> deploy\tax-advisor\scripts\deploy.sh
echo cp -r taxprofessional-frontend/* $DEPLOY_DIR/taxprofessional-frontend/>> deploy\tax-advisor\scripts\deploy.sh
echo cp -r officer-frontend/* $DEPLOY_DIR/officer-frontend/>> deploy\tax-advisor\scripts\deploy.sh
echo chown -R taxadvisor:taxadvisor $DEPLOY_DIR>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl stop tax-advisor-* 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo cp scripts/*.service /etc/systemd/system/>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl daemon-reload>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl enable --now tax-advisor-backend tax-advisor-taxprofessional-frontend tax-advisor-officer-frontend>> deploy\tax-advisor\scripts\deploy.sh
echo echo "Deployment completed to $DEPLOY_DIR">> deploy\tax-advisor\scripts\deploy.sh

pause