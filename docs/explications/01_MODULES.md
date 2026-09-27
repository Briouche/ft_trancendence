# Modules du sujet : où, comment, et comment le démontrer

**Total visé : 19 points** = 7 modules majeurs × 2 (14) + 5 modules mineurs × 1 (5).

Préparation commune à toutes les démonstrations :

1. `cp .env.example .env`, remplir `JWT_SECRET` (`openssl rand -base64 32`), `POSTGRES_PASSWORD`,
   et les identifiants 42 ; `make`.
2. Ouvrir **https://localhost:8080** (accepter le certificat auto-signé).
3. En dev, trois comptes de test existent : `alexvanguard` / `test1`, `elenaspellweaver` / `test2`,
   `kaicyberblade` / `test3` (jamais créés en production).
4. Pour les démos à deux joueurs : deux navigateurs (ou une fenêtre privée), un compte chacun.
5. Les outils de test de `/packs` (dev uniquement) donnent un paquet ou toute la collection, pour
   construire un deck rapidement.

---

## 1. Majeur — Framework frontend + backend (2 pts)

**Où** : Next.js 16 (App Router) pour le front **et** le back de l'application : pages React
(`app/app/**/page.tsx`), composants serveur/client, routes API (`app/app/api/**/route.ts`),
*server actions* (`app/lib/auth.ts`, `app/lib/updateUserProfile.ts`), middleware de données
(`app/lib/session.ts`).

**Sous-exigences** :
- *Utilisation idiomatique* : routage par fichiers (`app/app/users/[username]/page.tsx`), Server
  Components qui lisent la base directement (`app/app/profile/page.tsx`), Client Components pour
  l'interactif (`'use client'`), `generateMetadata`, `redirect`/`notFound`, `unstable_cache`
  (`app/app/api/cards/route.ts`), `revalidatePath`, `next/dynamic` sans SSR pour Phaser/three.js.

**Démo** : montrer l'arborescence `app/app/` (une URL = un dossier), un Server Component qui fait
une requête Prisma (`app/app/profile/page.tsx`), une route API (`app/app/api/friends/route.ts`)
et une server action (`app/lib/auth.ts` → formulaire de connexion).

---

## 2. Majeur — Temps réel via WebSockets (2 pts)

**Où** :
- Jeu : `game_engine/srcs/socket/serverSocket.ts`, `gameSession.ts` ↔ `app/game/EventManager.ts`.
- Chat / présence / amis : `socket-server/index.js` ↔ `app/components/realtime/RealtimeProvider.tsx`,
  poussées serveur `app/lib/realtime.ts` (émetteur Redis), `game_engine/srcs/presence.ts`.

**Sous-exigences** :
- *Propagation à tous les clients concernés* : un message va aux rooms `user:<id>` des **deux**
  participants (tous leurs onglets) ; une partie envoie à chaque joueur sa propre vue.
- *Connexions / déconnexions propres* : compteur de connexions par utilisateur dans Redis
  (plusieurs onglets = en ligne jusqu'au dernier) ; en jeu, fenêtre de grâce de 30 s.
- *Broadcast efficace* : pas de diffusion globale ; la présence n'est envoyée qu'aux clients qui
  affichent cet utilisateur (`presence:watch` → room `presence:<id>`).

**Démo** : deux navigateurs sur `/friends`. Envoyer une demande d'ami depuis A : elle apparaît
**sans recharger** chez B. B l'accepte : A voit l'ami apparaître avec « Online ». Fermer B : A voit
« Offline ». Ouvrir le chat : les messages arrivent instantanément.

---

## 3. Majeur — Interaction entre utilisateurs (2 pts)

**Où** :
- Chat : `app/app/chat/**`, `app/app/api/messages/[userId]/route.ts`, `app/lib/messages.ts`.
- Profils : `app/app/users/[username]/**`, `app/lib/profile.ts`.
- Amis : `app/app/friends/**`, `app/app/api/friends/**`, `app/lib/friends.ts`.

**Sous-exigences** :
- *Chat basique (envoi/réception)* : conversation privée entre amis, historique paginé, temps réel,
  notification (toast) quand on est sur une autre page.
- *Voir les infos d'un utilisateur* : `/users/<nom>` (avatar, présence, Elo, stats, dos de cartes gagnés, 10
  dernières parties) ; accessible depuis toute liste (clic sur un nom).
