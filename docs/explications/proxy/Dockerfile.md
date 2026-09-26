# `proxy/Dockerfile`

> Service : **proxy** (nginx) · Dockerfile · image du reverse proxy TLS.

## 1. Rôle

Construit nginx avec un **certificat auto-signé généré au build** (aucune clé n'est versionnée),
puis deux cibles : `development` (config `dev.conf`) et `production` (template `prod.conf.template`).

## 2. Dépendances

- Utilisé par `docker-compose.override.yml` (`target: development`) et `docker-compose.prod.yml`
  (`target: production`, argument `DOMAIN_NAME`).

## 3. Explication bloc par bloc

```dockerfile
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/privkey.pem -out /etc/nginx/ssl/fullchain.pem \
      -subj "/CN=${DOMAIN_NAME}" \
      -addext "subjectAltName=DNS:${DOMAIN_NAME},DNS:localhost,IP:127.0.0.1"
```

Certificat valable un an pour le domaine, `localhost` et `127.0.0.1` (les navigateurs exigent le
*subjectAltName*). Le navigateur l'affiche comme « non sûr » car auto-signé : c'est attendu pour
un projet local.

## 4. Flux concret

`make` → image `development` → nginx écoute en HTTPS sur 8080.

## 5. Points d'attention

- Pour un vrai déploiement, remplacer par un certificat d'une autorité (ex. Let's Encrypt).

## 6. Questions probables en évaluation

- **D'où vient le certificat HTTPS ?** Généré par openssl à la construction de l'image.
