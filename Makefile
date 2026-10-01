P_DB_USERNAME ?= $(shell sh -c 'read -p "Database user: " var; echo $$var')
P_DB_PASSWORD ?= $(shell sh -c 'read -p "Database password: " var; echo $$var')
P_JWT_SECRET ?= $(shell sh -c 'read -p "JWT Secret: " var; echo $$var')

DOCKER = docker compose
DOCKER-TEST = docker compose --env-file .env.test -f test-compose.yml
DOCKER-PROD = docker compose -f prod-compose.yml

all: up

build:
	@$(DOCKER) build --no-cache

build-prod:
	@$(DOCKER-PROD) build --no-cache

up:
	@$(DOCKER) up -d

prod: up-prod

up-prod:
	@$(DOCKER-PROD) up -d

down:
	@$(DOCKER) down

down-prod:
	@$(DOCKER-PROD) down

logs:
	@$(DOCKER) logs --follow

logs-prod:
	@$(DOCKER-PROD) logs --follow

clean: down test-down down-prod
	-@$(DOCKER) down -v
	-@$(DOCKER-PROD) down -v
	-@$(DOCKER-TEST) down -v

fclean: clean
	-@$(DOCKER) down --rmi local
	-@$(DOCKER-TEST) down --rmi local

re: clean build build-prod

status:
	@$(DOCKER) ps

status-prod:
	@$(DOCKER-prod) ps

lint:
	npm run lint

format:
	npm run format

test:
	@$(DOCKER-TEST) run --rm backend npm run test

test-coverage:
	@$(DOCKER) --rm backend npm run test:coverage

test-unit:
	@$(DOCKER) run --rm backend npm run test:unit
	
test-integration:
	@$(DOCKER) run --rm backend npm run test:integration

test-down:
	-@$(DOCKER) down

test-logs:
	@$(DOCKER) logs --follow

secrets:
	@mkdir -p ./docker/secrets
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./docker/secrets/ssl.key -out ./docker/secrets/ssl.crt -subj "/C=BE/ST=Brussels/L=Brussels/O=ft_transcendence/CN=localhost" -addext "subjectAltName=DNS:localhost" 2> /dev/null
	@export DB_USERNAME='$(P_DB_USERNAME)'; echo "$$DB_USERNAME" > ./docker/secrets/db_username.txt
	@export DB_PASSWORD='$(P_DB_PASSWORD)'; echo "$$DB_PASSWORD" > ./docker/secrets/db_password.txt
	@export JWT_SECRET='$(P_JWT_SECRET)'; echo "$$JWT_SECRET" > ./docker/secrets/jwt_secret.txt

.PHONY: all build up down logs clean re status lint format test test-coverage test-unit test-integration test-down test-logs secrets build-prod up-prod prod down-prod logs-prod status-prod
