# `app/lib/profile.ts`

> Service : **app** · TypeScript (serveur) · ~80 lignes · données du profil public.

## 1. Rôle

`getPublicProfile(username, viewerId)` : tout ce qu'affiche `/users/<nom>` — utilisateur public
(avatar, présence, Elo), date d'inscription, statistiques, badges, relation avec le visiteur, et
les **10 dernières parties** (mode, adversaire, résultat, variation d'Elo).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/achievements.ts` (`getBadges`), `lib/friends.ts`
  (`relationship`), `lib/users.ts`.
- **Utilisé par** : `app/users/[username]/page.tsx`.

## 3. Explication bloc par bloc

Une requête pour l'utilisateur, puis en parallèle (`Promise.all`) : présence, badges, relation,
historique (avec les autres joueurs de chaque partie pour afficher l'adversaire) et nombre de
parties. `null` si le nom n'existe pas (→ page 404).

## 4. Flux concret

Voir le diagramme « requête HTTP » de `00_VUE_ENSEMBLE.md`.

## 5. Points d'attention

- L'email n'est jamais sélectionné.

## 6. Questions probables en évaluation

- **Que montre un profil ?** Avatar, statut, Elo, statistiques, badges, historique.
