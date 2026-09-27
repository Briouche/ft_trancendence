# `app/lib/achievements.ts`

> Service : **app** · TypeScript (serveur uniquement) · ~60 lignes · progression des succès (= dos de cartes)

## 1. Rôle

Dans ce jeu, **les succès sont les dos de cartes à débloquer** (décision de l'équipe, voir
`docs/DECISIONS.md`) : 5 dos s'obtiennent par un exploit (1ʳᵉ victoire contre un joueur, contre
l'IA facile / moyenne / difficile, collection complète). Ce module **ne débloque rien** : il
calcule seulement, pour un joueur, la progression vers chacun de ces dos (page `/achievements`) et
la liste des dos déjà gagnés (profil public).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/cardBacks.ts` (`ACHIEVEMENT_CARD_BACKS`, `ACHIEVEMENT_CARD_BACK_HINTS`).
- **Utilisé par** : `app/api/achievements/route.ts`, `lib/profile.ts`.
- **Le déblocage lui-même** est fait ailleurs, au moment où l'exploit se produit :
  `game_engine/srcs/matchResults.ts` (victoires) et `lib/packs.ts` (collection complète).

## 3. Explication bloc par bloc

- `CardBackAchievement` : `{ cardBack, rule, value, goal, unlocked }` — un succès tel qu'affiché.
- `getCardBackAchievements(userId)` : lit en parallèle les victoires par mode + les dos débloqués,
  la collection du joueur et le catalogue.

```ts
// Collection mesurée en exemplaires : chaque carte compte jusqu'à son maximum par joueur.
const collectionGoal  = cards.reduce((sum, c) => sum + c.qty, 0);
const collectionValue = cards.reduce((sum, c) => sum + Math.min(c.qty, ownedQty.get(c.id) ?? 0), 0);

const progress = {
  winVsPlayer:    [user.winsVsPlayer, 1],     // objectif : 1 victoire
  winVsAiEasy:    [user.winsVsAiEasy, 1],
  winVsAiMedium:  [user.winsVsAiMedium, 1],
  winVsAiHard:    [user.winsVsAiHard, 1],
  fullCollection: [collectionValue, collectionGoal],
};
```

  `unlocked` vient de `unlockedCardBacks` (la source de vérité), pas du calcul : un dos accordé
  reste acquis même si la valeur baisse ensuite. `value` est plafonnée à `goal` pour la barre.
- `getEarnedCardBacks(userId)` : les dos de succès déjà débloqués, avec leur règle, pour le profil.

## 4. Flux concret

Première victoire contre l'IA moyenne → `matchResults.ts` ajoute le dos 5 à `unlockedCardBacks`
(l'écran de fin l'annonce) → sur `/achievements`, ce module renvoie ce dos avec `unlocked: true`
et « ✅ Unlocked ».

## 5. Points d'attention

- Aucune table dédiée : l'état est `User.unlockedCardBacks` (+ les compteurs de victoires et la
  collection). Pas de double compteur qui pourrait diverger.
- L'outil de dev `POST /api/collection/unlock-all` donne tous les dos (désactivé en production).

## 6. Questions probables en évaluation

- **Où sont stockés les succès ?** Dans `User.unlockedCardBacks` (tableau d'entiers).
- **Un succès peut-il être donné deux fois ?** Non : le déblocage est une mise à jour
  conditionnelle (`NOT has` → `push`) ; une seule requête concurrente l'applique.
- **Comment ajouter un succès ?** Voir `docs/explications/02_MODIFICATIONS_EVAL.md` (exemple 6).
