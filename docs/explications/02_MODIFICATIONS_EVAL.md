# Modifications qu'un évaluateur peut demander

Chaque exemple donne les fichiers et lignes à toucher (état de la branche `finalisation`), puis
comment vérifier. Après une modification :

- code de `app/` : rechargement à chaud, il suffit de recharger la page ;
- code de `game_engine/` : `docker compose restart game_engine` (ts-node ne recharge pas seul) ;
- `schema.prisma` : créer une migration (voir l'exemple 5), puis `make` (le conteneur `app`
  applique les migrations au démarrage).

---

## 1. Changer la difficulté de l'IA

**Fichier** : `game_engine/srcs/ai/types.ts`, lignes 11-13.

```ts
facile:    { simulations: 100,  worlds: 2, mistakeRate: 0.25, thinkMs: [1200, 2400] },
moyen:     { simulations: 500,  worlds: 5, mistakeRate: 0.10, thinkMs: [900, 1900] },
difficile: { simulations: 2000, worlds: 8, mistakeRate: 0,    thinkMs: [700, 1500] },
```

- Plus fort : augmenter `simulations` et/ou `worlds` (coût CPU : `simulations × worlds` par coup).
- Plus « humain » : augmenter `mistakeRate` (probabilité de jouer un coup sensé au hasard).
- Plus rapide ou plus lent : `thinkMs` (pause en ms avant chaque coup, tirée entre min et max).

Vérifier : `cd game_engine && npm test` (le test « difficulty presets scale » exige que l'effort
augmente avec la difficulté), puis une partie solo.

## 2. Changer le délai de reconnexion avant forfait

**Fichier** : `game_engine/srcs/socket/gameSession.ts`, ligne 24 :
`const RECONNECT_GRACE_MS = 30_000;` → par exemple `60_000`.
Le client affiche automatiquement la bonne durée (le serveur l'envoie dans
`opponentDisconnected.secondsRemaining`). Mettre aussi à jour la phrase « 30 seconds » des
conditions d'utilisation (`app/config/english.tsx`, section « Fair play »).

## 3. Changer les points de vie de départ des héros

**Fichier** : `game_engine/srcs/hero.ts`, ligne 5 : `public maxHealth: number = 20;`.
Attention : la légendaire Timmy fixe ses propres PV (`game_engine/srcs/legendary.ts`,
`timmyPassive`), et le test `fatigue` de `game_engine/tests/gameEngine.test.ts` calcule à partir
de 20.

## 4. Changer la mana max, la taille de la main ou du plateau

| Règle | Fichier | Ligne |
|---|---|---|
| Mana maximum (7) | `game_engine/srcs/player.ts` | 7 : `const MAX_MANA` |
| Taille de la main (10) | `game_engine/srcs/hand.ts` | 3 : `const MAX_HAND_SIZE` |
| Serviteurs par camp (6) | `game_engine/srcs/board.ts` | 4 : `export const MAX_BOARD_SIZE` (utilisé aussi par `gameEngine.ts` l. 144 et 363) |
| Cartes de départ (3, +1 au second joueur) | `game_engine/srcs/gameEngine.ts` | 56-59 dans `startGame` |

Le client Phaser place les cartes en fonction de ce qu'il reçoit, il n'a pas besoin d'être modifié
pour ces valeurs (seule la mise en page d'un plateau plus large pourrait être à revoir :
`app/game/objects/board/BoardMath.ts`).

## 5. Ajouter un champ au profil (ex. une « bio »)

1. **Base** — `app/prisma/schema.prisma`, modèle `User` (après `avatar String?`, l. 26) :
   `bio String? @db.VarChar(200)`.
2. **Migration** — dans `app/` : `npx prisma migrate dev --name add_user_bio` (avec la base
   lancée et `DATABASE_URL` pointant sur `127.0.0.1:5432`), ou relancer `make` après avoir écrit
   la migration.
3. **Validation** — `app/lib/validation.ts`, `profileUpdateSchema` (l. 80) : ajouter
   `bio: z.string().trim().max(200).optional().default("")`.
