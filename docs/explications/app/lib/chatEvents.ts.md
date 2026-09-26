# `app/lib/chatEvents.ts`

> Service : **app** · TypeScript (client et serveur) · ~35 lignes · contrat du socket de chat.

## 1. Rôle

Noms des événements temps réel et forme de leurs données, partagés entre le serveur
(`lib/realtime.ts`) et le navigateur (`RealtimeProvider`) : `chat:message`, `friends:changed`,
`presence`, `presence:watch`, `presence:unwatch`. Type `ChatMessage`.

## 2. Dépendances

- **Utilisé par** : `lib/friends.ts`, `lib/messages.ts`, `components/realtime/RealtimeProvider.tsx`,
  `app/friends/FriendsPanel.tsx`, `app/chat/**`, `app/users/**`.

## 3. Explication bloc par bloc

Une constante `CHAT_EVENTS` (évite les fautes de frappe dans les noms d'événements) et des types.

## 4. Flux concret

`useRealtimeEvent(CHAT_EVENTS.friendsChanged, refresh)` dans la page Amis.

## 5. Points d'attention

- Les mêmes noms sont écrits en dur dans `socket-server/index.js` (JavaScript sans import TS).

## 6. Questions probables en évaluation

- **Quels événements temps réel existent ?** Ceux listés ici + ceux du jeu (`protocol.ts`).