- *Amis : ajouter, retirer, voir la liste* : `/friends` (envoyer, accepter, refuser, annuler,
  retirer), boutons aussi sur les profils.

**Démo** : A ajoute B depuis `/players` → profil de B → « Add friend » ; B accepte dans `/friends` ;
A clique « Chat » et écrit ; B reçoit le message en direct ; A retire B de ses amis.

---

## 4. Mineur — ORM Prisma (1 pt)

**Où** : `app/prisma/schema.prisma` (schéma unique, partagé avec `game_engine` au build),
`app/prisma/migrations/` (8 migrations versionnées), `app/lib/prisma.ts` et
`game_engine/srcs/db.ts` (clients), seed `app/prisma/seed.ts`.

**Sous-exigences** :
- *Tout l'accès aux données passe par Prisma* : oui ; `socket-server` n'accède pas à la base.
- *Migrations propres* : `prisma migrate deploy` au démarrage du conteneur `app`.
- *Pas de SQL brut non justifié* : 2 requêtes `$executeRaw` **taggées** (donc paramétrées), pour un
  `INSERT … ON CONFLICT DO UPDATE` en masse (`app/lib/packs.ts`, `app/app/api/collection/unlock-all/route.ts`) :
  Prisma n'a pas d'« upsert en masse », et une boucle d'upserts ferait N allers-retours.

**Démo** : ouvrir `schema.prisma`, montrer une relation (Friendship ↔ User), une migration, puis
une requête typée (`app/lib/friends.ts` → `listFriends`).

---

## 5. Mineur — Design system maison (1 pt)

**Où** : tokens dans `app/app/globals.css` (`@theme`), composants dans `app/components/ui/` et
`app/components/notebook/NotebookUI.tsx`, documentation `docs/DESIGN_SYSTEM.md`, page vivante
**`/design-system`**.

**Sous-exigences** :
- *Palette, typographie, icônes* : section « Colors », « Typography », « Icons » de la page.
- *Au moins 10 composants réutilisables, documentés et réutilisés* : 16 listés dans
  `docs/DESIGN_SYSTEM.md` avec les pages qui les utilisent (ex. `Panel`, `PageShell`, `Avatar`,
  `PresenceDot` servent sur 6 pages).

**Démo** : ouvrir `/design-system` (lien « Design system » du menu compte), puis montrer le même
composant réutilisé sur `/friends` et `/players`.

---

## 6. Mineur — Recherche avancée (1 pt)

**Où** : `app/app/players/PlayerSearch.tsx`, `app/app/api/users/route.ts`, `app/lib/userSearch.ts`,
schéma `userSearchSchema` dans `app/lib/validation.ts`.

**Sous-exigences** :
- *Filtres* : nom (contient), « Online now », « My friends ».
- *Tri* : Elo, victoires PvP, nom, date d'inscription ; ordre croissant/décroissant.
- *Pagination côté serveur* : `skip`/`take` dans la requête Prisma + `count` ; 10/20/50 par page.

**Démo** : `/players` ; taper un nom (recherche après 300 ms), changer le tri, le filtre, la taille
de page ; montrer l'URL qui change (état partageable) et l'onglet Réseau (`/api/users?…`).

---

## 7. Majeur — Gestion utilisateur standard (2 pts)

**Où** : `app/app/profile/**` (profil, formulaire, `AvatarUploader.tsx`), `app/lib/updateUserProfile.ts`,
`app/app/api/user/avatar/route.ts`, `app/app/api/avatars/[file]/route.ts`, `app/lib/avatarStorage.ts`,
avatar par défaut `app/public/avatars/default.svg`, statut en ligne `app/lib/presence.ts`.

