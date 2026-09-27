# `app/app/achievements/AchievementsView.tsx`

> Service : **app** · Client Component · la page des succès (dos de cartes)

## 1. Rôle

Affiche les **règles de progression** (chaque succès débloque un dos de cartes, dos de départ,
paquets gagnés par victoire, légendaire garantie tous les 5 paquets, Elo K = 32), le compteur
« X / 5 unlocked », puis chaque dos de succès avec son illustration, sa condition, sa **barre de
progression** et son état.

## 2. Dépendances

- **Importe** : `PageShell`, `Panel`, `ProgressBar`, `TextLink`, `CardBackArt`,
  `lib/cardBacks.ts` (`DEFAULT_UNLOCKED_CARD_BACKS`), `config/routes.ts`, le type
  `CardBackAchievement` de `lib/achievements.ts` (import de type seulement : rien de serveur
  n'arrive dans le bundle client).

## 3. Explication bloc par bloc

- `useEffect` → `fetch('/api/achievements')` → état ; le drapeau `cancelled` évite d'écrire
  l'état après démontage (et en double sous le Strict Mode de dev).
- Chaque succès : `CardBackArt` (grisé `opacity-40 grayscale` s'il est verrouillé), la règle,
  `ProgressBar` (`value / goal`, libellé accessible), puis « ✅ Unlocked » ou « value / goal ».
- Le compteur est dans une zone `aria-live="polite"` (annoncé par les lecteurs d'écran).

## 4. Flux concret

Après une première victoire en PvP → « 1 / 5 unlocked », le dos « Win a game vs another player »
apparaît en couleur ; le lien « Equip a card back » mène à la collection pour l'équiper.

## 5. Points d'attention

- La page ne débloque rien (lecture seule) : le déblocage a lieu en fin de partie ou à
  l'ouverture d'un paquet.

## 6. Questions probables en évaluation

- **Quel retour visuel pour la gamification ?** Écran de fin de partie (paquets, Elo, dos
  débloqué), barres de progression ici, dos visibles sur le profil public et par l'adversaire.
