@echo off

echo === Building Tax Advisor System (with nginx support) ===

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
mkdir deploy\tax-advisor\nginx 2>nul

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

REM Copy nginx configuration
copy nginx.conf deploy\tax-advisor\nginx\nginx.conf 2>nul

REM Copy backup service files
copy tax-advisor-backup.service deploy\tax-advisor\scripts\ 2>nul
copy tax-advisor-backup.timer deploy\tax-advisor\scripts\ 2>nul

REM Create backend systemd service
echo [Unit]> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo Description=Tax Advisor Backend Service>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo After=network.target postgresql.service>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo [Service]>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo Type=simple>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo User=root>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo WorkingDirectory=/opt/tax-advisor/backend>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo ExecStart=/usr/bin/java -jar /opt/tax-advisor/backend/taxprofessionals-0.0.1-SNAPSHOT.jar>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo EnvironmentFile=-/opt/tax-advisor/backend/.env>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo Restart=always>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo RestartSec=10>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo [Install]>> deploy\tax-advisor\scripts\tax-advisor-backend.service
echo WantedBy=multi-user.target>> deploy\tax-advisor\scripts\tax-advisor-backend.service

REM Create officer frontend systemd service
echo [Unit]> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo Description=Tax Advisor Officer Frontend Service>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo After=network.target>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo [Service]>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo Type=simple>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo User=root>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo WorkingDirectory=/opt/tax-advisor/officer-frontend>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo ExecStart=/usr/local/bin/serve -s /opt/tax-advisor/officer-frontend -l 5000>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo EnvironmentFile=-/opt/tax-advisor/officer-frontend/.env>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo Restart=always>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo RestartSec=10>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo.>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo [Install]>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service
echo WantedBy=multi-user.target>> deploy\tax-advisor\scripts\tax-advisor-officer-frontend.service

REM Create deployment script
echo #!/bin/bash> deploy\tax-advisor\scripts\deploy.sh
echo DEPLOY_DIR="/opt/tax-advisor">> deploy\tax-advisor\scripts\deploy.sh
echo TEMP_DIR="/tmp/tax-advisor">> deploy\tax-advisor\scripts\deploy.sh
echo echo "=== Deploying Tax Advisor System ===">> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Navigate to temp directory>> deploy\tax-advisor\scripts\deploy.sh
echo cd "$TEMP_DIR" ^|^| { echo "Error: Must run from /tmp/tax-advisor"; exit 1; }>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Create directories>> deploy\tax-advisor\scripts\deploy.sh
echo mkdir -p $DEPLOY_DIR/{backend,taxprofessional-frontend,officer-frontend,logs,uploads}>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Copy application files from temp to opt>> deploy\tax-advisor\scripts\deploy.sh
echo cp -r backend/. $DEPLOY_DIR/backend/>> deploy\tax-advisor\scripts\deploy.sh
echo cp -r taxprofessional-frontend/. $DEPLOY_DIR/taxprofessional-frontend/>> deploy\tax-advisor\scripts\deploy.sh
echo cp -r officer-frontend/. $DEPLOY_DIR/officer-frontend/>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Fix permissions for nginx>> deploy\tax-advisor\scripts\deploy.sh
echo echo "Fixing permissions for nginx...">> deploy\tax-advisor\scripts\deploy.sh
echo chown -R nginx:nginx $DEPLOY_DIR/taxprofessional-frontend/>> deploy\tax-advisor\scripts\deploy.sh
echo chmod -R 755 $DEPLOY_DIR/taxprofessional-frontend/>> deploy\tax-advisor\scripts\deploy.sh
echo chcon -R -t httpd_sys_content_t $DEPLOY_DIR/taxprofessional-frontend/ 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo setsebool -P httpd_can_network_connect 1 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Stop services>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl stop tax-advisor-backend tax-advisor-officer-frontend 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Copy systemd services (excluding taxprofessional-frontend)>> deploy\tax-advisor\scripts\deploy.sh
echo cp scripts/tax-advisor-backend.service /etc/systemd/system/>> deploy\tax-advisor\scripts\deploy.sh
echo cp scripts/tax-advisor-officer-frontend.service /etc/systemd/system/>> deploy\tax-advisor\scripts\deploy.sh
echo cp scripts/tax-advisor-backup.service /etc/systemd/system/ 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo cp scripts/tax-advisor-backup.timer /etc/systemd/system/ 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Reload systemd>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl daemon-reload>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Enable and start services>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl enable --now tax-advisor-backend tax-advisor-officer-frontend>> deploy\tax-advisor\scripts\deploy.sh
echo systemctl enable --now tax-advisor-backup.timer 2^>/dev/null ^|^| true>> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo # Copy nginx config>> deploy\tax-advisor\scripts\deploy.sh
echo echo "Copying nginx configuration...">> deploy\tax-advisor\scripts\deploy.sh
echo cp nginx/nginx.conf /etc/nginx/nginx.conf.new 2^>/dev/null ^|^| echo "Note: Copy nginx/nginx.conf to /etc/nginx/nginx.conf manually">> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo echo "">> deploy\tax-advisor\scripts\deploy.sh
echo echo "=== Deployment completed to $DEPLOY_DIR ===">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Backend: systemctl status tax-advisor-backend">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Officer Frontend: systemctl status tax-advisor-officer-frontend">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Taxprofessional Frontend: served by nginx on port 5173">> deploy\tax-advisor\scripts\deploy.sh
echo echo "">> deploy\tax-advisor\scripts\deploy.sh
echo echo "IMPORTANT: Update nginx configuration:">> deploy\tax-advisor\scripts\deploy.sh
echo echo "1. Review: nginx/nginx.conf">> deploy\tax-advisor\scripts\deploy.sh
echo echo "2. Backup: cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup">> deploy\tax-advisor\scripts\deploy.sh
echo echo "3. Update: cp nginx/nginx.conf /etc/nginx/nginx.conf">> deploy\tax-advisor\scripts\deploy.sh
echo echo "4. Test: nginx -t">> deploy\tax-advisor\scripts\deploy.sh
echo echo "5. Reload: systemctl reload nginx">> deploy\tax-advisor\scripts\deploy.shguration available at: nginx/nginx.conf">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Please manually update /etc/nginx/nginx.conf with the provided configuration">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Then run: nginx -t && systemctl reload nginx">> deploy\tax-advisor\scripts\deploy.sh
echo.>> deploy\tax-advisor\scripts\deploy.sh
echo echo "Deployment completed to $DEPLOY_DIR">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Backend: systemctl status tax-advisor-backend">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Officer Frontend: systemctl status tax-advisor-officer-frontend">> deploy\tax-advisor\scripts\deploy.sh
echo echo "Taxprofessional Frontend: served by nginx on port 5173">> deploy\tax-advisor\scripts\deploy.sh

echo.
echo === Build completed ===
echo Deployment package created in: deploy\tax-advisor\
echo.
echo To deploy on Red Hat server:
echo 1. Copy deploy/tax-advisor to the server
echo 2. Run: cd tax-advisor/scripts ^&^& chmod +x deploy.sh ^&^& sudo ./deploy.sh
echo 3. Update /etc/nginx/nginx.conf with nginx/nginx.conf
echo 4. Run: sudo nginx -t ^&^& sudo systemctl reload nginx
echo.

pause
