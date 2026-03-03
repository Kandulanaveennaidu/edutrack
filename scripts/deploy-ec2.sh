#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# CampusIQ — One-Command EC2 Deployment
# Run this on your EC2 instance:
#   curl -sL https://raw.githubusercontent.com/Kandulanaveennaidu/CampusIQ-ERP/main/scripts/deploy-ec2.sh | bash
#   OR: cd /home/ubuntu/campusiq && bash scripts/deploy-ec2.sh
# ──────────────────────────────────────────────────────────────────

set -e

EC2_IP="44.192.75.16"
APP_DIR="/home/ubuntu/campusiq"
REPO_URL="https://github.com/Kandulanaveennaidu/CampusIQ-ERP.git"
BRANCH="main"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  CampusIQ — EC2 Deployment"
echo "  Server: $EC2_IP"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. Stop existing services ────────────────────────────────────
echo "[1/8] Stopping services..."
sudo systemctl stop campusiq 2>/dev/null || true
sudo systemctl stop edutrack 2>/dev/null || true
if sudo lsof -i :3000 -t &>/dev/null; then
    sudo kill -9 $(sudo lsof -i :3000 -t) 2>/dev/null || true
fi
echo "   Done"

# ── 2. Install Node.js 20 if needed ─────────────────────────────
echo "[2/8] Checking Node.js..."
if ! command -v node &> /dev/null || ! node -v | grep -q "v20\|v22"; then
    echo "   Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "   Node.js $(node -v), npm $(npm -v)"

# ── 3. Install Nginx & Git ──────────────────────────────────────
echo "[3/8] Installing Nginx & Git..."
sudo apt install -y nginx git 2>/dev/null
sudo systemctl enable nginx

# ── 4. Clone/Update repository ──────────────────────────────────
echo "[4/8] Updating code..."
cd /home/ubuntu

if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")
    if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
        git remote set-url origin "$REPO_URL"
    fi
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
    echo "   Code pulled from GitHub"
else
    rm -rf "$APP_DIR"
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    echo "   Repository cloned"
fi

# ── 5. Create .env.local ────────────────────────────────────────
echo "[5/8] Setting up .env.local..."

if [ -f "$APP_DIR/.env.local" ]; then
    echo "   Existing .env.local found — updating URLs only"
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://$EC2_IP|g" "$APP_DIR/.env.local"
    sed -i "s|APP_URL=.*|APP_URL=http://$EC2_IP|g" "$APP_DIR/.env.local"
    # Ensure NODE_ENV is production
    if ! grep -q "NODE_ENV" "$APP_DIR/.env.local"; then
        echo "NODE_ENV=production" >> "$APP_DIR/.env.local"
    fi
else
    echo "   ⚠️  No .env.local found!"
    echo "   Creating template — you MUST edit it with real values before the app works."
    cat > "$APP_DIR/.env.local" << ENVEOF
# ──── CampusIQ Environment Configuration ────
NEXTAUTH_URL=http://$EC2_IP
NEXTAUTH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
MONGODB_URI=REPLACE_WITH_YOUR_MONGODB_URI
APP_URL=http://$EC2_IP
NODE_ENV=production

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@campusiq.com

# Authorize.net (sandbox)
AUTHORIZE_NET_API_LOGIN_ID=
AUTHORIZE_NET_TRANSACTION_KEY=
AUTHORIZE_NET_SANDBOX=true

# Google Gemini AI
GEMINI_API_KEY=

# Twilio SMS & WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ENVEOF
    echo ""
    echo "   ┌────────────────────────────────────────────┐"
    echo "   │  EDIT .env.local BEFORE CONTINUING:        │"
    echo "   │  nano $APP_DIR/.env.local                  │"
    echo "   │  Then re-run this script.                  │"
    echo "   └────────────────────────────────────────────┘"
    echo ""
    exit 1
fi
echo "   .env.local ready with http://$EC2_IP"

# ── 6. Install dependencies & build ─────────────────────────────
echo "[6/8] Installing dependencies..."
cd "$APP_DIR"
npm install --production=false

echo "   Building production app (this takes 2-5 minutes)..."
# Clean old build first to prevent stale file issues
rm -rf .next
NODE_OPTIONS="--max_old_space_size=1536" npm run build
echo "   Build complete!"

# ── 7. Setup systemd service ────────────────────────────────────
echo "[7/8] Setting up systemd service..."
sudo tee /etc/systemd/system/campusiq.service > /dev/null << 'SVCEOF'
[Unit]
Description=CampusIQ School Management System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/campusiq
EnvironmentFile=/home/ubuntu/campusiq/.env.local
ExecStart=/usr/bin/node /home/ubuntu/campusiq/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=campusiq
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
SVCEOF

sudo systemctl daemon-reload
sudo systemctl enable campusiq
sudo systemctl start campusiq
echo "   CampusIQ service started"

# ── 8. Setup Nginx ──────────────────────────────────────────────
echo "[8/8] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/campusiq > /dev/null << 'NGXEOF'
server {
    listen 80;
    server_name 44.192.75.16 localhost _;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml font/woff2;
    gzip_min_length 256;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    location /api/socketio {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location ~ /\. {
        deny all;
    }

    client_max_body_size 10M;
}
NGXEOF

sudo ln -sf /etc/nginx/sites-available/campusiq /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
echo "   Nginx configured"

# ── Cleanup ──────────────────────────────────────────────────────
sudo rm -f /etc/systemd/system/edutrack.service
sudo systemctl daemon-reload 2>/dev/null || true

# ── Verify ───────────────────────────────────────────────────────
echo ""
echo "Waiting for app to start..."
sleep 8

APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
NGX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")

echo ""
echo "═══════════════════════════════════════════════════════════"
if [ "$APP_STATUS" = "200" ] || [ "$APP_STATUS" = "302" ] || [ "$APP_STATUS" = "301" ]; then
    echo "  ✅ CampusIQ Deployed Successfully!"
else
    echo "  ⚠️  App may still be starting (status: $APP_STATUS)"
    echo "  Check logs: sudo journalctl -u campusiq -f --no-pager -n 50"
fi
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  🌐 Access: http://$EC2_IP"
echo "  📊 Status: sudo systemctl status campusiq"
echo "  📋 Logs:   sudo journalctl -u campusiq -f"
echo "  🔄 Restart: sudo systemctl restart campusiq"
echo ""
echo "  App: $APP_STATUS | Nginx: $NGX_STATUS"
echo ""
