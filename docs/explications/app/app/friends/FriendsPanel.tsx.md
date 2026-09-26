# `app/app/friends/FriendsPanel.tsx`

> Service : **app** · Client Component · gestion des amis

## 1. Rôle

Quatre panneaux : **ajouter** un ami (par nom), **demandes reçues** (accepter/refuser), **demandes envoyées** (annuler), **amis** (chat, retirer). Présence en direct pour tout le monde affiché ; rafraîchissement automatique sur `friends:changed`.

## 2. Dépendances

- **Importe** : composants `ui/*`, `useToast`, `usePresence`, `useRealtimeEvent`, `lib/chatEvents.ts`, `lib/validation.ts`, `config/routes.ts`, `./UserRow`.

## 3. Explication bloc par bloc

- `loadFriendsData()` : `/api/friends` + `/api/friends/requests` en parallèle.
- `addFriend` : `usernameSchema` côté client puis `POST` ; `{ ok }` → toast de succès ou message d'erreur.
- `run(request, success)` : exécute une action, affiche l'erreur éventuelle, recharge.
- Retrait : `window.confirm` avant l'appel.

## 4. Flux concret

Bob accepte la demande d'Alice : chez Alice, la demande disparaît des « envoyées » et Bob apparaît dans « Friends », en ligne.

## 5. Points d'attention

- `useRealtimeEvent` évite de recharger manuellement.

## 6. Questions probables en évaluation

- **Comment ajoute-t-on / retire-t-on un ami ?** Cette page (ou le profil public).
