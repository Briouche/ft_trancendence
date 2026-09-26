# `app/lib/oauth42.ts`

> Service : **app** · TypeScript (serveur) · ~120 lignes · « Sign in with 42 ».

## 1. Rôle

Le côté serveur du flux OAuth 2.0 avec l'intra 42 : URL d'autorisation, échange du code contre un
jeton, lecture du profil, création du compte ou liaison à un compte existant.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/validation.ts` (`USERNAME_MAX_LENGTH`).
- **Utilisé par** : `app/api/auth/42/route.ts`, `app/api/auth/42/callback/route.ts`.

## 3. Explication bloc par bloc

- `getSiteOrigin()` : origine publique du site, tirée de `FT_REDIRECT_URI`.
- `buildAuthorizeUrl(state)` : `https://api.intra.42.fr/oauth/authorize?client_id…&state=…`
  (portée `public`).
- `exchangeCodeForToken(code)` : `POST /oauth/token` avec le **secret client** (jamais exposé au
  navigateur).
- `fetchProfile(token)` : `GET /v2/me` → `{ id, login, email }`.
- `findOrCreateUserFromFortyTwo(profile)` :
  1. compte déjà lié à ce `fortyTwoId` → on le renvoie ;
  2. email déjà utilisé par un compte local → **erreur `EmailTakenError`** (pas de liaison
     automatique) ;
  3. sinon création avec un nom unique (`login`, puis `login_1`, `login_2`…).
- `linkFortyTwoAccount(userId, fortyTwoId)` : liaison **explicite**, depuis le profil, en étant
  connecté ; refusée si ce compte 42 appartient à quelqu'un d'autre ou si l'utilisateur est déjà
  lié à un autre compte 42.

## 4. Flux concret

Voir le diagramme OAuth de `00_VUE_ENSEMBLE.md`.

## 5. Points d'attention

- **Pourquoi pas de liaison par email ?** L'inscription ne vérifie pas l'email : quelqu'un
  pourrait créer un compte avec l'email 42 d'une victime, et récupérer son compte au premier
  « Sign in with 42 » de celle-ci.

## 6. Questions probables en évaluation

- **Comment gères-tu un utilisateur 42 qui a déjà un compte email ?** Il se connecte avec son mot
  de passe puis lie 42 depuis son profil.
