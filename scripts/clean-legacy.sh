#!/usr/bin/env bash
# Borra restos del backend (carpetas vacías, node_modules, db.json viejo)
set -e
cd "$(dirname "$0")/.."

rm -rf server api db.json .env .env.example
rm -f server/.env server/.env.example server/.envv 2>/dev/null || true

echo "Limpieza hecha. Quedan: src/, public/seed.json, package.json"
