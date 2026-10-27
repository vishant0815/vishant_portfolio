#!/bin/bash
# EC2 user data: prepares a fresh Amazon Linux 2023 (arm64) server. Runs once, as root.
set -euxo pipefail

dnf install -y docker git
systemctl enable --now docker

# Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v5.5.1/docker-compose-linux-aarch64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 2 GB swap as a safety net for the small server
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
fi

# The repository is public, so no credentials are needed to clone it.
git clone https://github.com/vishant0815/vishant_portfolio.git /opt/portfolio
