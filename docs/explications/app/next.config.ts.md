# `app/next.config.ts`

> Service : **app** · configuration Next.js · réglages du framework

## 1. Rôle

Sortie `standalone` (image de production légère), Prisma en paquet externe, alias de Phaser vers une version allégée (`game/phaserVendor/phaserEntry.ts`, sans le moteur physique inutilisé) et vers un stub de `phaser3spectorjs`, désactivation du cache disque de Turbopack en dev, origines autorisées pour le rechargement à chaud via nginx.

## 2. Dépendances

- Lu par Next.js au démarrage et au build.

## 3. Explication bloc par bloc

- `resolveAlias` (Turbopack, chemin relatif) et `webpack` (chemin absolu) : même alias pour les deux bundlers.
- `allowedDevOrigins` : `localhost:8080` (proxy HTTPS) et le réseau local pour jouer à plusieurs en LAN.

## 4. Flux concret

`make` → Turbopack en dev avec ces alias.

## 5. Points d'attention

- Modifier ce fichier redémarre le serveur de dev.

## 6. Questions probables en évaluation

- Aucune spécifique.
