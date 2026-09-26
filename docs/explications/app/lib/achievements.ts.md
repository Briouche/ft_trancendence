# `app/lib/achievements.ts`

> Service : **app** · TypeScript (serveur) · ~120 lignes · déblocage des succès.

## 1. Rôle

Calcule les statistiques d'un joueur, **débloque** les succès atteints (avec leurs paquets de
récompense), et fournit les données de la page `/achievements` et des badges du profil.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/cardBacks.ts`, `lib/achievementCatalog.ts`.
- **Utilisé par** : `app/api/achievements/route.ts`, `app/api/user/summary/route.ts`,
  `app/api/packs/open/route.ts`, `lib/profile.ts` (`getBadges`).

## 3. Explication bloc par bloc

- `computeStats(userId)` : victoires (total, PvP, IA difficile), parties jouées, paquets ouverts,
  cartes différentes possédées, collection complète, amis, messages envoyés, Elo — **recalculés
  depuis la base** (pas de compteurs en double qui pourraient diverger).
- `evaluateAchievements(userId)` :

```ts
const reached = ACHIEVEMENTS.filter(a => !déjàObtenu(a) && stats[a.metric] >= a.goal);
return prisma.$transaction(async (tx) => {
    for (const a of reached) {
        const { count } = await tx.userAchievement.createMany({ data: [{ userId, key: a.key }], skipDuplicates: true });
        if (count === 1) unlocked.push(a);          // c'est NOUS qui l'avons inséré
    }
    if (packs > 0) await tx.user.update({ …, data: { unopenedPacks: { increment: packs } } });
    return unlocked;
});
```

Sûr en concurrence : si deux appels arrivent en même temps, un seul insère la ligne et donc un
seul accorde les paquets.

- `getAchievementStatuses` : tous les succès avec progression et date.
- `getBadges` : les succès débloqués (badges) pour le profil public.

## 4. Flux concret

Retour au hub après une première victoire → `/api/user/summary` appelle `evaluateAchievements` →
« First Blood » inséré, +1 paquet → toast « Achievement unlocked ».

## 5. Points d'attention

- Les succès sont évalués aux moments clés (hub, page succès, ouverture de paquet) plutôt qu'en
  continu : suffisant et simple.

## 6. Questions probables en évaluation

- **Où sont stockés les succès ?** Table `UserAchievement` (clé + date).
- **Un succès peut-il être donné deux fois ?** Non : clé primaire (userId, key) + insertion
  conditionnelle.
