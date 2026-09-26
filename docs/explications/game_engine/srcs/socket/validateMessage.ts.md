# `game_engine/srcs/socket/validateMessage.ts`

> Service : **game_engine** · TypeScript · ~45 lignes · validation des messages clients.

## 1. Rôle

Le client n'est pas fiable (n'importe qui peut envoyer n'importe quel JSON sur le socket). Ces
fonctions vérifient la **forme** des messages avant qu'ils n'atteignent le moteur.

## 2. Dépendances

- **Importe** : `shared/protocol.ts` (types), `ai/types.ts` (`DIFFICULTY_PRESETS`).
- **Utilisé par** : `socket/serverSocket.ts` (`isDifficulty`, `isDeckId`),
  `socket/gameSession.ts` (`isWellFormed`), `tests/validateMessage.test.ts`.

## 3. Explication bloc par bloc

```ts
export function isDifficulty(value: unknown): value is Difficulty {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(DIFFICULTY_PRESETS, value);
}
```

`hasOwnProperty` et non `value in PRESETS` : `"__proto__"` ou `"toString"` seraient sinon
acceptés. Une difficulté inconnue bloquait l'IA (la partie ne finissait jamais).

- `isDeckId` : entier positif.
- `isWellFormed(msg)` : objet non nul ; `playCard` → `cardId` chaîne, `boardIndex` entier ou
  absent ; `attack` → deux chaînes ; `targetChoice` → chaîne ou `null`.

## 4. Flux concret

Un client malveillant envoie `{ type: "playCard", cardId: "x", boardIndex: "2" }` : la chaîne
`"2"` passerait les comparaisons numériques (toujours fausses) ; `isWellFormed` le refuse.

## 5. Points d'attention

- Ce fichier n'a **aucun effet de bord** (pas de connexion) : il est testable seul.

## 6. Questions probables en évaluation

- **Comment valides-tu les entrées côté socket ?** Forme ici, puis règles (tour, main, cibles)
  dans `GameSession`.
