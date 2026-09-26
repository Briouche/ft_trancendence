# `app/components/realtime/RealtimeProvider.tsx`

> Service : **app** · Client Component · connexion temps réel

## 1. Rôle

Ouvre **une** connexion au serveur de chat par onglet connecté (ce qui rend l'utilisateur « en ligne ») et fournit aux composants : `useRealtimeEvent(événement, handler)` et `usePresence(ids)` (présence en direct). Affiche un toast à la réception d'un message quand la conversation n'est pas ouverte.

## 2. Dépendances

- **Importe** : `socket.io-client`, `next/navigation`, `lib/chatEvents.ts`, `lib/presenceTypes.ts`, `ui/Toast`.
- **Utilisé par** : `app/layout.tsx` ; hooks utilisés par amis, chat, joueurs, profils.

## 3. Explication bloc par bloc

- Socket créé **une fois** (`useState` paresseux, `autoConnect: false`), connecté dans un effet et **déconnecté au démontage** (pas de fuite).
- `watchers` : chaque `usePresence` enregistre ses ids ; le provider envoie l'**union** au serveur (`presence:watch`), qui ne gère qu'une liste par connexion. Réenvoyée à chaque reconnexion.
- `presence` : état fusionné avec les réponses et les événements `presence`.
- `useRealtimeEvent` : abonnement/désabonnement propre, dernier handler gardé dans une ref.

## 4. Flux concret

Deux composants de la page affichent des joueurs différents → le serveur envoie la présence de tous, et seulement d'eux.

## 5. Points d'attention

- `key={userId}` dans le layout : changement de compte = nouveau socket.

## 6. Questions probables en évaluation

- **Comment le client reçoit-il les mises à jour ?** Ce provider et ses hooks.
- **Nettoyez-vous vos listeners ?** Oui, dans les fonctions de nettoyage des effets.
