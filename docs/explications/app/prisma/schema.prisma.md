# `app/prisma/schema.prisma`

> Service : **app** · schéma Prisma · le modèle de données

## 1. Rôle

Définit toutes les tables, leurs champs et relations (partagé avec le serveur de jeu). Voir le diagramme ER de `00_VUE_ENSEMBLE.md`.

## 2. Dépendances

- **Utilisé par** : `prisma generate` (client typé), `prisma migrate`, `app/lib/*`, `game_engine/srcs/*`.

## 3. Explication bloc par bloc

| Modèle | Rôle | Clés / contraintes |
|---|---|---|
| `User` | compte, stats, récompenses (dont `unlockedCardBacks` : les dos débloqués = les succès) | `email` et `username` uniques, `fortyTwoId` unique, `tokenVersion` |
| `Friendship` | amitié (PENDING/ACCEPTED) | `@@unique([requesterId, addresseeId])`, suppression en cascade |
| `Message` | chat | index par paire d'utilisateurs, 500 caractères max |
| `Match` / `MatchPlayer` | historique | un `MatchPlayer` par siège humain, variation d'Elo |
| `Card` | catalogue, effets en JSON | `id` texte |
| `UserCard` | collection | clé `(userId, cardId)` |
| `Deck` / `DeckCard` | decks | cascade deck → cartes |

Toutes les données d'un utilisateur sont supprimées avec lui (`onDelete: Cascade`).

## 4. Flux concret

Ajouter un champ → modifier ici → créer une migration (voir `02_MODIFICATIONS_EVAL.md`).

## 5. Points d'attention

- La présence n'est pas en base (Redis).
- `Friendship.status = BLOCKED` n'est pas utilisé.

## 6. Questions probables en évaluation

- **Montrez votre schéma.** Ce fichier + le diagramme ER.
- **Pourquoi PostgreSQL ?** Relationnel (amis, decks, parties), transactions et contraintes d'unicité pour la concurrence, tableaux natifs (`Int[]`).
