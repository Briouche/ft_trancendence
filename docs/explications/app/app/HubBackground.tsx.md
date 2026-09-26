# `app/app/HubBackground.tsx`

> Service : **app** · Client Component · ~80 lignes · le hub (accueil connecté).

## 1. Rôle

Affiche le hub sur `/` et le **cache** ailleurs (sans le démonter). Choisit entre la **salle 3D**
(`HubScene`) et le **menu texte** (`SimpleHubMenu`) : menu texte si WebGL2 n'est pas disponible
ou sur un écran de moins de 768 px. Recharge les statistiques du joueur à chaque retour sur `/`
et annonce les **succès** débloqués entre-temps.

## 2. Dépendances

- **Importe** : `next/navigation` (`usePathname`), `next/dynamic` (HubScene sans SSR),
  `components/library/SceneLoading`, `./SimpleHubMenu`, `./AccountMenu` (types),
  `components/ui/Toast`.
- **Utilisé par** : `app/layout.tsx`.

## 3. Explication bloc par bloc

- `supportsWebGL2()` : teste une fois la création d'un contexte `webgl2`, résultat mis en cache.
- `useSyncExternalStore` pour WebGL2 et pour la largeur d'écran (`matchMedia`) : valeurs du
  navigateur lues proprement (la version serveur renvoie `null`/`false`).
- Effet : si on est sur `/`, `fetch('/api/user/summary')` → statistiques + `newAchievements` →
  un toast par succès.

## 4. Flux concret

Fin de partie → clic « continuer » → retour sur `/` → résumé rechargé → « 🏆 Achievement unlocked:
First Blood (+1 pack) ».

## 5. Points d'attention

- `HubScene` est chargé dynamiquement sans rendu serveur (three.js a besoin du navigateur).

## 6. Questions probables en évaluation

- **Le site est-il utilisable sur mobile ?** Oui : sous 768 px, le hub devient un menu texte ; les
  pages de listes se réorganisent.
