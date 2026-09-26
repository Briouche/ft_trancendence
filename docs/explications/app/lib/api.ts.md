# `app/lib/api.ts`

> Service : **app** · TypeScript (serveur) · ~45 lignes · aides communes aux routes API.

## 1. Rôle

Uniformise les routes `app/api/**` : même format d'erreur (`{ error }` + statut HTTP), même
vérification de session, même validation du corps JSON.

## 2. Dépendances

- **Importe** : `next/server`, `zod` (type), `lib/session.ts`, `lib/validation.ts`.
- **Utilisé par** : routes amis, messages, users, achievements, avatar, summary, packs/open.

## 3. Explication bloc par bloc

- `jsonError(status, message)`.
- `requireSession()` : la session, **ou** une réponse 401 prête à renvoyer :

```ts
const auth = await requireSession();
if (auth instanceof NextResponse) return auth;   // pas connecté → 401
auth.userId                                       // sinon, l'utilisateur
```

- `parseJsonBody(request, schema)` : corps JSON validé, ou 400 avec le premier message de zod
  (un corps illisible est une erreur de l'appelant, pas du serveur).

## 4. Flux concret

`POST /api/friends/requests` : `requireSession` → `parseJsonBody(req, { username })` → logique.

## 5. Points d'attention

- Quelques routes plus anciennes (decks) font encore la vérification à la main : même effet.

## 6. Questions probables en évaluation

- **Comment protèges-tu chaque route API ?** `requireSession()` en première ligne.
