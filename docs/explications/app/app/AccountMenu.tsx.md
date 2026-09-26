# `app/app/AccountMenu.tsx`

> Service : **app** · Client Component · ~130 lignes · menus du compte et des victoires.

## 1. Rôle

Deux boutons en haut à droite du hub :
- **compte** : pseudo, cartes, dos débloqués, Elo, liens (profil, amis, chat, joueurs, succès),
  pages légales, design system, déconnexion ;
- **trophée** : victoires par mode, lien vers les succès.

## 2. Dépendances

- **Importe** : `next/link`, `lib/auth.ts` (`logoutUser`), `components/notebook/NotebookUI`
  (`AssetButton`), `config/routes.ts`, `config/english.tsx`.
- **Utilisé par** : `app/HubScene.tsx`, `app/SimpleHubMenu.tsx`.

## 3. Explication bloc par bloc

`openPanel` ('account' | 'trophy' | null) ; `SOCIAL_LINKS` (liste des liens). Les boutons ont un
nom accessible (`ariaLabel`) et `aria-expanded`.

## 4. Flux concret

Clic sur l'icône du compte → panneau → « Players & leaderboard » → `/players`.

## 5. Points d'attention

- Le panneau se ferme en quittant la souris ; au clavier, re-cliquer le bouton le ferme.

## 6. Questions probables en évaluation

- **Comment accède-t-on au chat, aux amis, au classement ?** Par ce menu (et depuis les profils).
