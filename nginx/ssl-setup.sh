#!/bin/bash
# =============================================================================
# One-time SSL setup for Docker deployment using Let's Encrypt (Certbot)
# Run this on the VPS host machine (NOT inside a container).
#
# Prerequisites:
#   1. Domain A records point to this server's IP
#   2. Nginx container is running on port 80
#   3. certbot is installed on the host: sudo apt install -y certbot
# =============================================================================

set -e

DOMAIN="${1:-yourdomain.com}"
EMAIL="${2:-admin@${DOMAIN}}"

echo "=== Obtaining SSL certificate for ${DOMAIN} ==="

# Stop nginx container temporarily so certbot can bind port 80
docker compose -f ~/bees-perfumery/docker-compose.yml stop nginx

# Get certificate using standalone mode
sudo certbot certonly --standalone \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}"

# Create ssl directory in nginx config
sudo mkdir -p /etc/ssl/bees-perfumery

# Copy certificates to a location nginx can access
sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/ssl/bees-perfumery/
sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /etc/ssl/bees-perfumery/
sudo chmod 644 /etc/ssl/bees-perfumery/fullchain.pem
sudo chmod 600 /etc/ssl/bees-perfumery/privkey.pem

# Restart nginx container
docker compose -f ~/bees-perfumery/docker-compose.yml up -d nginx

echo ""
echo "=== Done! ==="
echo ""
echo "Now update nginx/nginx.conf to add the SSL server block, then rebuild nginx:"
echo ""
echo "  1. Add to nginx/nginx.conf:"
echo ""
echo "  server {"
echo "      listen 443 ssl http2;"
echo "      server_name ${DOMAIN} www.${DOMAIN};"
echo "      ssl_certificate /etc/ssl/bees-perfumery/fullchain.pem;"
echo "      ssl_certificate_key /etc/ssl/bees-perfumery/privkey.pem;"
echo "      ssl_protocols TLSv1.2 TLSv1.3;"
echo "      ssl_ciphers HIGH:!aNULL:!MD5;"
echo "      ... (copy rest from port 80 block) ..."
echo "  }"
echo ""
echo "  server {"
echo "      listen 80;"
echo "      server_name ${DOMAIN} www.${DOMAIN};"
echo "      return 301 https://\$host\$request_uri;"
echo "  }"
echo ""
echo "  2. cd ~/bees-perfumery && docker compose build nginx && docker compose up -d nginx"
echo ""
echo "  Add a cron job for auto-renewal:"
echo "  sudo crontab -e  -->  0 3 * * * docker stop bees-perfumery-nginx-1 && certbot renew && docker start bees-perfumery-nginx-1"
