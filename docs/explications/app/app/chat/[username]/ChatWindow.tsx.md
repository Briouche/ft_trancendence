# `app/app/chat/[username]/ChatWindow.tsx`

> Service : **app** · Client Component · la fenêtre de chat

## 1. Rôle

Conversation en temps réel : en-tête (avatar, nom, présence), messages (les miens à droite), chargement des messages plus anciens, champ d'envoi.

## 2. Dépendances

- **Importe** : composants `ui/*`, `usePresence`, `useRealtimeEvent`, `lib/chatEvents.ts`, `lib/validation.ts`, `config/routes.ts`.

## 3. Explication bloc par bloc

- `merge(messages)` : fusion **par id** (un message reçu à la fois par la réponse HTTP et par le socket n'apparaît qu'une fois), tri par id.
- `useRealtimeEvent("chat:message")` : ajoute les messages de **cette** conversation (y compris ceux envoyés depuis un autre onglet).
- `send` : `messageContentSchema` côté client, `POST /api/messages/:id`, erreur affichée sinon.
- `loadOlder` : `?before=<plus ancien id>`.
- Défilement automatique vers le dernier message.

## 4. Flux concret

Alice écrit « salut » → Bob le voit apparaître instantanément sur la même page.

## 5. Points d'attention

- Le contenu est rendu en texte (`{m.content}`), jamais en HTML : une balise `<script>` s'affiche telle quelle.
- Heure formatée dans le fuseau du lecteur (`suppressHydrationWarning`).

## 6. Questions probables en évaluation

- **Les messages sont-ils protégés contre le XSS ?** Oui : React échappe le texte.
