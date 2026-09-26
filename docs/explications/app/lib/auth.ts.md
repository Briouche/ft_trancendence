# `app/lib/auth.ts`

> Service : **app** · Server Actions · ~110 lignes · connexion, inscription, déconnexion.

## 1. Rôle

Trois *server actions* appelées directement par les formulaires : `checkCredentials` (connexion
par **nom d'utilisateur ou email** + mot de passe), `registerUser` (inscription), `logoutUser`.

## 2. Dépendances

- **Importe** : `@node-rs/argon2` (`hash`, `verify`), `@prisma/client`, `lib/prisma.ts`,
  `lib/session.ts`, `lib/constants.ts` (paramètres argon2, hash factice), `lib/validation.ts`
  (schémas zod), `lib/rateLimit.ts`, `config/routes.ts`.
- **Utilisé par** : `components/SignInForm.tsx`, `components/RegisterForm.tsx`,
  `components/elements/LogoutButton.tsx`, `app/AccountMenu.tsx`.

## 3. Explication bloc par bloc

### `checkCredentials(formData)`

1. `loginSchema` (zod) : identifiant et mot de passe présents et de taille raisonnable.
2. Limite de débit : **échecs** comptés par compte (10 / 15 min) et par IP (50 / 15 min) ; un
   succès ne compte jamais (tout un cluster 42 partage une IP).
3. Recherche par email si l'identifiant contient `@`, sinon par nom.
4. Compte absent ou sans mot de passe (compte 42 seul) : on vérifie quand même un **hash factice**
   (`DUMMY_HASH`) pour que la réponse prenne le même temps (on ne peut pas deviner quels comptes
   existent en chronométrant).
5. `verify(hash, motDePasse)` (argon2id) ; succès → `createSession`.

Toujours le même message d'erreur : « Invalid username or password. »

### `registerUser(formData)`

`registerSchema` (nom 3-30 caractères `[a-zA-Z0-9_]`, email valide, mot de passe 8-128 avec
minuscule, majuscule et chiffre, confirmation identique) → limite de débit par IP → `hash`
argon2id → `user.create`. Un doublon (code Prisma P2002) donne un message volontairement vague
(ne pas révéler quels emails ont un compte). Puis connexion automatique.

### `logoutUser()`

`deleteSession()` puis redirection vers l'accueil.

## 4. Flux concret

Formulaire « Sign In » → validation zod côté client (retour immédiat) → `checkCredentials` sur le
serveur (même schéma) → cookie posé → la page d'accueil affiche le hub.

## 5. Points d'attention

- `"use server"` : ces fonctions tournent **sur le serveur** ; Next.js vérifie l'origine des
  appels (protection CSRF des server actions).
- Les mots de passe ne sont jamais journalisés ni renvoyés.

## 6. Questions probables en évaluation

- **Comment sont stockés les mots de passe ?** Hash argon2id salé (paramètres OWASP dans
  `constants.ts`).
- **Et la force brute ?** Limite d'échecs par compte et par IP, et argon2 est lent par conception.
- **Connexion par email ?** Oui, l'identifiant accepte un email ou un nom d'utilisateur.
