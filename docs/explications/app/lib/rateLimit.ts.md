# `app/lib/rateLimit.ts`

> Service : **app** · TypeScript (serveur) · ~85 lignes · limitation de débit.

## 1. Rôle

Compteurs **par fenêtre de temps** en mémoire, pour limiter : échecs de connexion, inscriptions,
demandes d'ami, messages de chat, changements d'avatar.

## 2. Dépendances

- **Importe** : `next/headers` (IP).
- **Utilisé par** : `lib/auth.ts`, routes amis, messages, avatar ; tests `tests/rateLimit.test.ts`.

## 3. Explication bloc par bloc

- `rateLimit(key, { max, windowMs })` : compte une tentative et dit si elle est autorisée.
- `isRateLimited(key, limit)` + `recordAttempt(key, limit)` : vérifier **sans** compter, et ne
  compter que ce qu'on veut (les échecs de connexion).
- `sweep` : supprime régulièrement les fenêtres expirées (la mémoire ne grossit pas indéfiniment).
- `clientIp()` : l'IP vue par nginx (`X-Real-IP`, écrasé par nginx ; on ne fait pas confiance à
  `X-Forwarded-For`, que le client peut préfixer).

## 4. Flux concret

11ᵉ mauvais mot de passe en 15 min sur un compte → « Too many attempts… ».

## 5. Points d'attention

- En mémoire : valable parce qu'il n'y a qu'un processus Next. Avec plusieurs instances, il
  faudrait stocker les compteurs dans Redis.

## 6. Questions probables en évaluation

- **Comment empêches-tu le spam du chat ?** 20 messages / 10 s par utilisateur.
