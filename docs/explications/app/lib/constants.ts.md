# `app/lib/constants.ts`

> Service : **app** · TypeScript (serveur) · ~15 lignes · paramètres de hachage.

## 1. Rôle

- `ARGON2_OPTIONS` : paramètres d'argon2id (19 Mio de mémoire, 2 itérations, 1 fil) = minimum
  recommandé par l'OWASP.
- `DUMMY_HASH` : un hash argon2 factice vérifié quand le compte n'existe pas, pour que la
  connexion prenne le même temps dans tous les cas.

## 2. Dépendances

- **Utilisé par** : `lib/auth.ts`, `lib/updateUserProfile.ts`.

## 3. Explication bloc par bloc

Deux constantes ; `import "server-only"` empêche leur inclusion dans le code du navigateur.

## 4. Flux concret

`hash(motDePasse, ARGON2_OPTIONS)` à l'inscription.

## 5. Points d'attention

- Augmenter `memoryCost`/`timeCost` renforce contre la force brute mais ralentit chaque connexion.

## 6. Questions probables en évaluation

- **Pourquoi argon2id plutôt que bcrypt ?** Recommandé par l'OWASP, résistant aux attaques GPU
  (coûteux en mémoire). Le sel est généré et stocké dans le hash.
