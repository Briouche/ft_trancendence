# `app/lib/messages.ts`

> Service : **app** · TypeScript (serveur) · ~60 lignes · messages de chat.

## 1. Rôle

Lire une conversation (par pages) et envoyer un message : enregistrement **puis** diffusion en
temps réel aux deux participants.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/realtime.ts`, `lib/chatEvents.ts`.
- **Utilisé par** : `app/api/messages/[userId]/route.ts`, `app/chat/[username]/page.tsx`.

## 3. Explication bloc par bloc

- `getConversation(userId, otherId, beforeId?)` : les 50 derniers messages entre les deux (dans
  les deux sens), triés par id ; `beforeId` charge la page précédente (pagination par curseur,
  stable même si de nouveaux messages arrivent).
- `sendMessage(senderId, recipientId, content)` : `message.create`, puis
  `pushToUsers([expéditeur, destinataire], "chat:message", message)` (tous leurs onglets).
- Chaque message inclut `senderName` (pour la notification « New message from … »).

## 4. Flux concret

Voir le diagramme « message WebSocket » de `00_VUE_ENSEMBLE.md`.

## 5. Points d'attention

- Les vérifications (amis ? longueur ? débit ?) sont faites **avant**, par la route API.

## 6. Questions probables en évaluation

- **Les messages sont-ils persistés ?** Oui, table `Message` ; l'historique est rechargé à
  l'ouverture de la conversation.
