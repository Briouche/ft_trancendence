# `game_engine/srcs/ai/utils.ts`

> Service : **game_engine** · TypeScript · ~20 lignes · utilitaires de l'IA.

## 1. Rôle

- `shuffle(arr)` : copie mélangée (Fisher-Yates).
- `replaceHand(hand, cards)` : vide une main et la remplit avec d'autres cartes.

## 2. Dépendances

- **Importe** : `hand.ts`, `card.ts`.
- **Utilisé par** : `ai/determinize.ts`.

## 3. Explication bloc par bloc

`shuffle` ne modifie pas le tableau d'origine (`[...arr]`). `replaceHand` vide la main par
`play(0)` puis ajoute les nouvelles cartes (limite de 10 respectée par `Hand.add`).

## 4. Flux concret

Voir `determinize.ts`.

## 5. Points d'attention

- Rien de particulier.

## 6. Questions probables en évaluation

- **Pourquoi Fisher-Yates ?** C'est le mélange uniforme standard, en O(n).
