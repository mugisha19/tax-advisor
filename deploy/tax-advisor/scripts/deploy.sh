#!/bin/bash
DEPLOY_DIR="/opt/tax-advisor"
echo "=== Deploying Tax Advisor System ==="
useradd -r -s /bin/false taxadvisor 2>/dev/null || true
mkdir -p $DEPLOY_DIR/{backend,taxprofessional-frontend,officer-frontend,logs,uploads}
cp -r backend/* $DEPLOY_DIR/backend/
cp -r taxprofessional-frontend/* $DEPLOY_DIR/taxprofessional-frontend/
cp -r officer-frontend/* $DEPLOY_DIR/officer-frontend/
chown -R taxadvisor:taxadvisor $DEPLOY_DIR
systemctl stop tax-advisor-* 2>/dev/null || true
cp scripts/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now tax-advisor-backend tax-advisor-taxprofessional-frontend tax-advisor-officer-frontend
echo "Deployment completed to $DEPLOY_DIR"
