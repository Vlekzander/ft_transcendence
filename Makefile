-include .env

P_DB_USERNAME ?= $(shell sh -c 'read -p "Database user: " var; echo $$var')
P_DB_PASSWORD ?= $(shell sh -c 'read -p "Database password: " var; echo $$var')
P_JWT_SECRET ?= $(shell sh -c 'read -p "JWT Secret: " var; echo $$var')

export USER_ID ?= $(shell id -u)
export GROUP_ID ?= $(shell id -g)

IS_IP := $(shell if echo "$(DOMAIN_NAME)" | grep -qE '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$$'; then echo 1; else echo 0; fi)
ifeq ($(IS_IP),1)
    SAN = IP:$(DOMAIN_NAME)
else
    SAN = DNS:$(DOMAIN_NAME)
endif

DOCKER-PROD = docker compose -f prod-compose.yml

all: dev

# --- DEV START ---

DOCKER-DEV = docker compose -f dev-compose.yml

dev: up-dev

build-dev:
	@$(DOCKER-DEV) build --no-cache

up-dev:
	@$(DOCKER-DEV) up -d

down-dev:
	@$(DOCKER-DEV) down

logs-dev:
	@$(DOCKER-DEV) logs --follow

status-dev:
	@$(DOCKER-DEV) ps

.PHONY:	build-dev dev up-dev down-dev logs-dev status-dev

# --- DEV END ---

prod: up-prod

build-prod:
	@$(DOCKER-PROD) build --no-cache

up-prod: secrets
	@$(DOCKER-PROD) up -d

down-prod:
	@$(DOCKER-PROD) down

logs-prod:
	@$(DOCKER-PROD) logs --follow

status-prod:
	@$(DOCKER-PROD) ps

# --- TEST START ---

DOCKER-TEST = docker compose -f test-compose.yml

test:
	@$(DOCKER-TEST) run --rm backend npm run test

test-coverage:
	@$(DOCKER-TEST) run --rm backend npm run test:coverage

test-unit:
	@$(DOCKER-TEST) run --rm backend npm run test:unit
	
test-integration:
	@$(DOCKER-TEST) run --rm backend npm run test:integration

test-down:
	-@$(DOCKER-TEST) down

test-logs:
	@$(DOCKER-TEST) logs --follow

.PHONY: test test-coverage test-unit test-integration test-down test-logs

# --- TEST END ---

clean: down-prod down-dev test-down
	-@$(DOCKER-DEV) down -v # DEV LINE
	-@$(DOCKER-PROD) down -v
	-@$(DOCKER-TEST) down -v # TEST LINE

fclean: clean
	-@$(DOCKER-DEV) down --rmi local # DEV LINE
	-@$(DOCKER-PROD) down --rmi local
	-@$(DOCKER-TEST) down --rmi local # TEST LINE

re: fclean build-prod build-dev

lint:
	npm run lint

format:
	npm run format

./docker/secrets/ssl.key ./docker/secrets/ssl.crt:
	@mkdir -p ./docker/secrets
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ./docker/secrets/ssl.key \
		-out ./docker/secrets/ssl.crt \
		-subj "/C=BE/ST=Brussels/L=Brussels/O=ft_transcendence/CN=$(DOMAIN_NAME)" \
		-addext "subjectAltName=$(SAN)" 2> /dev/null

secrets: ./docker/secrets/ssl.key ./docker/secrets/ssl.crt

.PHONY: all \
		build-prod prod up-prod down-prod logs-prod status-prod \
		clean fclean re lint format secrets
