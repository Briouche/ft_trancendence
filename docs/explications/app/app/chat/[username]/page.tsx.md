# `app/app/chat/[username]/page.tsx`

> Service : **app** · Server Component (page) · `/chat/:username`

## 1. Rôle

Conversation avec un ami : vérifie que la personne existe **et** est un ami (sinon 404), charge les 50 derniers messages et rend `ChatWindow`.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/friends.ts`, `lib/messages.ts`, `lib/avatar.ts`, `config/routes.ts`, `./ChatWindow`.

## 3. Explication bloc par bloc

`generateMetadata` (titre « Chat with … ») ; `notFound()` si soi-même, inconnu ou pas ami.

## 4. Flux concret

Clic « Chat » sur un ami → cette page.

## 5. Points d'attention

- Le 404 ne révèle pas si le compte existe.

## 6. Questions probables en évaluation

- **Que se passe-t-il si j'ouvre le chat d'un non-ami ?** Page 404.
