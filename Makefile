all: dev

dev:
	docker compose up --build

prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

clean:
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down

fclean: clean
	docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.prod.yml down -v

ffclean: fclean
	docker image prune -af
	docker volume prune -f
	docker system prune -af

re: fclean all
