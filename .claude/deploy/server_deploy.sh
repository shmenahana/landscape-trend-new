#!/usr/bin/env bash
# Deploy script — runs ON THE SERVER. Idempotent; safe to re-run.
# Inputs (env vars expected): DASHBOARD_PASSWORD (24+ chars), DOMAIN
set -euo pipefail

APP_DIR="/opt/magnet-parlor"
DOMAIN="${DOMAIN:-themagnetparlor.com}"
TARBALL="/tmp/magnet-parlor.tar.gz"

if [ ! -f "$TARBALL" ]; then
  echo "FATAL: $TARBALL missing — scp the code first" >&2
  exit 1
fi
# DASHBOARD_PASSWORD is only required on first install (when no .env exists yet).
# On re-deploys the existing .env is preserved, so the password isn't needed.
if [ ! -f "/opt/magnet-parlor/.env" ] && [ -z "${DASHBOARD_PASSWORD:-}" ]; then
  echo "FATAL: DASHBOARD_PASSWORD not set and no existing .env to preserve" >&2
  exit 1
fi

echo "===== [1/9] Extract code into $APP_DIR ====="
mkdir -p "$APP_DIR"
# Preserve any existing .env and data/ across re-deploys
if [ -f "$APP_DIR/.env" ]; then cp "$APP_DIR/.env" "/tmp/magnet-parlor.env.bak"; fi
# Extract, but never overwrite the data/ directory
tar -xzf "$TARBALL" -C "$APP_DIR"
mkdir -p "$APP_DIR/data" "$APP_DIR/public/uploads"
chmod 755 "$APP_DIR/data" "$APP_DIR/public/uploads"

echo "===== [2/9] Write .env (only if first deploy) ====="
if [ -f "$APP_DIR/.env" ]; then
  echo "  .env already exists — keeping existing values (re-deploy)."
else
  cat > "$APP_DIR/.env" <<EOF
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
DATABASE_URL=file:./data/magnet-parlor.db
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
CONTACT_TO_EMAIL=hello@themagnetparlor.com
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF
  chmod 600 "$APP_DIR/.env"
  echo "  .env written."
fi

echo "===== [3/9] npm install (incl. build-essential for native modules) ====="
cd "$APP_DIR"
if ! dpkg -s build-essential >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq build-essential python3
fi
# Need devDeps for `next build` (typescript, tailwind). Show last ~40 lines for errors.
( npm ci --no-audit --no-fund --include=dev || npm install --no-audit --no-fund --include=dev ) 2>&1 | tail -40

echo "===== [4/9] Build Next.js ====="
NEXT_TELEMETRY_DISABLED=1 npm run build 2>&1 | tail -30

echo "===== [5/9] PM2: start / reload app ====="
cat > "$APP_DIR/ecosystem.config.js" <<'EOF'
module.exports = {
  apps: [{
    name: 'magnet-parlor',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    cwd: '/opt/magnet-parlor',
    autorestart: true,
    max_memory_restart: '500M',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', PORT: '3000' },
    error_file: '/var/log/magnet-parlor.err.log',
    out_file: '/var/log/magnet-parlor.out.log',
    time: true,
  }]
};
EOF

if pm2 describe magnet-parlor >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

# pm2 startup for systemd — captures and runs the generated command if not already configured
if ! systemctl list-unit-files 2>/dev/null | grep -q '^pm2-root\.service'; then
  STARTUP_CMD=$(pm2 startup systemd -u root --hp /root 2>&1 | grep -E '^sudo env' || true)
  if [ -n "$STARTUP_CMD" ]; then
    eval "${STARTUP_CMD#sudo }"
  fi
fi

echo "===== [6/9] Install nginx (if missing) ====="
if ! command -v nginx >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx
fi

echo "===== [7/9] Configure nginx reverse proxy for $DOMAIN ====="
# Note: we only write this on FIRST install. Once certbot has rewritten it
# (added 443/SSL + redirect block), we leave it alone so re-deploys don't
# clobber the SSL config or trigger needless certbot interaction.
if [ ! -f /etc/nginx/sites-available/magnet-parlor ] || ! grep -q "listen 443" /etc/nginx/sites-available/magnet-parlor; then
  cat > /etc/nginx/sites-available/magnet-parlor <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 25M;

    # User-uploaded photos — served directly by nginx (Next public/ is
    # scanned at startup, so files added at runtime aren't served by it).
    location /uploads/ {
        alias /opt/magnet-parlor/public/uploads/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files \$uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
else
  echo "  nginx site already configured with SSL — leaving in place."
fi
ln -sf /etc/nginx/sites-available/magnet-parlor /etc/nginx/sites-enabled/magnet-parlor
# Remove default catch-all if present so our server_name wins for everything
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx || systemctl start nginx

echo "===== [8/9] Firewall (UFW) — open 80/443 if active ====="
if command -v ufw >/dev/null && ufw status | head -1 | grep -qi active; then
  ufw allow 'Nginx Full' || ufw allow 80/tcp; ufw allow 443/tcp
fi

echo "===== [9/9] Certbot for $DOMAIN ====="
if ! command -v certbot >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx
fi
# Build the -d list, only including www if it resolves to this VPS.
THIS_IP=$(curl -s -4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
WWW_IP=$(getent hosts www.$DOMAIN | awk '{print $1}' | head -1)
DOMAIN_ARGS="-d $DOMAIN"
if [ -n "$WWW_IP" ] && [ "$WWW_IP" = "$THIS_IP" ]; then
  DOMAIN_ARGS="$DOMAIN_ARGS -d www.$DOMAIN"
  echo "  Including www.$DOMAIN (resolves to $WWW_IP)"
else
  echo "  Skipping www.$DOMAIN (resolves to '${WWW_IP:-nothing}', want '$THIS_IP')"
  # nginx server_name still lists www; that's fine, it just won't have a valid cert
fi
certbot --nginx $DOMAIN_ARGS --non-interactive --agree-tos -m "hello@$DOMAIN" --redirect --keep-until-expiring 2>&1 | tail -20

echo
echo "===== Smoke checks ====="
sleep 2
echo "-- pm2 status --"
pm2 status magnet-parlor || true
echo "-- localhost:3000 --"
curl -sS -o /dev/null -w "  http://127.0.0.1:3000  → %{http_code}\n" http://127.0.0.1:3000/ || true
echo "-- nginx http://$DOMAIN --"
curl -sS -o /dev/null -w "  http://$DOMAIN  → %{http_code}\n" "http://$DOMAIN/" || true
echo "-- nginx https://$DOMAIN --"
curl -sS -o /dev/null -w "  https://$DOMAIN → %{http_code}\n" "https://$DOMAIN/" || true

echo "===== Done. ====="
