# `app/app/users/[username]/PublicProfileView.tsx`

> Service : **app** · Client Component · profil public

## 1. Rôle

Identité (avatar, nom, présence en direct, inscription), **action** selon la relation (éditer son profil, ajouter en ami, accepter sa demande, demande envoyée, chat), statistiques (Elo, parties, victoires), **dos de cartes gagnés** (les succès, avec leur condition), **10 dernières parties**.

## 2. Dépendances

- **Importe** : composants `ui/*`, `CardBackArt`, `useToast`, `usePresence`, `useRealtimeEvent`, `lib/chatEvents.ts`, `config/routes.ts`, type `PublicProfile`.

## 3. Explication bloc par bloc

- `actions` : `switch (relationship.kind)`.
- `call(url, init, success)` : envoie l'action, toast (en tenant compte du `{ ok }` des demandes d'ami), `router.refresh()`.
- `friends:changed` → `router.refresh()` (la page est rendue côté serveur).

## 4. Flux concret

Alice ajoute Bob depuis son profil → « Friend request sent » → le bouton devient « Friend request sent ».

## 5. Points d'attention

- Tableau de l'historique défilant sur mobile.

## 6. Questions probables en évaluation

- **Que voit-on sur le profil d'un joueur ?** Voir ci-dessus.
