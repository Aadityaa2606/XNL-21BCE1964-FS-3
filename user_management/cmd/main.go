package main

import (
	"context"
	"os"
	"smart_city/user_management/api"
	db "smart_city/user_management/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// load env using godotenv
	err := godotenv.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Error loading .env file")
	}

	dbSource := os.Getenv("DB_SOURCE")

	if os.Getenv("ENVIROMENT") == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	// Creates DB connection
	conn, err := pgxpool.New(context.Background(), dbSource)
	if err != nil {
		log.Fatal().Err(err).Msg("cannot connect to db:")
	}

	store := db.NewStore(conn)

	server, err := api.NewServer(store)

	if err != nil {
		log.Fatal().Err(err).Msg("cannot create server: ")
	}

	log.Info().Msgf("starting HTTP-USER server on %s", os.Getenv("USER_SERVER_ADDR"))
	err = server.Start(os.Getenv("USER_SERVER_ADDR"))
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot start server: ")
	}
}
