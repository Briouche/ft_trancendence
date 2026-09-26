# `app/lib/session.ts`

> Service : **app** · TypeScript (serveur uniquement) · ~125 lignes · les sessions.

## 1. Rôle

Crée, lit et supprime la **session** d'un utilisateur : un JWT signé (HS256) stocké dans le
cookie `session`. Fournit `getSession()` (qui est connecté ?) et `getCurrentUser()` (ses infos).

## 2. Dépendances

- **Importe** : `server-only` (erreur si importé côté navigateur), `react` (`cache`), `jose`
  (JWT), `next/headers` (`cookies`), `lib/prisma.ts`.
- **Utilisé par** : presque toutes les pages et routes API (via `lib/api.ts` pour les routes),
  `lib/auth.ts`, `lib/updateUserProfile.ts`, `app/api/auth/**`, `app/layout.tsx`,
  `components/Header.tsx`. Le serveur de jeu vérifie les mêmes cookies
  (`game_engine/srcs/auth/session.ts`).

## 3. Explication bloc par bloc

- `SESSION_DURATION_MS` (7 jours) : durée du cookie **et** du JWT.
- `getEncodedKey()` : `JWT_SECRET` (erreur explicite s'il manque).
- `encrypt(payload, expiresAt)` : signe `{ userId, username, tokenVersion, expiresAt }`.
- `decrypt(token)` : vérifie la signature (algorithme **imposé** : HS256) et l'expiration, puis la
  forme du contenu ; `null` sinon.
- `createSession(userId, username, tokenVersion)` :

```ts
cookieStore.set("session", token, {
    httpOnly: true,    // inaccessible au JavaScript de la page (vol par XSS impossible)
    secure: true,      // envoyé seulement en HTTPS
    sameSite: "lax",   // pas envoyé par les requêtes POST venant d'autres sites (CSRF)
    expires: expiresAt, path: "/",
});
```

- `deleteSession()` : supprime le cookie (déconnexion).
- `getSession()` (mise en cache pour la durée d'une requête) : décode le cookie puis **relit
  `tokenVersion` en base** ; s'il a changé (changement de mot de passe), la session est refusée.
- `getCurrentUser()` : infos du compte connecté (jamais le hash du mot de passe : seulement
  `hasPassword` et `linkedTo42`).

## 4. Flux concret

Connexion → `createSession` pose le cookie → chaque requête suivante → `getSession()` le vérifie
(une requête SQL) → la page sait qui est connecté.

## 5. Points d'attention

- `cache()` évite de refaire la vérification plusieurs fois dans le rendu d'une même page.
- Changer `SESSION_DURATION_MS` suffit à changer la durée de session.

## 6. Questions probables en évaluation

- **Comment sont gérées les sessions ?** JWT signé dans un cookie HttpOnly/Secure/SameSite=Lax,
  vérifié à chaque requête, révocable par `tokenVersion`.
- **Comment déconnecter partout ?** Incrémenter `User.tokenVersion` (fait au changement de mot
  de passe) : tous les anciens JWT deviennent invalides.
- **Pourquoi pas le localStorage ?** Accessible au JavaScript ; un cookie HttpOnly ne l'est pas.
