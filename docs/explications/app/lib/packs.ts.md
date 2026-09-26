# `app/lib/packs.ts`

> Service : **app** · TypeScript (serveur) · ~170 lignes · ouverture des paquets.

## 1. Rôle

`openPack(prisma, userId)` : consomme un paquet, tire 8 cartes selon des poids de rareté, gère la
**garantie de légendaire**, ajoute les cartes à la collection et débloque le dos de carte
« collection complète ». Tout en **une transaction**.

## 2. Dépendances

- **Importe** : `@prisma/client`, `lib/cardBacks.ts`.
- **Utilisé par** : `app/api/packs/open/route.ts`.

## 3. Explication bloc par bloc

- Constantes : 8 cartes par paquet, légendaire garantie au 5ᵉ paquet sans légendaire, poids
  (Commune 40, Rare 15, Épique 10, Légendaire 2).
- `pickWeighted` : tirage pondéré ; `drawOneSlot` : tire une rareté parmi celles où il reste des
  cartes obtenables, puis une carte de cette rareté (on ne dépasse jamais le maximum `Card.qty`
  d'exemplaires par joueur).
- `openPack` :

```ts
const taken = await tx.user.updateMany({
    where: { id: userId, unopenedPacks: { gt: 0 } },           // vérifie ET réserve en une requête
    data: { unopenedPacks: { decrement: 1 }, packsOpened: { increment: 1 } },
});
if (taken.count === 0) throw new NoPackError();
```

**Pourquoi** : deux ouvertures simultanées (double clic, deux onglets) liraient toutes deux « 1
paquet » et tireraient chacune des cartes. L'UPDATE conditionnel verrouille la ligne : la seconde
attend puis voit 0 paquet.

Ensuite : tirage, compteur de garantie (remis à 0 si une légendaire sort), dos de carte si la
collection devient complète (`push` en base), insertion des cartes par un seul
`INSERT … ON CONFLICT DO UPDATE` (SQL taggé : paramètres échappés).

## 4. Flux concret

Alice ouvre un paquet → 8 cartes révélées → la page affiche « +1 carte » dans sa collection,
« N packs until guaranteed legendary ».

## 5. Points d'attention

- Le « 5 » est aussi écrit dans `PackOpener.tsx` pour l'affichage : garder les deux égaux.

## 6. Questions probables en évaluation

- **Et si on clique deux fois très vite ?** Un seul paquet est consommé (UPDATE conditionnel).