**Sous-exigences** :
- *Modifier son profil* : nom, email, mot de passe (l'actuel est demandé), validés par zod.
- *Upload d'avatar avec avatar par défaut* : bouton « Change avatar » / « Use default ».
- *Upload sécurisé* : type vérifié côté client (MIME) **et** serveur (signature binaire : PNG, JPEG,
  WebP), 2 Mo max des deux côtés, nom de fichier généré (`<id>-<uuid>.<ext>`), stockage hors de la
  racine web, servi avec `Content-Type` fixé, `nosniff` et CSP `sandbox` → aucune exécution possible.
- *Amis avec statut en ligne visible* : pastille + texte sur `/friends`, `/players`, profils, chat.
- *Page de profil* : `/profile` (le sien) et `/users/<nom>` (public).

**Démo** : changer d'avatar ; tenter d'uploader un `.txt` renommé en `.png` (refusé) ; revenir à
l'avatar par défaut ; montrer la présence d'un ami qui se connecte / se déconnecte.

---

## 8. Mineur — OAuth 2.0 avec l'intra 42 (1 pt)

**Où** : `app/app/api/auth/42/route.ts` (départ), `app/app/api/auth/42/callback/route.ts` (retour),
`app/lib/oauth42.ts` (échange du code, profil, création/liaison).

**Sous-exigences** :
- *Flux complet* : autorisation → code → jeton → `/v2/me` → session.
- *Gestion du `state`* : UUID aléatoire en cookie `HttpOnly` 5 min, comparé au retour (anti-CSRF).
- *Liaison ou création de compte* : création au premier « Sign in with 42 » (nom unique généré),
  liaison d'un compte existant depuis `/profile` (« Link 42 account »), jamais automatiquement par
  email (sinon prise de contrôle possible).
- *Erreurs et refus* : « Cancel » sur la page 42 → message « cancelled » ; `state` invalide, email
  déjà utilisé, compte 42 déjà lié → message explicite.

**Démo** : « Sign in with 42 » depuis la page de connexion ; puis, avec un compte email, lier 42
depuis le profil ; refuser l'autorisation une fois pour montrer le message.

---

## 9. Majeur — Adversaire IA (2 pts)

**Où** : `game_engine/srcs/ai/policy.ts` (choix du coup, imprécision, temps de réflexion),
`ai/mcts.ts` (recherche), `ai/tree.ts` (UCB1, expansion, simulation, rétropropagation),
`ai/determinize.ts` (main adverse cachée), `ai/types.ts` (difficultés),
`socket/gameSession.ts` (`runAiTurnLoop`), decks de l'IA `cardImport/aiDecks.ts`.

**Fonctionnement (à savoir expliquer)** :
1. L'IA ne voit pas la main du joueur : elle en **imagine** plusieurs (« mondes ») en tirant au
   hasard parmi les cartes qu'il pourrait avoir (*déterminisation*).
2. Pour chaque monde, une **recherche arborescente Monte-Carlo** (MCTS) : on descend dans l'arbre
   des coups avec la formule UCB1 (équilibre entre les coups prometteurs et ceux peu essayés), on
   ajoute un coup, on **simule** la suite de la partie au hasard (sans jouer les cartes inutiles),
   et on remonte le résultat (victoire = 1, un peu moins si elle arrive tard).
3. On fait la moyenne des taux de victoire de chaque coup sur tous les mondes ; le meilleur est
   joué (égalité → le plus exploré).

**Sous-exigences** :
- *Joue au jeu, peut gagner* : mêmes règles et mêmes coups légaux que les humains
  (`GameEngine.getLegalActions`) ; en difficile, 2000 simulations × 8 mondes.
- *Comportement humain* : temps de réflexion variable avant chaque coup (0,7 à 2,4 s selon la
  difficulté), **erreurs volontaires** (25 % en facile, 10 % en moyen : un coup sensé au hasard au
  lieu du meilleur), anticipation imparfaite (main adverse inconnue, simulations limitées).
- *Options de personnalisation* : l'IA a son propre dos de carte (aléatoire) et 3 decks.
- *Expliqué dans la doc* : ce paragraphe + `game_engine/srcs/ai/*.md`.

**Démo** : `/play` → Solo → Easy puis Hard ; montrer les temps de réflexion, une erreur en facile,
et que le difficile trouve un coup gagnant. Tests : `cd game_engine && npm test` (`tests/ai.test.ts`).

---

## 10. Majeur — Jeu web complet (2 pts)

**Où** : règles `game_engine/srcs/gameEngine.ts` (+ `card.ts`, `effect.ts`, `target.ts`,
`legendary.ts`, `player.ts`), client Phaser `app/game/**`, règles affichées `/manual`.

**Sous-exigences** :
- *Parties en direct entre utilisateurs* : mode Multiplayer (file d'attente, appariement).
- *Règles claires* : page « Tuto » (`/manual`) ; mana 1→7, main de 10, plateau de 6, fatigue.
- *Victoire / défaite* : héros à 0 PV, ou forfait ; écran de fin avec récompenses.

**Démo** : deux navigateurs, Play → Multiplayer, jouer quelques tours, gagner (ou abandonner).

---

## 11. Majeur — Joueurs distants (2 pts)

**Où** : `game_engine/srcs/socket/serverSocket.ts`, `gameSession.ts`, `auth/session.ts` ;
client `app/game/EventManager.ts`, `scenes/GameScene.ts`, `scenes/gameProcessors/StateSyncController.ts`.

**Sous-exigences** :
- *Deux machines en temps réel* : socket.io à travers nginx (WSS).
- *Moteur autoritaire côté serveur* : le client n'envoie que des intentions ; le serveur vérifie
  tour, main, mana, cibles légales, forme des messages (`validateMessage.ts`), puis diffuse.
- *Authentification du WebSocket de jeu* : cookie de session vérifié au handshake
  (`auth/session.ts`, avec `tokenVersion`) + origine vérifiée ; un siège est lié à un **compte**.
- *Latence* : le client anime les événements dans une file (`AnimationQueue`) et se recale sur l'état
  complet envoyé après chaque action (`StateSyncController`).
- *Reconnexion* : fenêtre de grâce de 30 s, adversaire prévenu (compte à rebours), reprise
  exacte de la partie (`reattach`), forfait après délai ; reprise aussi d'une cible en attente.

**Démo** : partie PvP ; couper le réseau / fermer l'onglet de B → A voit « Opponent disconnected —
30s » ; rouvrir la partie avec B → elle reprend ; recommencer sans revenir → A gagne par forfait.

---

## 12. Mineur — Gamification (1 pt)

**Où** : `app/lib/cardBacks.ts` (dos et conditions), `game_engine/srcs/matchResults.ts`
(déblocage à la victoire, paquets, Elo, historique), `app/lib/packs.ts` (garantie légendaire,
déblocage « collection complète »), `app/lib/achievements.ts` + `app/app/achievements/**`
(progression), classement `/players`.

**Éléments (tous persistés en base)** :
1. **Succès = dos de cartes** (choix de l'équipe) : 5 dos à débloquer — première victoire contre
   un joueur, contre l'IA facile / moyenne / difficile, collection complète →
   `User.unlockedCardBacks`. Équipables dans la collection, **vus par l'adversaire** en partie,
   affichés sur le profil public.
2. **Classement** Elo (`User.elo`, K = 32) sur `/players`.
3. **Récompenses** : paquets par victoire (`User.unopenedPacks` : IA moyenne 1, difficile 2,
   joueur 2), garantie d'une légendaire tous les 5 paquets (`User.pityCounter`).
4. **Historique** des parties (`Match` / `MatchPlayer`) avec variation d'Elo.

**Retour visuel / règles affichées** : barres de progression et règles sur `/achievements`, écran de
fin de partie « +2 packs · Elo +16 » et dos débloqué annoncé, compteur « N packs until
guaranteed legendary ».

**Démo** : gagner une partie contre l'IA moyenne → écran de fin avec récompenses (dont « nouveau dos
débloqué ») → `/achievements` (« ✅ Unlocked ») → l'équiper dans la collection → profil public
(section « Card backs earned »).
