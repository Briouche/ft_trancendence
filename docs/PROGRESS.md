# Avancement de la finalisation

> Reprise après interruption : relire ce fichier et `docs/DECISIONS.md`, puis reprendre à la
> première case non cochée de « Plan de travail ». Branche : `finalisation`.

## Cartographie (étape 1)

**Stack** : Next.js 16 (App Router, React 19, Tailwind 4, Prisma 7 + adaptateur pg, Phaser 3,
three.js) · serveur de jeu Node/TypeScript + socket.io (`game_engine`) · serveur chat/présence
Node + socket.io + Redis (`socket-server`) · PostgreSQL 16 · Redis 7 · nginx (TLS).

**Points d'entrée** : `app/app/layout.tsx` (UI), `app/app/api/**/route.ts` (HTTP),
`app/lib/*.ts` avec `"use server"` (server actions), `game_engine/srcs/index.ts` (WebSocket jeu,
`/socket.io/`), `socket-server/index.js` (WebSocket chat, `/chat-socket.io/`),
`proxy/*.conf` (routage nginx), `docker-compose*.yml` + `Makefile`.

**Variables d'environnement** : `JWT_SECRET`, `DOMAIN_NAME`, `POSTGRES_USER/PASSWORD/DB`,
`FT_CLIENT_ID/SECRET/REDIRECT_URI` (voir `.env.example`).

## État des lieux initial (avant finalisation)

### Partie obligatoire

| Exigence | État initial | Notes |
|---|---|---|
| Frontend + backend + BDD | ✅ | Next.js + game_engine + PostgreSQL |
| Une seule commande | ✅ | `make` |
| Chrome récent | ⚠️ | à vérifier |
| Console sans warning/erreur | ⚠️ | à vérifier page par page |
| Privacy Policy / Terms | ⚠️ | pages présentes, footer seulement sur la page de connexion, contenu partiellement inexact (chat, photo 42) |
| Multi-utilisateurs sans race condition | ⚠️ | ouverture de paquet concurrente peut passer sous 0 |
| Responsive | ⚠️ | à vérifier |
| Solution de style cohérente | ✅ | Tailwind 4 + tokens `@theme` |
| Secrets uniquement dans `.env` | ⚠️ | corrigé dans le code ; secrets présents dans l'historique Git (rotation nécessaire) |
| Schéma BDD clair | ✅ | |
| Inscription/connexion email + mot de passe | ⚠️ | connexion par nom d'utilisateur uniquement |
| Validation front ET back par schémas | ⚠️ | validation manuelle, incomplète, pas de schéma |
| HTTPS partout (wss) | ⚠️ | HTTPS seulement en mode prod ; `make` lance du HTTP |

### Modules

| # | Module | Pts | État initial | Manques |
|---|---|---|---|---|
| 1 | Framework front + back (Next.js) | 2 | ✅ | |
| 2 | Temps réel WebSockets | 2 | ⚠️ | jeu OK ; chat/présence cassés et non branchés |
| 3 | Interaction utilisateurs (chat, profil, amis) | 2 | ❌ | pas de chat, pas de profil public, amis en lecture seule |
| 4 | ORM Prisma | 1 | ✅ | 2 requêtes SQL brutes justifiées (upsert en masse) |
| 5 | Design system | 1 | ⚠️ | composants présents, non documentés |
| 6 | Recherche avancée | 1 | ❌ | |
| 7 | Gestion utilisateur standard | 2 | ⚠️ | pas d'upload d'avatar, pas de statut en ligne réel, pas de profil public |
| 8 | OAuth 42 | 1 | ✅ | liaison de compte à ajouter (depuis le profil) |
| 9 | Adversaire IA | 2 | ✅ | documentation à écrire |
| 10 | Jeu web complet | 2 | ✅ | |
| 11 | Joueurs distants | 2 | ✅ | reconnexion + fenêtre de grâce présentes |
| 12 | Gamification | 1 | ⚠️ | Elo + dos de cartes + paquets ; pas de page succès/classement |

## Plan de travail

- [x] 0. Branche `finalisation`, PROGRESS.md, DECISIONS.md
- [x] 1. Cartographie
- [x] 2a. HTTPS par défaut (`make`), cookies `secure`, wss
- [x] 2b. Connexion par email, validation zod front + back
- [x] 2c. Race conditions (paquets : UPDATE conditionnel ; amis : transaction SERIALIZABLE ; decks : transaction ; succès/dos de cartes : insert-if-absent)
- [ ] 2d. Footer légal sur toutes les pages, contenu Privacy/Terms exact
- [x] 3a. Amis : envoyer / accepter / refuser / retirer (API + UI)
- [x] 3b. Présence en ligne + chat (socket-server réparé, modèle Message, UI)
- [x] 3c. Profil public `/users/[username]` + avatar (upload sécurisé, avatar par défaut)
- [x] 3d. Recherche avancée `/players` (filtres, tri, pagination serveur) = classement
- [x] 3e. Gamification : succès persistés, page `/achievements`, récompenses affichées en fin de partie
- [x] 3f. OAuth : liaison depuis le profil, gestion du refus
- [ ] 3g. Design system documenté + page de démonstration
- [ ] 4a. Sécurité : rate limiting auth, en-têtes, CORS strict socket-server, `npm audit`
- [ ] 4b. Lint propre (app + game_engine), code mort, console.log
- [x] 4c. Tests vitest (auth/validation, moteur, IA, amis, gamification)
- [ ] 4d. Console Chrome propre + responsive (vérif Playwright)
- [ ] 5. Revue des commentaires (anglais, JSDoc sur les exports)
- [ ] 6. `docs/explications/` fichier par fichier + 00/01/02
- [ ] 7. README.md
- [ ] 8. Vérification finale (clone propre, parcours complet, deux sessions)
- [ ] 9. `docs/RAPPORT_FINAL.md`

## Journal

- Correctifs de sécurité déjà présents (branche `review/audit-complet`) : validation des decks,
  outils de test désactivés en prod, comptes de test non créés en prod, OAuth sans liaison par
  email, changement de mot de passe sécurisé, messages socket validés, origine WebSocket vérifiée.
- HTTPS en dev comme en prod (proxy TLS sur 8080, redirection HTTP→HTTPS, en-têtes de sécurité).
- Connexion par email ou nom d'utilisateur, schémas zod partagés, rate limiting auth.
- Chat privé temps réel, système d'amis complet, présence en ligne (Redis), profils publics,
  avatars sécurisés, recherche de joueurs/classement, succès + badges + historique des parties.
- IA : correction de la perspective MCTS (UCB1) et du coup mortel manqué ; imprécision humaine.
- Tests : 36 (app) + 23 (game_engine), tous verts. E2E Playwright (scratchpad) : amis, chat,
  présence, XSS, toasts, recherche, avatar (y compris faux PNG refusé) OK, console sans erreur.
- À noter : three.js épinglé en 0.182 (warning THREE.Clock en 0.183+ via @react-three/fiber).
