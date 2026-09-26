# `proxy/prod.conf.template`

> Service : **proxy** · configuration nginx du mode production (`make prod`).

## 1. Rôle

Comme `dev.conf`, mais pour la production : ports **80 → redirection** et **443 en HTTPS**,
nom de domaine `${DOMAIN_NAME}` (remplacé au démarrage par l'image nginx), et fichiers statiques
servis directement depuis le disque.

## 2. Dépendances

- Copié en template par `proxy/Dockerfile` (cible `production`).
- Volumes `next_static` et `next_public` remplis par le service `static_assets`
  (`docker-compose.prod.yml`).

## 3. Explication bloc par bloc

- `upstream` fixes (pas de rechargement de conteneurs en prod).
- `server { listen 80; return 301 https://… }`.
- `server { listen 443 ssl; http2 on; … }` : TLS 1.2/1.3, cache de session, en-têtes de sécurité
  (`always` pour qu'ils soient aussi sur les réponses d'erreur ; répétés dans `/_next/static/` car
  un `add_header` dans un `location` annule ceux du `server`).
- `/_next/static/` : fichiers immuables, cache d'un an.
- `/` : `try_files /public$uri @nextjs` (fichier public s'il existe, sinon Next.js).
- `/socket.io/` et `/chat-socket.io/` : WebSockets.

## 4. Flux concret

`make prod` → `https://<DOMAIN_NAME>/` ; les images de cartes sont servies par nginx sans passer
par Node.

## 5. Points d'attention

- `DOMAIN_NAME` doit correspondre au certificat et au `server_name`, sinon erreur de certificat ou
  404.

## 6. Questions probables en évaluation

- **Différence dev/prod ?** Dev : un seul port 8080 TLS, code monté à chaud. Prod : 80/443,
  build optimisé de Next, statiques servis par nginx.
