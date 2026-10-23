#!/bin/sh
# Apply database migrations, then start the service.
set -e
alembic upgrade head
exec "$@"
