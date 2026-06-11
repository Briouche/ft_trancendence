all: dev

dev:
	docker compose up

prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

down:
	docker compose down -v

npm-clean:
	rm -rf app/app/generated
	rm -rf app/node_modules
	rm -rf app/.next

docker-clean: down
	docker system prune -af
	
fclean: npm-clean docker-clean

re: fclean all
