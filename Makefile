P_DB_USERNAME ?= $(shell sh -c 'read -p "Database user: " var; echo $$var')
P_DB_PASSWORD ?= $(shell sh -c 'read -p "Database password: " var; echo $$var')

DOCKER = docker compose

all: up

build:
	@$(DOCKER) build --no-cache

up:
	@$(DOCKER) up -d

down:
	@$(DOCKER) down

logs:
	@$(DOCKER) logs --follow

clean: down
	-@docker-compose down -v

fclean: clean
	-@docker-compose down --rmi local

re: clean build

status:
	$(DOCKER) ps

lint:
	npm run lint

format:
	npm run format

secrets:
	@mkdir -p ./docker/secrets
	@export DB_USERNAME='$(P_DB_USERNAME)'; echo "$$DB_USERNAME" > ./docker/secrets/db_username.txt
	@export DB_PASSWORD='$(P_DB_PASSWORD)'; echo "$$DB_PASSWORD" > ./docker/secrets/db_password.txt

.PHONY: all build up down logs clean re status lint format secrets
