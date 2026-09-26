# `app/lib/keywords.ts`

> Service : **app** · TypeScript (client) · ~60 lignes · mots-clés en gras dans le texte des cartes.

## 1. Rôle

Découpe la description d'une carte en segments normaux / **gras** autour de ses mots-clés
(« Cri de guerre », « Provocation »…), sans tenir compte des majuscules ni des accents.

## 2. Dépendances

- **Utilisé par** : `components/CardFace.tsx`, rendu Phaser des cartes.

## 3. Explication bloc par bloc

- `KEYWORD_LABELS` : énumération du schéma (`RUEE`, `TAUNT`…) → libellé tel qu'écrit dans le texte
  des cartes (contenu du jeu, en français).
- `normalize` : minuscules sans accents (`NFD` puis suppression des diacritiques).
- `splitKeywordSegments(desc, keywords)` : trouve toutes les occurrences, les trie, ignore les
  chevauchements, renvoie la liste de segments.

## 4. Flux concret

« Cri de guerre : inflige 3 dégâts » → [« Cri de guerre » en gras, « : inflige 3 dégâts »].

## 5. Points d'attention

- Les positions sont calculées sur le texte normalisé : la normalisation garde la même longueur
  pour les lettres accentuées courantes.

## 6. Questions probables en évaluation

- Aucune spécifique.
