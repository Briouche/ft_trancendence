# `app/app/api/auth/42/callback/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · retour de 42

## 1. Rôle

`GET /api/auth/42/callback` : 42 y renvoie l'utilisateur avec `code` et `state` (ou `error` en cas de refus). Vérifie le `state`, échange le code, puis connecte (ou crée) le compte, ou le **lie** au compte connecté (mode liaison).

## 2. Dépendances

- **Importe** : `lib/oauth42.ts`, `lib/session.ts`, `config/routes.ts`, cookies de `../route`.

## 3. Explication bloc par bloc

1. Lit et **supprime** les cookies `state`/`link` (usage unique).
2. `?error=` (refus sur 42) → `?error=oauth_denied`.
3. `state` absent ou différent → `?error=oauth`.
4. Profil 42 récupéré ; mode liaison → `linkFortyTwoAccount` → `/profile?linked=1` ou `?error=oauth_42_taken` ; sinon `findOrCreateUserFromFortyTwo` → `createSession` → `/`.
5. Email déjà utilisé → `?error=oauth_email_taken` ; autre erreur → journalisée, `?error=oauth`.

## 4. Flux concret

Clic « Authorize » sur 42 → ce callback → cookie de session → hub.

## 5. Points d'attention

- Les redirections utilisent l'origine publique (`FT_REDIRECT_URI`), pas l'hôte interne du conteneur.

## 6. Questions probables en évaluation

- **Que se passe-t-il si l'utilisateur refuse ?** Retour sur l'accueil avec « Sign in with 42 was cancelled ».