4. **Enregistrement** — `app/lib/updateUserProfile.ts`, dans `data` (l. 53) : ajouter `bio`.
5. **Formulaire** — `app/app/profile/EditProfileForm.tsx` : copier un bloc `<label>` (l. 49) avec
   `name="bio"`.
6. **Lecture** — `app/lib/session.ts`, `select` de `getCurrentUser` (l. 119) + type `CurrentUser`
   (l. 19-30) ; affichage dans `app/app/profile/ProfileInformation.tsx` (à côté de l'Elo, l. 50).
7. **Profil public** (optionnel) — `app/lib/profile.ts`, `select` (l. 25) et
   `app/app/users/[username]/PublicProfileView.tsx` (sous « Joined », l. 72).

## 6. Ajouter un succès

**Fichier** : `app/lib/achievementCatalog.ts`, tableau `ACHIEVEMENTS` (l. 38). Exemple, basé sur une
statistique existante :

```ts
{ key: "centurion", title: "Centurion", description: "Play 100 matches.", metric: "matchesPlayed", goal: 100, tier: "gold", rewardPacks: 3 },
```

C'est tout : la page `/achievements`, le badge du profil et le déblocage automatique suivent.
Pour une **nouvelle statistique**, ajouter son nom au type `AchievementMetric` (même fichier) et son
calcul dans `computeStats` (`app/lib/achievements.ts`, objet retourné l. 41).

## 7. Changer les récompenses d'une victoire

- Paquets par victoire : `game_engine/srcs/matchResults.ts`, `PACKS_FOR_WIN` (l. 28-33).
- **Et** l'annonce sur l'écran de choix : `app/app/play/PlayModeSelector.tsx`, `packsForWin`
  (l. 48) — les deux sont synchronisés à la main (le client n'envoie jamais ce nombre).
- Dos de carte gagné à la première victoire : `CARD_BACK_FOR_WIN` (l. 36).
- Facteur Elo : `ELO_K_FACTOR` (l. 44) ; le test `tests/matchResults.test.ts` s'adapte (il utilise
  la constante).

## 8. Changer la longueur maximale d'un message de chat

- `app/lib/validation.ts`, `MESSAGE_MAX_LENGTH` (l. 118) : validation client + serveur.
- La colonne est `@db.VarChar(500)` (`app/prisma/schema.prisma`, l. 66) : pour **augmenter** la
  limite, modifier aussi la colonne et créer une migration (voir l'exemple 5).

## 9. Changer l'ouverture des paquets

`app/lib/packs.ts` :
- `CARDS_PER_PACK` (l. 6) : cartes par paquet ;
- `PACKS_BEFORE_GUARANTEED_LEGENDARY` (l. 7) : garantie de légendaire ;
- `RARITY_WEIGHTS` (l. 10) : probabilités relatives de chaque rareté.

Le compteur affiché « N packs until guaranteed legendary » est dans
`app/app/packs/PackOpener.tsx` (`packsUntilLegendary = 5 - pityCounter`) : garder la même valeur.

## 10. Changer les règles de mot de passe, d'avatar ou de deck

- Mot de passe : `app/lib/validation.ts`, `PASSWORD_MIN_LENGTH` (l. 9) et `passwordSchema` (l. 38).
  Les formulaires utilisent les mêmes constantes, rien d'autre à changer.
- Taille max d'avatar : `app/lib/avatarStorage.ts` `AVATAR_MAX_BYTES` (l. 11), **plus**
  `app/app/profile/AvatarUploader.tsx` `MAX_BYTES` (l. 10), **plus** nginx
  `client_max_body_size` (`proxy/dev.conf` l. 29, `proxy/prod.conf.template` l. 36) : il doit rester
  supérieur à la limite.
- Deck : `app/lib/deckRules.ts`, `MAX_LEGENDARY` / `MAX_NON_LEGENDARY` (l. 6-7), partagés par le
  constructeur de deck (client) et l'API (serveur).

## Bonus : durée de session et limite de connexion

- Session : `app/lib/session.ts`, `SESSION_DURATION_MS` (l. 10) — règle à la fois le cookie et le JWT.
- Tentatives de connexion : `app/lib/auth.ts`, `LOGIN_FAILURES_PER_ACCOUNT` / `_PER_IP` (l. 23-24).
