P_DB_USERNAME ?= $(shell sh -c 'read -p "Database user: " var; echo $$var')
P_DB_PASSWORD ?= $(shell sh -c 'read -p "Database password: " var; echo $$var')
P_JWT_SECRET ?= $(shell sh -c 'read -p "JWT Secret: " var; echo $$var')

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

clean: down test-down
	-@$(DOCKER) down -v
	-@$(DOCKER) --env-file .env.test -f test-compose.yml down -v

fclean: clean
	-@$(DOCKER) down --rmi local
	-@$(DOCKER) --env-file .env.test -f test-compose.yml down --rmi local

re: clean build

status:
	@$(DOCKER) ps

lint:
	npm run lint

format:
	npm run format

test: test-up
	
test-up:
	@$(DOCKER) --env-file .env.test -f test-compose.yml run --rm backend npx vitest --maxWorkers=1 --watch

test-down:
	@$(DOCKER) --env-file .env.test -f test-compose.yml down

test-logs:
	$(DOCKER) -f test-compose.yml logs --follow

secrets:
	@mkdir -p ./docker/secrets
	@export DB_USERNAME='$(P_DB_USERNAME)'; echo "$$DB_USERNAME" > ./docker/secrets/db_username.txt
	@export DB_PASSWORD='$(P_DB_PASSWORD)'; echo "$$DB_PASSWORD" > ./docker/secrets/db_password.txt
	@export JWT_SECRET='$(P_JWT_SECRET)'; echo "$$JWT_SECRET" > ./docker/secrets/jwt_secret.txt

.PHONY: all build up down logs clean re status lint format test test-up test-down test-logs secrets
