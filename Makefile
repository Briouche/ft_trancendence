.PHONY: all add_domain dev prod rebuild down npm-clean docker-clean fclean re

include .env

# Default target
all: dev

dev:
	docker compose up --build

# Production Setup
prod: down
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

clean:
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down

fclean: clean
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down -v

ffclean: fclean
	docker image prune -af
	docker volume prune -f
	docker system prune -af

# Full fresh run
re: fclean all