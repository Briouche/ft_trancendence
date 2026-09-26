# `proxy/dev.conf`

> Service : **proxy** · configuration nginx du mode développement (`make`).

## 1. Rôle

Unique point d'entrée en dev : **HTTPS sur le port 8080**, redirection du HTTP simple, en-têtes
de sécurité, et routage vers les trois services.

## 2. Dépendances

- Monté dans le conteneur par `docker-compose.override.yml` (modifiable sans rebuild).
- Cibles : `app:3000`, `game_engine:4000`, `socketio:4000`.

## 3. Explication bloc par bloc

- `resolver 127.0.0.11 valid=10s` + `set $upstream …` : nginx résout le nom des conteneurs à
  chaque requête (DNS de Docker) ; un conteneur redémarré (nouvelle IP) reste joignable.
- `listen 8080 ssl; http2 on;` + certificats : TLS même en développement (exigence du sujet).
- `error_page 497 =301 https://$host:$server_port$request_uri;` : une requête HTTP simple sur le
  port TLS provoque l'erreur nginx 497 ; on la transforme en redirection vers HTTPS.
- En-têtes : `X-Frame-Options: SAMEORIGIN` (anti-clickjacking), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Strict-Transport-Security`.
- `client_max_body_size 3m` : avatars jusqu'à 2 Mo (nginx refuse au-delà de 1 Mo par défaut).
- `location /` → Next.js (avec `X-Real-IP`, utilisé par la limite de connexion) ; `/_next/hmr` →
  rechargement à chaud ; `/socket.io/` → serveur de jeu ; `/chat-socket.io/` → serveur de chat.
  Les WebSockets passent grâce aux en-têtes `Upgrade`/`Connection` et à des délais de 24 h.

## 4. Flux concret

`http://localhost:8080/privacy` → 301 vers `https://localhost:8080/privacy` → Next.js.

## 5. Points d'attention

- `proxy_read_timeout 120s` sur `/` : en dev, Turbopack compile une page à la première visite.

## 6. Questions probables en évaluation

- **Comment le HTTPS est-il assuré ?** nginx termine TLS ; les conteneurs se parlent en clair sur
  le réseau Docker interne (autorisé par le sujet).
- **Comment passent les WebSockets ?** Mêmes blocs `location` avec les en-têtes d'upgrade.
