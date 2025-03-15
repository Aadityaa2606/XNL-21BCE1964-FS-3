package api

import (
	"fmt"
	"net/http"
	"os"
	"smart_city/user_management/util/token"
	"time"

	db "smart_city/user_management/db/sqlc"

	"github.com/gin-gonic/gin"
)

type Server struct {
	store                *db.Store
	tokenMaker           token.Maker
	router               *gin.Engine
	accessTokenDuration  time.Duration
	refreshTokenDuration time.Duration
	config               ServerConfig
}

type ServerConfig struct {
	Mode           string
	Timeout        time.Duration
	TrustedProxies []string
	MaxBodySize    int
}

func NewServer(store *db.Store) (*Server, error) {
	// Default configuration
	config := ServerConfig{
		Mode:           gin.ReleaseMode,
		Timeout:        30 * time.Second,
		TrustedProxies: []string{"127.0.0.1"},
		MaxBodySize:    8 * 1024 * 1024, // 8MB
	}

	tokenMaker, err := token.NewJWTMaker(os.Getenv("TOKEN_SYMMETRIC_KEY"))
	if err != nil {
		return nil, fmt.Errorf("cannot create token maker: %w", err)
	}

	accessTokenDuration, err := time.ParseDuration(os.Getenv("ACCESS_TOKEN_DURATION"))
	if err != nil {
		return nil, fmt.Errorf("cannot parse access token duration: %w", err)
	}

	refreshTokenDuration, err := time.ParseDuration(os.Getenv("REFRESH_TOKEN_DURATION"))
	if err != nil {
		return nil, fmt.Errorf("cannot parse refresh token duration: %w", err)
	}

	server := &Server{
		store:                store,
		tokenMaker:           tokenMaker,
		accessTokenDuration:  accessTokenDuration,
		refreshTokenDuration: refreshTokenDuration,
		config:               config,
	}

	server.setupRouter(config)
	return server, nil
}

func (server *Server) setupRouter(config ServerConfig) {

	router := gin.Default()

	gin.SetMode(config.Mode)

	router.SetTrustedProxies(config.TrustedProxies)

	router.GET("/", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	router.POST("/users", server.createUser)
	router.POST("/users/login", server.loginUser)

	authRoutes := router.Group("/").Use(authMiddleware(server.tokenMaker))

	authRoutes.POST("/users/refresh", server.renewAccessToken)
	authRoutes.POST("/sensors", server.createSensorContribution)
	authRoutes.GET("/sensors", server.getUserContributions)
	authRoutes.DELETE("/sensors/:contribution_id", server.deleteSensor)
	authRoutes.GET("/sensors/all", server.listAllSensors)
	server.router = router
}

func (server *Server) Start(address string) error {
	return server.router.Run(address)
}

func errorResponse(err error) gin.H {
	return gin.H{"error": err.Error()}
}
