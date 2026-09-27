# Rapport final — finalisation de ft_transcendence

Branche : **`finalisation`** (partie de `review/audit-complet`, elle-même partie de `stef`).
56 commits au format Conventional Commits, sans réécriture d'historique. Décisions prises en
autonomie : [`docs/DECISIONS.md`](DECISIONS.md). Suivi : [`docs/PROGRESS.md`](PROGRESS.md).

## ⚠️ À faire par l'équipe avant l'évaluation

1. **Régénérer les secrets exposés dans l'historique Git** (visibles sur GitHub, branche `main`
   et les autres) :
   - le **secret de l'application OAuth 42** (`FT_CLIENT_SECRET`, présent dans `.env.example` des
     commits `81ace226`, `77cab6e7`, `e574f9c5`, `1ceb45ab`) → à régénérer sur l'intra ;
   - deux anciennes valeurs de **`JWT_SECRET`** dans ces mêmes commits → changer `JWT_SECRET`.
   L'historique n'a pas été réécrit (consigne) : seule la rotation protège réellement.
2. Mettre à jour `FT_REDIRECT_URI` en `https://localhost:8080/api/auth/42/callback` dans `.env`
   **et** dans l'application 42 (le site est maintenant en HTTPS ; l'ancienne adresse `http://`
   fonctionne encore grâce à la redirection, mais autant l'aligner).
3. Compléter les `TODO(team)` (liste plus bas).
4. Décider du sort de la modification non commitée de
   `app/prisma/seeds/data/tcg-collection.json` (carte « neighboringMinions »), laissée intacte.

## Statut des exigences obligatoires

Vérifié sur un **clone propre** (`git clone` → `cp .env.example .env` + identifiants 42 → `make`),
base vide : migrations et seed appliqués, site servi en HTTPS au premier lancement.

| Exigence | Statut | Preuve |
|---|---|---|
| HTTPS partout (dev et prod) | ✅ | dev : `https://localhost:8080` (HTTP → 497 redirigé) ; prod (`make prod`) : `https://localhost`, HTTP → 301 ; cookies `secure` + `httpOnly`, sockets en `wss` |
| Console Chrome propre | ✅ | parcours complet Playwright : 0 erreur/avertissement émis par l'application (le seul 401 relevé est la sonde du test sur la session révoquée) ; prod : idem |
| Privacy / Terms dans le pied de page de chaque page | ✅ | liens testés depuis le pied de page, contenu réécrit |
| Email + mot de passe | ✅ | inscription, connexion par email ou pseudo, argon2id, changement de mot de passe avec révocation des autres sessions |
| Validation zod front + back | ✅ | schémas partagés `app/lib/validation.ts` ; mot de passe faible refusé côté client et serveur |
| Secrets uniquement dans `.env` | ✅ (code) / ⚠️ (historique) | `.env` ignoré, `.env.example` commenté ; anciens secrets visibles dans l'historique → rotation (voir plus haut) |
| Responsive | ✅ (avec réserve) | pages de listes et hub adaptés ; pages « livre » mises à l'échelle (voir risques) |
| Multi-utilisateurs sans conflit | ✅ | deux navigateurs simultanés : amis, chat et présence en direct, partie PvP, reconnexion, forfait ; écritures concurrentes protégées (UPDATE conditionnels, transactions SERIALIZABLE) |
| Une seule commande | ✅ | `make` (dev) / `make prod` |

**Contrôles statiques** (dernier passage) : ESLint ×3 services ✅ · `tsc` app + game_engine ✅ ·
tests vitest **60/60** (37 app + 23 moteur) ✅ · `next build` ✅ · build game_engine ✅ ·
`npm audit` : 0 vulnérabilité ×3 · couverture de `docs/explications/` complète · 7 diagrammes
Mermaid valides.

