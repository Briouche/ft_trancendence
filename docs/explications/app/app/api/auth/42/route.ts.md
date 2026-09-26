# `app/app/api/auth/42/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · départ de « Sign in with 42 »

## 1. Rôle

`GET /api/auth/42` : génère un `state` aléatoire, le range dans un cookie `ft_oauth_state` (HttpOnly, Secure, 5 min) et redirige vers la page d'autorisation de 42. Avec `?link=1` et une session, pose aussi `ft_oauth_link` : le retour liera 42 au compte connecté au lieu de connecter.

## 2. Dépendances

- **Importe** : `lib/oauth42.ts` (`buildAuthorizeUrl`), `lib/session.ts`.
- **Utilisé par** : bouton « Sign in with 42 » (`SignInForm`), « Link 42 account » (`ProfileInformation`) ; exporte `STATE_COOKIE` et `LINK_COOKIE` pour le callback.

## 3. Explication bloc par bloc

`crypto.randomUUID()` (imprévisible) → cookie → `NextResponse.redirect(buildAuthorizeUrl(state))`. `sameSite: lax` : le cookie doit revenir lors de la redirection **de haut niveau** depuis 42.

## 4. Flux concret

Voir le diagramme OAuth de `00_VUE_ENSEMBLE.md`.

## 5. Points d'attention

- Le `state` empêche un site tiers de terminer un flux OAuth dans le navigateur de la victime (*login CSRF*).

## 6. Questions probables en évaluation

- **À quoi sert le `state` ?** Protection CSRF : le retour n'est accepté que si son `state` égale le cookie.
