.PHONY: all dev prod rebuild down npm-clean docker-clean fclean re

# Default target
all: dev

# Development Setup
dev:
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
	rm -rf app/node_modules
	rm -rf app/.next
	rm -rf app/dist

# Wipe all built image states to free disk storage space
docker-clean: down
	docker system prune -f
	docker image prune -af

# Hard factory reset of the development cycle
fclean: npm-clean docker-clean

# Full fresh run
re: fclean all
