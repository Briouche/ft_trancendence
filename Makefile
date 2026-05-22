all: up

init:
	mkdir -p ./nginx/certs
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ./nginx/certs/key.pem \
		-out ./nginx/certs/cert.pem \
		-subj "/C=BE/ST=Brussels/L=Brussels/O=Dev/CN=localhost"

up: init
	docker compose -f ./docker-compose.yml up -d

up_logs: down
	docker compose -f ./docker-compose.yml up

rebuild:
	docker compose -f ./docker-compose.yml build --no-cache

down:
	docker compose -f ./docker-compose.yml down

clean: down
	docker system prune -f
	rm -rf nextjs-app/.next nextjs-app/node_modules

fclean: clean
	rm -rf nginx/certs
	rm -rf db
	docker system prune -af

re: fclean up
