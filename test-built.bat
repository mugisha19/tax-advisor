@echo off

echo === Building Tax Advisor System (Test - No Nginx) ===

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
mkdir test_deploy\backend 2>nul
mkdir test_deploy\taxprofessional-frontend 2>nul
mkdir test_deploy\officer-frontend 2>nul
mkdir test_deploy\scripts 2>nul

REM Copy backend with env
copy taxprofessionals\target\taxprofessionals-0.0.1-SNAPSHOT.jar test_deploy\backend\
copy taxprofessionals\.env test_deploy\backend\.env 2>nul || copy taxprofessionals\.env.example test_deploy\backend\.env
copy taxprofessionals\.env.example test_deploy\backend\.env.example 2>nul

REM Copy taxprofessional frontend with env
xcopy taxProfessionalsFrontend\dist\* test_deploy\taxprofessional-frontend\ /E /Y
copy taxProfessionalsFrontend\.env test_deploy\taxprofessional-frontend\.env 2>nul || copy taxProfessionalsFrontend\.env.example test_deploy\taxprofessional-frontend\.env
copy taxProfessionalsFrontend\.env.example test_deploy\taxprofessional-frontend\.env.example 2>nul

REM Copy officer frontend with env
xcopy Officer_app\dist\* test_deploy\officer-frontend\ /E /Y
copy Officer_app\.env test_deploy\officer-frontend\.env 2>nul || copy Officer_app\.env.example test_deploy\officer-frontend\.env
copy Officer_app\.env.example test_deploy\officer-frontend\.env.example 2>nul

REM Create backend systemd service (port 5174)
echo [Unit]> test_deploy\scripts\tax-advisor-backend.service
echo Description=Tax Advisor Backend Service (Test)>> test_deploy\scripts\tax-advisor-backend.service
echo After=network.target postgresql.service>> test_deploy\scripts\tax-advisor-backend.service
echo.>> test_deploy\scripts\tax-advisor-backend.service
echo [Service]>> test_deploy\scripts\tax-advisor-backend.service
echo Type=simple>> test_deploy\scripts\tax-advisor-backend.service
echo User=root>> test_deploy\scripts\tax-advisor-backend.service
echo WorkingDirectory=/opt/tax-advisor/backend>> test_deploy\scripts\tax-advisor-backend.service
echo ExecStart=/usr/bin/java -jar /opt/tax-advisor/backend/taxprofessionals-0.0.1-SNAPSHOT.jar --server.port=5174>> test_deploy\scripts\tax-advisor-backend.service
echo EnvironmentFile=-/opt/tax-advisor/backend/.env>> test_deploy\scripts\tax-advisor-backend.service
echo Restart=always>> test_deploy\scripts\tax-advisor-backend.service
echo RestartSec=10>> test_deploy\scripts\tax-advisor-backend.service
echo.>> test_deploy\scripts\tax-advisor-backend.service
echo [Install]>> test_deploy\scripts\tax-advisor-backend.service
echo WantedBy=multi-user.target>> test_deploy\scripts\tax-advisor-backend.service

REM Create officer frontend systemd service (port 5175)
echo [Unit]> test_deploy\scripts\tax-advisor-officer-frontend.service
echo Description=Tax Advisor Officer Frontend Service (Test)>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo After=network.target>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo.>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo [Service]>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo Type=simple>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo User=root>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo WorkingDirectory=/opt/tax-advisor/officer-frontend>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo ExecStart=/bin/serve -s /opt/tax-advisor/officer-frontend -l 5175>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo EnvironmentFile=-/opt/tax-advisor/officer-frontend/.env>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo Restart=always>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo RestartSec=10>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo.>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo [Install]>> test_deploy\scripts\tax-advisor-officer-frontend.service
echo WantedBy=multi-user.target>> test_deploy\scripts\tax-advisor-officer-frontend.service

REM Create taxprofessional frontend systemd service (port 5176)
echo [Unit]> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo Description=Tax Advisor TaxProfessional Frontend Service (Test)>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo After=network.target>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo.>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo [Service]>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo Type=simple>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo User=root>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo WorkingDirectory=/opt/tax-advisor/taxprofessional-frontend>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo ExecStart=/bin/serve -s /opt/tax-advisor/taxprofessional-frontend -l 5176>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo EnvironmentFile=-/opt/tax-advisor/taxprofessional-frontend/.env>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo Restart=always>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo RestartSec=10>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo.>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo [Install]>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service
echo WantedBy=multi-user.target>> test_deploy\scripts\tax-advisor-taxprofessional-frontend.service

