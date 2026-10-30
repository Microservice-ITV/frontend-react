#!/bin/sh

set -e

APP_ROOT=/app
cd "$APP_ROOT"

# Install dependencies if missing (bind-mounted volume may be empty)
if [ ! -d "$APP_ROOT/node_modules" ]; then
    npm install
fi

exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
