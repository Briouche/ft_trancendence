# `app/app/api/messages/[userId]/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · conversation

## 1. Rôle

`GET ?before=<id>` : une page de la conversation avec cet utilisateur. `POST { content }` : envoie un message. **Seulement entre amis.**

## 2. Dépendances

- **Importe** : `zod`, `lib/api.ts`, `lib/friends.ts` (`areFriends`), `lib/messages.ts`, `lib/rateLimit.ts`, `lib/validation.ts`.

## 3. Explication bloc par bloc

- `resolvePeer` : id valide + amis, sinon 404/403.
- GET : curseur `before` validé.
- POST : `messageContentSchema` (1-500), 20 messages / 10 s, puis `sendMessage` (enregistrement + temps réel).

## 4. Flux concret

Voir le diagramme « message WebSocket » de `00_VUE_ENSEMBLE.md`.

## 5. Points d'attention

- Le contenu est stocké tel quel et affiché **comme du texte** par React (pas de XSS).

## 6. Questions probables en évaluation

- **Peut-on écrire à n'importe qui ?** Non, uniquement à ses amis (403 sinon).
