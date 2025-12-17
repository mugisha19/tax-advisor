#!/bin/bash
echo "=== Deploying Tax Advisor System ==="
useradd -r -s /bin/false taxadvisor 2>/dev/null || true
mkdir -p /opt/tax-advisor/{backend,taxprofessional-frontend,officer-frontend,config,logs,uploads}
cp -r * /opt/tax-advisor/
chown -R taxadvisor:taxadvisor /opt/tax-advisor
cp scripts/tax-advisor-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable tax-advisor-backend
systemctl start tax-advisor-backend
echo "Deployment completed!"
