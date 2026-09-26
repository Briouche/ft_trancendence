# Décisions prises pendant la finalisation

Chaque choix ambigu tranché en mode autonome, avec sa raison. Le plus récent en bas.

| # | Décision | Raison |
|---|---|---|
| D1 | La branche `finalisation` part de `review/audit-complet` (11 commits de correctifs de sécurité déjà faits). | Ces correctifs sont un prérequis ; repartir de `stef` les perdrait. |
| D2 | La modification non commitée de `app/prisma/seeds/data/tcg-collection.json` (carte « neighboringMinions ») n'est **pas** commitée par moi. | C'est un travail en cours d'un membre de l'équipe ; elle reste dans la copie de travail. |
| D3 | Pas d'outil de formatage appliqué en masse (Prettier) sur tout le repo. Le code existant garde son style (accolades Allman dans `game_engine`, K&R dans `app`). | Un reformatage global réécrirait chaque fichier et provoquerait des conflits sur les 8 branches actives de l'équipe. Le lint (ESLint) est en revanche rendu propre. |
| D4 | Les secrets trouvés dans l'historique Git ne sont **pas** purgés de l'historique. | La consigne interdit de réécrire l'historique ; seule la rotation des secrets protège réellement (signalé dans le rapport final). |
| D5 | HTTPS partout, y compris en dev : le proxy nginx de dev écoute en TLS (certificat auto-signé généré au build) et `make` lance cette configuration. | Le sujet exige HTTPS pour toute connexion au backend, et l'évaluation lance `make`. |
| D6 | Connexion par **email ou nom d'utilisateur** + mot de passe. | Le sujet exige l'email ; garder le nom d'utilisateur évite de casser l'usage actuel. |
| D7 | Validation par schémas avec **zod**, schémas partagés entre formulaires (client) et server actions / routes API (serveur) dans `app/lib/validation.ts`. | Le sujet demande une validation « type zod » des deux côtés ; un seul schéma évite la divergence. |
| D8 | Le chat est une messagerie privée entre amis, persistée en base (`Message`), transportée par le service `socket-server` existant (rooms `user:<id>`). La présence en ligne vient du même service (Redis). | Réutilise le service déjà prévu pour ça (et corrige son authentification) au lieu d'en créer un nouveau. |
| D9 | Avatars stockés sur disque dans un volume Docker (`avatars`), servis par une route Next (`/api/avatars/[file]`) avec type MIME fixé et `nosniff`. Formats acceptés : PNG, JPEG, WebP, vérifiés par signature binaire (magic bytes), 2 Mo max, nom de fichier aléatoire. | Pas d'exécution possible, pas de confiance dans le nom/type envoyé par le client. |
| D10 | La recherche avancée porte sur la liste des joueurs (`/players`) : recherche par nom, filtres (en ligne, amis), tri (Elo, victoires, nom, ancienneté), pagination côté serveur. Elle sert aussi de classement (leaderboard). | Liste la plus pertinente du projet ; couvre à la fois le module « recherche avancée » et un élément de gamification. |
| D11 | Gamification = succès (achievements) persistés + badges (dos de cartes débloqués) + classement Elo + récompenses (paquets par victoire, garantie légendaire). Page `/achievements` avec barres de progression et règles affichées. | Le sujet demande au moins 3 éléments persistés avec retour visuel. |
| D12 | Tests : **vitest** dans `app` et `game_engine`. | Rapide, compatible TypeScript sans configuration lourde. |
| D13 | Le lien d'un compte 42 à un compte local existant se fait uniquement **depuis le profil, en étant connecté** (plus jamais automatiquement par email). | Seul moyen sûr de lier des comptes sans vérification d'email. |
