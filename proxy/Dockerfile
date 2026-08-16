FROM nginx:alpine

ARG DOMAIN_NAME=localhost

RUN rm /etc/nginx/conf.d/default.conf

RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/privkey.pem \
      -out /etc/nginx/ssl/fullchain.pem \
      -subj "/CN=${DOMAIN_NAME}"

COPY prod.conf.template /etc/nginx/templates/default.conf.template