**Parcours complet (2 sessions, 28 vérifications, toutes ✅)** : mot de passe faible refusé,
inscription ×2, connexion email / pseudo, changement de mot de passe (mauvais actuel refusé,
autre session révoquée), OAuth 42 (redirection avec `state`, `state` falsifié refusé, refus
utilisateur géré), avatar (upload puis retour au défaut), demande d'ami (inconnu → message clair,
reçue en direct, ami en ligne en direct), chat en direct, recherche, partie contre l'IA (l'IA joue),
PvP (déconnexion signalée, reconnexion avec reprise, forfait après 30 s : +2 paquets, Elo +16),
page des succès, profil public (historique, dos gagnés, Elo), pages légales.

## Statut des modules (19 points visés)

| # | Module | Pts | Statut |
|---|---|---|---|
| 1 | Framework front + back (Next.js) | 2 | ✅ |
| 2 | Temps réel (WebSockets) | 2 | ✅ jeu + chat/présence/amis, rooms ciblées |
| 3 | Interaction utilisateurs (chat, profil, amis) | 2 | ✅ |
| 4 | ORM (Prisma) | 1 | ✅ (2 upserts en masse en SQL taggé, justifiés) |
| 5 | Design system (≥ 10 composants) | 1 | ✅ 15 composants, `/design-system`, `docs/DESIGN_SYSTEM.md` |
| 6 | Recherche avancée | 1 | ✅ filtres, tri, pagination serveur (`/players`) |
| 7 | Gestion utilisateur standard | 2 | ✅ profil, avatar sécurisé + défaut, amis + statut en ligne, pages de profil |
| 8 | OAuth 2.0 (42) | 1 | ✅ flux, `state`, création, liaison depuis le profil, refus/erreurs — la connexion 42 complète nécessite de vrais identifiants 42 (non testable automatiquement) |
| 9 | Adversaire IA | 2 | ✅ MCTS + déterminisation, imprécision et temps de réflexion par difficulté, documentée |
| 10 | Jeu web complet | 2 | ✅ |
| 11 | Joueurs distants | 2 | ✅ serveur autoritaire, WebSocket authentifié, reconnexion 30 s, forfait |
| 12 | Gamification | 1 | ✅ **succès = dos de cartes à débloquer** (choix de l'équipe), classement Elo, paquets de récompense avec légendaire garantie, historique (tout en base, retour visuel, règles affichées sur `/achievements`) |

## Corrections importantes (sécurité et bugs)

- **Prise de contrôle de compte via OAuth** : un compte 42 était rattaché automatiquement au
  compte local de même email (non vérifié) → supprimé ; liaison explicite depuis le profil.
- **Decks non validés** : n'importe quelle carte en n'importe quelle quantité → validation
  serveur contre la collection + revérification au lancement de la partie.
- **Outils de triche en production** (paquets gratuits, toute la collection) → désactivés hors dev.
- **Comptes de test** aux mots de passe publics créés en production → seulement en dev.
- **Changement de mot de passe** sans l'actuel, sessions non révoquées → corrigé (`tokenVersion`).
- **Détournement de WebSocket** (CORS ouvert, pas de contrôle d'origine) → origine vérifiée sur
  les deux serveurs socket.
- **Serveur de chat cassé** (mauvais champ du JWT, jamais branché) → réécrit, authentification
  via l'app, présence Redis ciblée.
- **Double création de partie** (chaque coup appliqué deux fois) → verrou par joueur.
- **IA** : perspective UCB1 incohérente, coup mortel parfois ignoré → corrigé et testé.
- **Difficulté invalide** qui bloquait l'IA, messages socket mal formés → validation.
- **Conditions de course** : ouverture de paquet concurrente, demandes d'ami croisées, dos de
  carte accordés deux fois → requêtes conditionnelles / transactions SERIALIZABLE.
- **Limite de connexion** qui aurait bloqué tout un cluster 42 → seuls les échecs comptent.
- `npm audit` : 4 vulnérabilités hautes → 0 (overrides des dépendances du CLI Prisma).
- Console : warnings three.js, `next/image`, hydratation, textures 404, 4xx attendues → 0 message.

Bugs trouvés pendant la vérification finale (clone propre) et corrigés :

- **Reconnexion impossible** : le jeu Phaser était détruit puis recréé (avec envoi de « quit »)
  à chaque changement d'identité du routeur Next → le joueur qui revenait n'envoyait jamais
  « ready » dans la fenêtre de 30 s. Le routeur est maintenant lu via une ref.
- **Premier démarrage** : délai de transaction Prisma de 5 s dépassé à froid → 15 s (app et
  serveur de jeu).
- **Conteneur app** qui démarrait `next dev` même si les migrations ou le seed échouaient →
  arrêt immédiat (`&&`), l'erreur est visible.
- **Erreur console à l'inscription** (« negative time stamp ») → redirection faite par la server
  action.

## Ajouts

HTTPS en dev (`make`) comme en prod · connexion par email · validation zod partagée · amis
complets · chat privé temps réel · présence en ligne · avatars (upload sécurisé, défaut) · profils
publics avec historique · recherche/classement paginé côté serveur · succès sous forme de dos de
cartes (règles et progression sur `/achievements`) + récompenses affichées en fin de partie · liaison 42 · design system documenté et page vivante ·
hub en menu texte sur mobile · pied de page légal sur toutes les pages · pages légales réécrites ·
60 tests unitaires (vitest) · ESLint dans les 3 services · JSDoc sur les exports · documentation
complète (`docs/explications/` : 00/01/02 + 249 pages, une par fichier source).

## `TODO(team)` restants

| Où | Quoi |
|---|---|
| `README.md` | nom du jeu, rôles, gestion de projet, contributions individuelles, justification des modules, autres usages de l'IA, crédits des illustrations |
| `app/config/english.tsx` | adresse de contact des pages légales (`[CONTACT EMAIL]`) |
| Logins | le README garde `lecartuy` (liste de l'équipe) ; l'historique Git montre aussi `Lcartuyv` — à vérifier |

Aucun `TODO`/`FIXME` ne reste dans le code.

## Risques en évaluation et points à réviser en priorité

1. **Secrets** : faire la rotation avant l'évaluation (voir en haut) ; savoir expliquer que
   `.env` n'est pas versionné et que `.env.example` ne contient que des modèles.
2. **Certificat auto-signé** : prévenir l'évaluateur qu'il faut l'accepter dans Chrome.
3. **OAuth 42** : l'application 42 doit avoir exactement l'URI de redirection de `.env`.
4. **Pages « livre » sur mobile** : réduites (lisibles mais petites en portrait) ; les pages de
   listes et le hub sont vraiment responsives. Préparer la démonstration en paysage ou sur tablette.
5. **Présence** : un joueur qui ferme l'onglet en pleine partie reste « In a match » jusqu'au
   forfait (30 s) — c'est voulu (fenêtre de reconnexion).
6. **Reconnexion sur machine lente** : le joueur qui revient doit recharger la scène du jeu en
   moins de 30 s. En test automatisé avec 4 navigateurs en rendu logiciel simultanés, ce n'était
   pas le cas (2 s en conditions normales) : faire la démonstration sur une machine non chargée.
7. **Migration des succès** : la migration `20260927120000_card_back_achievements` supprime la
   table `UserAchievement` et la colonne `packsOpened` — sans impact (les dos déjà débloqués sont
   conservés), mais savoir l'expliquer.
8. À réviser : `docs/explications/00_VUE_ENSEMBLE.md` (architecture), `01_MODULES.md`
   (démonstrations), `02_MODIFICATIONS_EVAL.md` (modifications demandées en live), l'IA
   (`game_engine/srcs/ai/*.md`) et la reconnexion (`socket/gameSession.ts.md`).
