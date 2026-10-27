#!/usr/bin/env bash
# Deploys one version of the site on the EC2 server. GitHub Actions runs it through
# AWS Systems Manager after building the images; it can also be run by hand:
#   sudo /opt/portfolio/deploy/deploy.sh <image-tag> [--seed]
# --seed loads the CV content into an empty database (first deploy only).
set -euo pipefail

TAG="${1:?usage: deploy.sh <image-tag> [--seed]}"
SEED="${2:-}"
REGION="${AWS_REGION:-eu-west-2}"
PREFIX="/portfolio/prod"

cd "$(dirname "$0")"
umask 077  # env files hold secrets: readable by root only

# Writes every parameter under $PREFIX/<group>/ as NAME=value lines.
render() {
  aws ssm get-parameters-by-path --region "$REGION" --path "$PREFIX/$1/" --with-decryption \
    --query 'Parameters[].[Name,Value]' --output text \
    | awk -F'\t' '{ name = $1; sub(/.*\//, "", name); print name "=" $2 }' > "$2.tmp"
  [ -s "$2.tmp" ] || { echo "No parameters found under $PREFIX/$1/" >&2; exit 1; }
  mv "$2.tmp" "$2"
}

render compose .env
echo "IMAGE_TAG=$TAG" >> .env
render backend backend.env
render analytics analytics.env

ECR_REGISTRY="$(grep '^ECR_REGISTRY=' .env | cut -d= -f2)"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

docker compose -f docker-compose.prod.yml pull --quiet
docker compose -f docker-compose.prod.yml up -d --remove-orphans --wait --wait-timeout 300

if [ "$SEED" = "--seed" ]; then
  docker compose -f docker-compose.prod.yml exec -T backend python manage.py seed_portfolio
fi

# Free disk space: remove images no container uses that are older than a week.
docker image prune -af --filter "until=168h" > /dev/null
echo "Deployed $TAG"
