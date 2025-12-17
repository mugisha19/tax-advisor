#!/bin/bash

# Server Setup Script for Red Hat/CentOS/RHEL
# Run this on your server first

echo "=== Tax Advisor Server Setup ==="

# Update system
dnf update -y

# Install Java 17
dnf install -y java-17-openjdk java-17-openjdk-devel

# Install PostgreSQL
dnf install -y postgresql postgresql-server postgresql-contrib
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql

# Install Nginx
dnf install -y nginx
systemctl enable nginx
systemctl start nginx

# Install Node.js (for serving static files if needed)
dnf install -y nodejs npm

# Configure PostgreSQL
sudo -u postgres psql << 'EOF'
CREATE DATABASE taxprofessionals;
CREATE USER taxprofessional WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE taxprofessionals TO taxprofessional;
\q
EOF

# Configure firewall
firewall-cmd --permanent --add-port=8080/tcp  # Backend
firewall-cmd --permanent --add-port=5173/tcp  # Tax Professional Frontend
firewall-cmd --permanent --add-port=5000/tcp  # Officer Frontend
firewall-cmd --permanent --add-port=80/tcp    # HTTP
firewall-cmd --permanent --add-port=443/tcp   # HTTPS
firewall-cmd --reload

# Create application directories
mkdir -p /opt/tax-advisor/{backend,taxprofessional-frontend,officer-frontend,config,logs,uploads}

# Create service user
useradd -r -s /bin/false taxadvisor

# Set SELinux contexts (if SELinux is enabled)
setsebool -P httpd_can_network_connect 1
semanage fcontext -a -t bin_t "/opt/tax-advisor/backend/taxprofessionals-0.0.1-SNAPSHOT.jar" 2>/dev/null || true

echo "=== Server setup complete ==="
echo "Next steps:"
echo "1. Update PostgreSQL password in the script"
echo "2. Configure your .env files"
echo "3. Run the deployment script"