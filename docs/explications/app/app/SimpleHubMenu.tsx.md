# `app/app/SimpleHubMenu.tsx`

> Service : **app** · Client Component · ~45 lignes · menu texte du hub.

## 1. Rôle

Version texte du hub : titre, une ligne par destination (`MENU_ITEMS`), et le menu du compte.
Utilisée sans WebGL2 et sur mobile.

## 2. Dépendances

- **Importe** : `next/link`, `./menu.ts`, `./AccountMenu`.
- **Utilisé par** : `app/HubBackground.tsx`.

## 3. Explication bloc par bloc

Liste de `Link` stylés ; une entrée `available: false` est grisée et inerte (`aria-disabled`).
Tailles de police en `clamp()` pour s'adapter à l'écran.

## 4. Flux concret

Sur téléphone, `/` affiche ce menu ; « Game room » ouvre `/play`.

## 5. Points d'attention

- Même source de vérité que la salle 3D : `menu.ts`.

## 6. Questions probables en évaluation

- **Accessibilité sans 3D ?** Ce menu (liens HTML ordinaires, navigables au clavier).
