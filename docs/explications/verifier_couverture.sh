#!/bin/sh
# Liste les fichiers sources du dépôt qui n'ont pas encore leur page d'explication
# (docs/explications/<chemin du fichier>.md). Sans sortie = couverture complète.
# Exclus : fichiers générés (migrations SQL, next-env.d.ts), lockfiles, données JSON, assets
# binaires, fichiers de config triviaux (tsconfig, postcss, .gitignore…), la doc elle-même.
cd "$(dirname "$0")/../.." || exit 1
git -c core.quotepath=off ls-files \
  | grep -vE '\.(webp|png|jpg|jpeg|gif|svg|ico|mp3|wav|ogg|woff2?|ttf|otf|ase|txt|json)$' \
  | grep -vE 'package-lock|/migrations/|next-env\.d\.ts|\.gitignore|\.dockerignore|^docs/|README|\.env\.example|tsconfig|postcss|^collection/|^app/public/' \
  | while read -r f; do [ -f "docs/explications/$f.md" ] || echo "$f"; done
# package.json are data but explain the scripts/dependencies: checked separately.
for f in app/package.json game_engine/package.json socket-server/package.json; do
  [ -f "docs/explications/$f.md" ] || echo "$f"
done
