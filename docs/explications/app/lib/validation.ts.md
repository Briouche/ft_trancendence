# `app/lib/validation.ts`

> Service : **app** · TypeScript (client **et** serveur) · ~160 lignes · schémas zod.

## 1. Rôle

**Un schéma de validation par type d'entrée**, utilisé des deux côtés :
- dans le navigateur, pour un retour immédiat dans les formulaires ;
- sur le serveur (server actions, routes API), pour la vérification qui compte vraiment.

Un seul schéma = impossible que client et serveur divergent.

## 2. Dépendances

- **Importe** : `zod`.
- **Utilisé par** : formulaires (`SignInForm`, `RegisterForm`, `EditProfileForm`,
  `FriendsPanel`, `ChatWindow`, `PlayerSearch`, `DeckBuilder`), serveur (`auth.ts`,
  `updateUserProfile.ts`, `decks.ts`, `oauth42.ts`, routes API amis/messages/users), tests
  (`tests/validation.test.ts`).

## 3. Explication bloc par bloc

| Schéma | Règle |
|---|---|
| `usernameSchema` | 3-30 caractères `[a-zA-Z0-9_]`, espaces retirés, **mis en minuscules** |
| `emailSchema` | email valide ≤ 254, minuscules |
| `passwordSchema` | 8-128, au moins une minuscule, une majuscule, un chiffre |
| `loginSchema` | identifiant (nom ou email) + mot de passe non vide |
| `registerSchema` | nom + email + mot de passe + confirmation identique (`refine`) |
| `profileUpdateSchema` | nom + email + nouveau mot de passe **optionnel** (vide = inchangé) + confirmation |
| `deckBodySchema` | nom 1-50, liste de `{ cardId, qty entier > 0 }` |
| `idSchema` | entier positif (paramètres de route) |
| `messageContentSchema` | 1-500 caractères après `trim` |
| `userSearchSchema` | paramètres de `/api/users` ; une valeur invalide revient à la valeur par défaut (`.catch`) |

Utilitaires : `formDataToObject(formData)` (champs texte d'un formulaire → objet) et
`firstIssue(error)` (premier message d'erreur à afficher).

## 4. Flux concret

Inscription avec « ab » comme nom : le formulaire affiche l'erreur sans appel réseau ; si
quelqu'un contourne le navigateur et appelle l'action directement, `registerUser` renvoie la même
erreur.

## 5. Points d'attention

- Les constantes (`USERNAME_MAX_LENGTH`…) servent aussi aux attributs HTML (`maxLength`,
  `pattern`) des champs.
- Ce fichier ne doit pas importer de code serveur : il est chargé dans le navigateur.

## 6. Questions probables en évaluation

- **Validez-vous côté front et côté back ?** Oui, avec les mêmes schémas zod.
- **Pourquoi mettre les noms en minuscules ?** Unicité insensible à la casse (« Alice » et
  « alice » sont le même compte).
