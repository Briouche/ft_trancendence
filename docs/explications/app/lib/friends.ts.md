# `app/lib/friends.ts`

> Service : **app** · TypeScript (serveur) · ~170 lignes · système d'amis.

## 1. Rôle

Toute la logique d'amitié : lister, demander, accepter/refuser, annuler, retirer, et connaître la
relation entre deux joueurs. Chaque changement est **poussé en temps réel** aux deux personnes
(`friends:changed`).

## 2. Dépendances

- **Importe** : `@prisma/client`, `lib/prisma.ts`, `lib/realtime.ts`, `lib/chatEvents.ts`,
  `lib/users.ts`.
- **Utilisé par** : routes `app/api/friends/**`, `app/chat/**`, `lib/profile.ts`,
  `lib/userSearch.ts` (via ses propres requêtes), `app/api/messages/[userId]` (`areFriends`).

## 3. Explication bloc par bloc

Modèle : **une ligne `Friendship` par paire**, dans le sens de la première demande
(`requesterId → addresseeId`), `PENDING` puis `ACCEPTED`.

- `listFriends`, `listRequests(incoming|outgoing)` : avec avatar et présence (`toPublicUsers`).
- `areFriends(a, b)`, `relationship(viewer, other)` : `self`, `none`, `friends`, `incoming`,
  `outgoing` (pour les boutons du profil public).
- `sendFriendRequest(userId, username)` :

```ts
prisma.$transaction(async (tx) => {
    const existing = await tx.friendship.findFirst({ where: pairWhere(a, b) });  // dans les 2 sens
    if (existing?.status === "ACCEPTED") return "already_friends";
    if (existing && existing.requesterId === userId) return "already_sent";
    if (existing) { accepter la demande inverse; return "accepted"; }
    créer; return "sent";
}, { isolationLevel: Serializable });
```

**Pourquoi SERIALIZABLE** : si Alice et Bob s'envoient une demande au même instant, les deux
transactions verraient « pas de ligne » et en créeraient deux (la contrainte d'unicité ne couvre
qu'un sens). PostgreSQL annule l'une des deux (erreur P2034), que l'on **réessaie**.

- `answerFriendRequest`, `cancelFriendRequest`, `removeFriend` : écritures **conditionnelles**
  (`updateMany`/`deleteMany` avec le destinataire/demandeur et le statut dans le `WHERE`) : un
  double clic ou deux actions simultanées ne s'appliquent qu'une fois, et seul le bon utilisateur
  peut agir.

## 4. Flux concret

Bob accepte la demande d'Alice → `answerFriendRequest(bob, id, true)` → ligne `ACCEPTED` →
`pushToUsers([bob, alice], "friends:changed")` → la page Amis d'Alice se rafraîchit toute seule.

## 5. Points d'attention

- Le statut `BLOCKED` existe dans le schéma mais n'est pas utilisé.

## 6. Questions probables en évaluation

- **Comment évites-tu les doublons d'amitié ?** Transaction SERIALIZABLE + réessai.
- **Comment Bob voit-il la demande sans recharger ?** Événement temps réel `friends:changed`.