REM Create deployment script
echo #!/bin/bash> test_deploy\scripts\deploy.sh
echo DEPLOY_DIR="/opt/tax-advisor">> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Fix this script's line endings and permissions>> test_deploy\scripts\deploy.sh
echo sed -i 's/\r$//' "$0" 2^>/dev/null ^|^| true>> test_deploy\scripts\deploy.sh
echo chmod +x "$0" 2^>/dev/null ^|^| true>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo echo "=== Deploying Tax Advisor System (Test) ===">> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Create extra directories>> test_deploy\scripts\deploy.sh
echo mkdir -p $DEPLOY_DIR/{logs,uploads}>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Stop services>> test_deploy\scripts\deploy.sh
echo echo "Stopping services...">> test_deploy\scripts\deploy.sh
echo systemctl stop tax-advisor-backend tax-advisor-officer-frontend tax-advisor-taxprofessional-frontend 2^>/dev/null ^|^| true>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Fix permissions>> test_deploy\scripts\deploy.sh
echo echo "Fixing permissions...">> test_deploy\scripts\deploy.sh
echo chmod -R 755 $DEPLOY_DIR/taxprofessional-frontend/>> test_deploy\scripts\deploy.sh
echo chmod -R 755 $DEPLOY_DIR/officer-frontend/>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Install serve if not present>> test_deploy\scripts\deploy.sh
echo if ! command -v serve ^&^>/dev/null; then>> test_deploy\scripts\deploy.sh
echo     echo "Installing serve...">> test_deploy\scripts\deploy.sh
echo     npm install -g serve>> test_deploy\scripts\deploy.sh
echo fi>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Copy systemd services>> test_deploy\scripts\deploy.sh
echo echo "Installing systemd services...">> test_deploy\scripts\deploy.sh
echo cp $DEPLOY_DIR/scripts/tax-advisor-backend.service /etc/systemd/system/>> test_deploy\scripts\deploy.sh
echo cp $DEPLOY_DIR/scripts/tax-advisor-officer-frontend.service /etc/systemd/system/>> test_deploy\scripts\deploy.sh
echo cp $DEPLOY_DIR/scripts/tax-advisor-taxprofessional-frontend.service /etc/systemd/system/>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Reload systemd>> test_deploy\scripts\deploy.sh
echo systemctl daemon-reload>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Enable and start all services>> test_deploy\scripts\deploy.sh
echo echo "Starting services...">> test_deploy\scripts\deploy.sh
echo systemctl enable --now tax-advisor-backend>> test_deploy\scripts\deploy.sh
echo systemctl enable --now tax-advisor-officer-frontend>> test_deploy\scripts\deploy.sh
echo systemctl enable --now tax-advisor-taxprofessional-frontend>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo # Wait for backend to start>> test_deploy\scripts\deploy.sh
echo echo "Waiting for backend to start...">> test_deploy\scripts\deploy.sh
echo sleep 10>> test_deploy\scripts\deploy.sh
echo.>> test_deploy\scripts\deploy.sh
echo echo "">> test_deploy\scripts\deploy.sh
echo echo "=== Deployment Complete ===">> test_deploy\scripts\deploy.sh
echo echo "">> test_deploy\scripts\deploy.sh
echo echo "Services:">> test_deploy\scripts\deploy.sh
echo echo "  Backend (port 5174):                systemctl status tax-advisor-backend">> test_deploy\scripts\deploy.sh
echo echo "  Officer Frontend (port 5175):       systemctl status tax-advisor-officer-frontend">> test_deploy\scripts\deploy.sh
echo echo "  TaxProfessional Frontend (port 5176): systemctl status tax-advisor-taxprofessional-frontend">> test_deploy\scripts\deploy.sh
echo echo "">> test_deploy\scripts\deploy.sh
echo echo "Logs:">> test_deploy\scripts\deploy.sh
echo echo "  journalctl -u tax-advisor-backend -f">> test_deploy\scripts\deploy.sh
echo echo "  journalctl -u tax-advisor-officer-frontend -f">> test_deploy\scripts\deploy.sh
echo echo "  journalctl -u tax-advisor-taxprofessional-frontend -f">> test_deploy\scripts\deploy.sh

echo.
echo === Build completed ===
echo Deployment package created in: test_deploy\
echo.
echo Ports:
echo   Backend:                  5174
echo   Officer Frontend:         5175
echo   TaxProfessional Frontend: 5176
echo.
echo To deploy on server:
echo 1. Copy test_deploy/* to /opt/tax-advisor/ on the server
echo 2. Run: cd /opt/tax-advisor/scripts ^&^& chmod +x deploy.sh ^&^& sed -i 's/\r$//' deploy.sh ^&^& sudo ./deploy.sh
echo.

pause
