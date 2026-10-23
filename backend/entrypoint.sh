#!/bin/sh
# Container start-up: apply migrations, collect admin static files, then serve.
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput >/dev/null

if [ "${SEED_ON_START:-0}" = "1" ]; then
  python manage.py seed_portfolio
fi

exec "$@"
