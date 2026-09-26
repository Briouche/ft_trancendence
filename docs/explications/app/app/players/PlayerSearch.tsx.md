# `app/app/players/PlayerSearch.tsx`

> Service : **app** · Client Component · recherche avancée

## 1. Rôle

Formulaire (nom, filtre, tri, ordre, taille de page) + tableau (rang, joueur, présence, Elo, victoires PvP, inscription) + pagination. **L'état vit dans l'URL** (partageable, bouton retour).

## 2. Dépendances

- **Importe** : composants `ui/*`, `usePresence`, `config/routes.ts`, `lib/validation.ts` (`userSearchSchema`, tailles de page), type `UserSearchResult`.

## 3. Explication bloc par bloc

- `params` = `userSearchSchema.parse(URL)` ; `update(changes)` réécrit l'URL (retour à la page 1 sauf changement de page) ; `paramsRef` est mis à jour immédiatement pour que deux changements rapides ne s'écrasent pas.
- Saisie du nom **différée de 300 ms**.
- Chargement : `fetch('/api/users?…')` annulable (`AbortController`) ; `loading` = le résultat ne correspond pas encore à la requête courante.
- Rang affiché seulement dans l'ordre du classement (Elo décroissant, sans filtre).

## 4. Flux concret

Filtre « Online now » + tri « Name » → l'URL change, la page 1 des joueurs en ligne s'affiche.

## 5. Points d'attention

- Le tableau défile horizontalement sur mobile.

## 6. Questions probables en évaluation

- **La pagination est-elle côté serveur ?** Oui, voir `lib/userSearch.ts`.
