# `app/lib/devTools.ts`

> Service : **app** · TypeScript (client et serveur) · ~5 lignes.

## 1. Rôle

`DEV_TOOLS_ENABLED` : vrai hors production. Active les outils de test (paquet gratuit, tout
débloquer, vider la collection) — boutons **et** routes API.

## 2. Dépendances

- **Utilisé par** : `app/packs/PackOpener.tsx`, routes `packs/grant`, `collection/unlock-all`,
  `collection/clear`.

## 3. Explication bloc par bloc

`process.env.NODE_ENV !== "production"` : Next remplace cette valeur au build, elle fonctionne
donc aussi dans le navigateur.

## 4. Flux concret

`make prod` → les routes de test répondent 404 et les boutons disparaissent.

## 5. Points d'attention

- Sans ce garde-fou, n'importe quel joueur pourrait se donner toute la collection en production.

## 6. Questions probables en évaluation

- **Pourquoi ces boutons de triche ?** Pour tester en développement ; désactivés en production.
