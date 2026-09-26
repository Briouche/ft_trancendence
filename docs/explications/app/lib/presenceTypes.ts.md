# `app/lib/presenceTypes.ts`

> Service : **app** · TypeScript (client et serveur) · ~10 lignes.

## 1. Rôle

Le type `Presence` (`online` | `in_game` | `offline`) et ses libellés affichés, importables
depuis les composants du navigateur (`lib/presence.ts` est réservé au serveur).

## 2. Dépendances

- **Utilisé par** : `components/ui/PresenceDot.tsx`, `lib/presence.ts`, `lib/chatEvents.ts`,
  `components/realtime/RealtimeProvider.tsx`, pages amis/profil.

## 3. Explication bloc par bloc

`PRESENCE_LABEL` : « Online », « In a match », « Offline ».

## 4. Flux concret

`<PresenceDot presence="in_game" showLabel />` → pastille orange + « In a match ».

## 5. Points d'attention

- Ajouter un statut = l'ajouter ici, dans les couleurs de `PresenceDot` et dans le calcul serveur.

## 6. Questions probables en évaluation

- Aucune spécifique.
