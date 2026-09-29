# base: nginx + a self-signed certificate generated at build time (no key is ever committed).
FROM nginx:alpine AS base

ARG DOMAIN_NAME=localhost

RUN rm /etc/nginx/conf.d/default.conf

RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/privkey.pem \
      -out /etc/nginx/ssl/fullchain.pem \
      -subj "/CN=${DOMAIN_NAME}" \
      -addext "subjectAltName=DNS:${DOMAIN_NAME},DNS:localhost,IP:127.0.0.1"

# development: HTTPS on 8080 in front of the hot-reloading services. docker-compose.override.yml
# also bind-mounts dev.conf, so it can be edited without a rebuild.
FROM base AS development
COPY dev.conf /etc/nginx/nginx.conf

# production: HTTPS on 443, HTTP on 80 redirects, static files served from disk.
FROM base AS production
COPY prod.conf.template /etc/nginx/templates/default.conf.template
