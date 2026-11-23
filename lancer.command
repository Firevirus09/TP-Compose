#!/bin/bash
# Double-clic dans le Finder : démarre l'application et ouvre le navigateur.
cd "$(dirname "$0")" || exit 1

# Démarre Docker Desktop s'il ne tourne pas
if ! docker info >/dev/null 2>&1; then
  echo "Démarrage de Docker Desktop..."
  open -a Docker
  until docker info >/dev/null 2>&1; do sleep 2; done
fi

echo "Construction et démarrage des services..."
docker compose up -d --build --wait || { echo "Échec du démarrage."; read -rp "Entrée pour fermer..."; exit 1; }

echo "Application prête sur http://localhost:9091"
[ -z "$NO_OPEN" ] && open http://localhost:9091
