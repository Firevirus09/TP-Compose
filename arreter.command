#!/bin/bash
# Double-clic dans le Finder : arrête l'application (les données sont conservées).
cd "$(dirname "$0")" || exit 1
docker compose down
echo "Application arrêtée."
