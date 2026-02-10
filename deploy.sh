#!/bin/bash
# ──────────────────────────────────────────
# EduTrack — AWS EC2 Deployment Script
# Run this on your EC2 instance (Ubuntu)
# ──────────────────────────────────────────

set -e
echo "🚀 Starting EduTrack deployment..."

# ── Step 1: System Updates ──
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ── Step 2: Install Node.js 20 ──
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "✅ Node.js $(node -v) installed"

# ── Step 3: Install Nginx ──
echo "📦 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx

# ── Step 4: Install Git ──
sudo apt install -y git

# ── Step 5: Clone Repository ──
echo "📥 Cloning EduTrack..."
cd /home/ubuntu
if [ -d "edutrack" ]; then
    cd edutrack
    git pull origin master
else
    git clone https://github.com/Kandulanaveennaidu/edutrack.git
    cd edutrack
fi

# ── Step 6: Install Dependencies ──
echo "📦 Installing dependencies..."
npm install --production=false

# ── Step 7: Create .env.local (EDIT THIS!) ──
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "⚠️  IMPORTANT: Edit .env.local with your real values!"
    echo "   Run: nano /home/ubuntu/edutrack/.env.local"
fi

# ── Step 8: Build ──
echo "🔨 Building production..."
npm run build

# ── Step 9: Setup Systemd Service ──
echo "⚙️  Setting up systemd service..."
sudo cp edutrack.service /etc/systemd/system/edutrack.service
sudo systemctl daemon-reload
sudo systemctl enable edutrack
sudo systemctl start edutrack

# ── Step 10: Setup Nginx ──
echo "🌐 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/edutrack
sudo ln -sf /etc/nginx/sites-available/edutrack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "════════════════════════════════════════"
echo "  ✅ EduTrack deployed successfully!"
echo "════════════════════════════════════════"
echo ""
echo "  🌐 Access: http://$(curl -s ifconfig.me)"
echo "  📊 Status: sudo systemctl status edutrack"
echo "  📋 Logs:   sudo journalctl -u edutrack -f"
echo ""
echo "  ⚠️  Don't forget to:"
echo "     1. Edit .env.local with real MongoDB URI"
echo "     2. Open ports 80 & 443 in AWS Security Group"
echo "     3. Run: sudo systemctl restart edutrack"
echo ""
