# `game_engine/srcs/legendary.ts`

> Service : **game_engine** · TypeScript · ~35 lignes · les passifs des légendaires.

## 1. Rôle

Un deck peut contenir **une** carte légendaire ; sa présence donne au joueur un **passif** pour
toute la partie (même si la carte n'est pas jouée). Ce fichier liste les passifs possibles et
contient ceux qui ont une fonction dédiée.

## 2. Dépendances

- **Importe** : `card.ts`, `player.ts`, `effect.ts` (`SummonMinionEffect`).
- **Utilisé par** : `gameEngine.ts` (déclencheurs), `player.ts` et `card.ts` (type),
  `cardImport/cardLoader.ts` (reconnaît le passif d'une carte).

## 3. Explication bloc par bloc

| Passif | Effet | Où il est déclenché |
|---|---|---|
| `jeffe` | un serviteur blessé gagne +1 attaque (retiré s'il est soigné) | `jeffePassive`, appelé par `recordDamage` |
| `timmy` | le héros commence à 25 PV, sans plafond | `timmyPassive`, en début de partie |
| `freddy` | tous les 4 morts alliés, invoque un squelette 1/1 | `freddyPassive`, dans `resolveDeaths` |
| `roidesrats` | un effet de fin de tour sur 3 se déclenche deux fois | compteur dans `triggerMinionEndOfTurnEffect` |
| `gertrude` | un sort sur 4 revient en main | compteur dans `playCard` |
| `archimede` | compte les cartes « archi » jouées ; à 6, le cri de guerre d'Archimède tue | `archiDamageEffect` (`effect.ts`) |

## 4. Flux concret

Alice a « Freddy » dans son deck : `checkDeckForLeg` pose `legPassive = "freddy"`. Au 4ᵉ serviteur
allié mort, `resolveDeaths` appelle `freddyPassive(context, 1)` → un « Skeleton » est invoqué.

## 5. Points d'attention

- Ajouter une légendaire : nom dans le type `legendary`, dans `LEGENDARY_PASSIVES`
  (`cardLoader.ts`), déclencheur dans `gameEngine.ts`, et `legendId` de la carte en base.

## 6. Questions probables en évaluation

- **Le passif marche-t-il si la légendaire n'est pas jouée ?** Oui, il dépend du deck.
