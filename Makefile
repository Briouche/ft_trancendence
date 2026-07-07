.PHONY: all add_domain dev prod rebuild down npm-clean docker-clean fclean re

include .env

# Default target
all: dev

# Add domain name to local machine's DNS
add_domain:
	grep -qxF "127.0.0.1	$(DOMAIN_NAME)" /etc/hosts || echo "127.0.0.1	$(DOMAIN_NAME)" | sudo tee -a /etc/hosts

# Development Setup
dev: npm-clean
	cd app && npm install
	docker compose up

# Production Setup
prod: down
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Safe Rebuild for development (Forces fresh image composition without cache layers)
rebuild: down
	docker compose build --no-cache
	docker compose up

# Gracefully takes down all possible service configurations & anonymized volumes
down:
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down -v

# Clean local workspace state safely
npm-clean: down
	rm -rf app/.next
	rm -rf app/dist
	rm -rf app/node_modules

# Wipe all built image states to free disk storage space
docker-clean:
	docker system prune -f
	docker image prune -f

# Hard factory reset of the development cycle
fclean: down docker-clean

# Full fresh run
re: fclean all
