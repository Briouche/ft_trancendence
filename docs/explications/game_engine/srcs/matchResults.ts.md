# `game_engine/srcs/matchResults.ts`

> Service : **game_engine** · TypeScript · ~120 lignes · enregistrement d'une partie terminée.

## 1. Rôle

Tout ce qu'une fin de partie change en base, **dans une seule transaction** :
compteurs de victoires, paquets gagnés, dos de carte débloqué à la première victoire, Elo (PvP),
et l'historique (`Match` + `MatchPlayer`). Renvoie ce que chaque joueur a gagné, pour l'écran de
fin.

## 2. Dépendances

- **Importe** : `@prisma/client` (`MatchMode`), `db.ts`, `ai/types.ts` (`Difficulty`),
  `shared/protocol.ts` (`MatchRewards`).
- **Utilisé par** : `socket/gameSession.ts` (`finish`), `tests/matchResults.test.ts` (Elo).

## 3. Explication bloc par bloc

- `AI_MATCH_MODE` : difficulté → `AI_EASY` / `AI_MEDIUM` / `AI_HARD`.
- `PACKS_FOR_WIN` : 0 (facile), 1 (moyen), 2 (difficile), 2 (PvP). Doit rester égal à
  `packsForWin` dans `app/app/play/PlayModeSelector.tsx` (ce qui est annoncé au joueur).
- `CARD_BACK_FOR_WIN` : dos de carte 3 à 6 selon le mode.
- `eloDeltas(winnerElo, loserElo)` :

```ts
const expectedWinner = 1 / (1 + 10 ** ((loserElo - winnerElo) / 400));   // proba de victoire attendue
const delta = Math.round(ELO_K_FACTOR * (1 - expectedWinner));            // K = 32
return { winner: delta, loser: -delta };
```

Entre deux joueurs à égalité : ±16. Battre plus fort que soi rapporte plus.

- `recordMatch(mode, endReason, humans)` :
  1. PvP : lit les deux Elo, applique ±delta ;
  2. pour chaque gagnant humain : +1 au compteur de victoires du mode, +paquets ;
  3. dos de carte : `updateMany` **conditionnel** (`NOT has`) avec `push` → accordé une seule fois
     même si deux résultats s'enregistrent en même temps ; on sait qu'il vient d'être débloqué si
     `count === 1` ;
  4. crée le `Match` et ses `MatchPlayer` (gagné/perdu, variation d'Elo).

## 4. Flux concret

Alice (1000) bat Bob (1000) en PvP → Alice 1016, Bob 984, Alice +2 paquets, dos de carte n°3 si
c'est sa première victoire PvP, une ligne `Match(PVP, "hero")` + deux `MatchPlayer`.

## 5. Points d'attention

- Contre l'IA, seul l'humain a une ligne `MatchPlayer` ; une défaite contre l'IA enregistre donc
  un match avec un seul joueur `won: false`.
- Tout est dans la transaction : si l'enregistrement échoue, rien n'est à moitié écrit.

## 6. Questions probables en évaluation

- **Comment calcules-tu l'Elo ?** Formule standard, K = 32, `eloDeltas`.
- **Où sont les récompenses de victoire ?** `PACKS_FOR_WIN`, `CARD_BACK_FOR_WIN`.
- **Et si deux fins de partie arrivaient en même temps ?** Transaction + mise à jour
  conditionnelle du dos de carte.
