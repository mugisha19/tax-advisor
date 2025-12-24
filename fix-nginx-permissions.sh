#!/bin/bash

echo "=== Fixing Nginx Permissions for Tax Professional Frontend ==="

FRONTEND_DIR="/opt/tax-advisor/taxprofessional-frontend"

# Check if directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Directory $FRONTEND_DIR does not exist"
    exit 1
fi

echo "1. Fixing ownership (nginx:nginx)..."
chown -R nginx:nginx $FRONTEND_DIR

echo "2. Fixing permissions (755 for directories, 644 for files)..."
find $FRONTEND_DIR -type d -exec chmod 755 {} \;
find $FRONTEND_DIR -type f -exec chmod 644 {} \;

echo "3. Fixing SELinux context..."
chcon -R -t httpd_sys_content_t $FRONTEND_DIR 2>/dev/null || echo "SELinux not enabled or command failed"

echo "4. Allowing nginx to connect to network..."
setsebool -P httpd_can_network_connect 1 2>/dev/null || echo "SELinux not enabled or command failed"

echo ""
echo "=== Verification ==="
echo "Ownership:"
ls -ld $FRONTEND_DIR
echo ""
echo "Assets directory:"
ls -ld $FRONTEND_DIR/assets 2>/dev/null || echo "No assets directory"
echo ""
echo "Sample files:"
ls -lh $FRONTEND_DIR | head -10

echo ""
echo "=== Testing nginx configuration ==="
nginx -t

echo ""
echo "=== Reloading nginx ==="
systemctl reload nginx

echo ""
echo "✅ Permissions fixed successfully!"
echo "Test the site: http://$(hostname -I | awk '{print $1}'):5173"
