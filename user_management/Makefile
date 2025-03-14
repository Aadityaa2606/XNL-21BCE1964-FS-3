include .env

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

.PHONY: migrateup migrateup1 migratedown migratedown1 sqlc test server