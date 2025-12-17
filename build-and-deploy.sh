#!/bin/bash

# Tax Advisor System - Build and Deploy Script
# Usage: ./build-and-deploy.sh [SERVER_IP] [SERVER_USER]

SERVER_IP=${1:-"your-server-ip"}
SERVER_USER=${2:-"root"}
APP_NAME="tax-advisor"
DEPLOY_DIR="/opt/$APP_NAME"

echo "=== Building Tax Advisor System ==="

# 1. Build Backend (Spring Boot)
echo "Building backend..."
cd taxprofessionals
mvn clean package -DskipTests
cd ..

# 2. Build Tax Professional Frontend
echo "Building Tax Professional Frontend..."
cd taxProfessionalsFrontend
npm install
npm run build
cd ..

# 3. Build Officer Frontend
echo "Building Officer Frontend..."
cd Officer_app
npm install
npm run build
cd ..

# 4. Create deployment package
echo "Creating deployment package..."
mkdir -p deploy/$APP_NAME/{backend,taxprofessional-frontend,officer-frontend,config,scripts}

# Copy built artifacts
cp taxprofessionals/target/taxprofessionals-0.0.1-SNAPSHOT.jar deploy/$APP_NAME/backend/
cp -r taxProfessionalsFrontend/dist/* deploy/$APP_NAME/taxprofessional-frontend/
cp -r Officer_app/dist/* deploy/$APP_NAME/officer-frontend/

# Copy environment files
cp taxprofessionals/.env deploy/$APP_NAME/config/backend.env
cp taxProfessionalsFrontend/.env deploy/$APP_NAME/config/taxprofessional-frontend.env
cp Officer_app/.env deploy/$APP_NAME/config/officer-frontend.env

# Create systemd service files
cat > deploy/$APP_NAME/scripts/tax-advisor-backend.service << 'EOF'
[Unit]
Description=Tax Advisor Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=taxadvisor
WorkingDirectory=/opt/tax-advisor/backend
ExecStart=/usr/bin/java -jar taxprofessionals-0.0.1-SNAPSHOT.jar
EnvironmentFile=/opt/tax-advisor/config/backend.env
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create nginx config for frontends
cat > deploy/$APP_NAME/scripts/tax-advisor-nginx.conf << 'EOF'
# Tax Professional Frontend (Port 5173)
server {
    listen 5173;
    server_name _;
    root /opt/tax-advisor/taxprofessional-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Officer Frontend (Port 5000)
server {
    listen 5000;
    server_name _;
    root /opt/tax-advisor/officer-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Create deployment script
cat > deploy/$APP_NAME/scripts/deploy.sh << 'EOF'
#!/bin/bash

echo "=== Deploying Tax Advisor System ==="

# Create user
useradd -r -s /bin/false taxadvisor 2>/dev/null || true

# Create directories
mkdir -p /opt/tax-advisor/{backend,taxprofessional-frontend,officer-frontend,config,logs,uploads}

# Set permissions
chown -R taxadvisor:taxadvisor /opt/tax-advisor
chmod 755 /opt/tax-advisor

# Install systemd service
cp scripts/tax-advisor-backend.service /etc/systemd/system/
systemctl daemon-reload

# Install nginx config
cp scripts/tax-advisor-nginx.conf /etc/nginx/conf.d/
nginx -t && systemctl reload nginx

# Enable and start services
systemctl enable tax-advisor-backend
systemctl start tax-advisor-backend

echo "Deployment completed!"
echo "Backend: http://localhost:8080"
echo "Tax Professional Frontend: http://localhost:5173"
echo "Officer Frontend: http://localhost:5000"
EOF

chmod +x deploy/$APP_NAME/scripts/deploy.sh

# 5. Transfer to server
echo "Transferring files to server..."
scp -r deploy/$APP_NAME $SERVER_USER@$SERVER_IP:/tmp/

# 6. Deploy on server
echo "Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /tmp/tax-advisor
sudo ./scripts/deploy.sh
ENDSSH

echo "=== Deployment Complete ==="
echo "Services:"
echo "- Backend: systemctl status tax-advisor-backend"
echo "- Check logs: journalctl -u tax-advisor-backend -f"