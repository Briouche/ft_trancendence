include .env

.PHONY: all dev prod clean fclean ffclean re

all: dev

# docker-compose.yml + docker-compose.override.yml: bind mounts, hot reload, HTTPS on
# https://localhost:8080. --renew-anon-volumes: node_modules lives in an anonymous volume that
# compose would otherwise reuse, silently keeping the old dependencies after a package.json change.
dev:
	docker compose up --build --renew-anon-volumes

# production images, nginx with TLS
prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

clean:
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down

# also drops the db/redis volumes
fclean: clean
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down -v

ffclean: fclean
	docker image prune -af
	docker volume prune -f
	docker system prune -af

re: fclean all
