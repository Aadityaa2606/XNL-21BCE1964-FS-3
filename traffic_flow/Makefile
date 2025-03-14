include .env

##@ Database Management

startcontainer: ## Start PostgreSQL container
	sudo docker run --name $(POSTGRES_CONTAINER_NAME) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-e POSTGRES_DB=$(DB_NAME) \
		-p $(DB_PORT):$(DB_PORT) \
		-d timescale/timescaledb:latest-pg17 || sudo docker start $(POSTGRES_CONTAINER_NAME)

stopcontainer: ## Stop PostgreSQL container
	sudo docker stop $(POSTGRES_CONTAINER_NAME) || true

deletecontainer: ## Stop and delete PostgreSQL container
	make stopcontainer
	sudo docker rm $(POSTGRES_CONTAINER_NAME) || true

resetdb: ## Resets the database
	make deletecontainer
	make startcontainer

psql: ## Connect to PostgreSQL with psql
	sudo docker exec -it $(POSTGRES_CONTAINER_NAME) psql --username=$(DB_USER) --dbname=$(DB_NAME)

migrateup: ## Run all pending migrations
	goose -dir $(GOOSE_MIGRATION_DIR) postgres "$(DB_SOURCE)" up

migrateup1: ## Run 1 pending migration
	goose -dir $(GOOSE_MIGRATION_DIR) postgres "$(DB_SOURCE)" up 1

migratedown: ## Rollback all migrations
	goose -dir $(GOOSE_MIGRATION_DIR) postgres "$(DB_SOURCE)" down

migratedown1: ## Rollback 1 migration
	goose -dir $(GOOSE_MIGRATION_DIR) postgres "$(DB_SOURCE)" down 1

sqlc: ## Generate Go code from SQL
	sqlc generate

test: ## Run tests with coverage (no cache)
	go test -v -cover -count=1 ./...

server: ## Run the server
	go run cmd/main.go


.PHONY: startcontainer stopcontainer deletecontainer resetdb psql migrateup migrateup1 migratedown migratedown1 sqlc test server