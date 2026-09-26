# `game_engine/srcs/cardImport/effectFactory.ts`

> Service : **game_engine** · TypeScript · ~135 lignes · JSON des cartes → effets.

## 1. Rôle

Les effets des cartes sont stockés en **JSON** dans la table `Card` (colonnes `battlecry`,
`deathrattle`, `spellEffect`…). Ce fichier définit le format de ce JSON (`EffectSpec`,
`ResolverSpec`) et le traduit en objets `Effect` / `TargetResolver`.

**Pourquoi** : ajouter une carte = ajouter des données, pas du code (tant qu'elle combine des
effets existants).

## 2. Dépendances

- **Importe** : `effect.ts` (toutes les classes d'effet), `target.ts` (tous les resolvers),
  `cardLoader.ts` (`rawToMinionCard` pour les jetons invoqués).
- **Utilisé par** : `cardLoader.ts`.

## 3. Explication bloc par bloc

- `ResolverSpec` : `{ kind: "enemyMinion" }`, `{ kind: "allMinions" }`, … (18 sortes).
- `EffectSpec` : `{ kind: "damage", amount, resolver }`, `{ kind: "summon", tokens, amount }`,
  `{ kind: "combined", effects: [...] }`, …
- `buildResolver(spec)` : un `switch` qui instancie la bonne classe (par défaut
  `AnyCharacterResolver`).
- `buildEffect(spec)` : idem pour les effets, **récursif** pour `combined` et `addKeyword`
  (l'effet ajouté est lui-même décrit en JSON).

Exemple réel (colonne `battlecry`) :

```json
{ "kind": "damage", "amount": 3, "resolver": { "kind": "anyCharacter" } }
```

→ `new DamageEffect(3, new AnyCharacterResolver())`.

## 4. Flux concret

Au chargement du catalogue, chaque carte passe par `rawToMinionCard`, qui appelle `buildEffect`
pour chacune de ses colonnes d'effet.

## 5. Points d'attention

- Un `kind` inconnu donne `undefined` (effet absent) ou un resolver par défaut : vérifier le JSON
  d'une nouvelle carte avec une partie de test.

## 6. Questions probables en évaluation

- **Comment ajouter une carte ?** Une entrée dans `app/prisma/seeds/data/tcg-collection.json`
  (stats + effets en JSON) et son image ; le seed l'insère.
