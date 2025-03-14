package api

import (
	"net/http"
	db "smart_city/traffic_flow/db/sqlc"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type ServerConfig struct {
	Mode           string
	Timeout        time.Duration
	TrustedProxies []string
	MaxBodySize    int
}

type Server struct {
	store     *db.Store
	router    *gin.Engine
	config    ServerConfig
	wsClients map[*Client]bool
	wsLock    sync.RWMutex
}

func NewServer(store *db.Store) (*Server, error) {
	// Default configuration
	config := ServerConfig{
		Mode:           gin.ReleaseMode,
		Timeout:        30 * time.Second,
		TrustedProxies: []string{"127.0.0.1"},
		MaxBodySize:    8 * 1024 * 1024, // 8MB
	}

	server := &Server{
		store:     store,
		config:    config,
		wsClients: make(map[*Client]bool),
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

	// API Routes
	api := router.Group("/traffic-flow")
	{
		// Sensor Types routes
		sensorTypes := api.Group("/sensor-types")
		{
			sensorTypes.POST("", server.createSensorType)
			sensorTypes.GET("", server.listSensorTypes)
			sensorTypes.GET("/:type_id", server.getSensorType)
			sensorTypes.PUT("/:type_id", server.updateSensorType)
			sensorTypes.DELETE("/:type_id", server.deleteSensorType)
		}

		// Sensors routes
		sensors := api.Group("/sensors")
		{
			// Special sensor routes - MUST come before /:sensor_id routes to avoid conflicts
			sensors.GET("/active", server.getActiveSensors)
			sensors.GET("/by-type/:type_id", server.getSensorsByType)

			// Regular CRUD routes
			sensors.POST("", server.createSensor)
			sensors.GET("", server.listSensors)
			sensors.GET("/:sensor_id", server.getSensor)
			sensors.PUT("/:sensor_id", server.updateSensor)
			sensors.DELETE("/:sensor_id", server.deleteSensor)
		}

		// Traffic data endpoints
		traffic := api.Group("/traffic")
		{
			traffic.POST("/record", server.recordTrafficData)
			traffic.GET("/by-sensor", server.getTrafficDataBySensor)
			traffic.GET("/latest", server.getLatestTrafficData)
			traffic.GET("/high-congestion", server.getHighCongestionAreas)
			traffic.GET("/averages", server.getTrafficAverages)
			traffic.GET("/congestion-distribution", server.getSensorCongestionDistribution)
		}
	}

	// WebSocket endpoint for real-time updates
	router.GET("/ws/traffic", server.handleWebSocket)

	server.router = router
}

func (server *Server) Start(address string) error {
	// Start the background goroutine to send updates to WebSocket clients
	server.startBackgroundUpdates()

	return server.router.Run(address)
}

// registerClient adds a new WebSocket client
func (server *Server) registerClient(client *Client) {
	server.wsLock.Lock()
	defer server.wsLock.Unlock()
	server.wsClients[client] = true
}

// unregisterClient removes a WebSocket client
func (server *Server) unregisterClient(client *Client) {
	server.wsLock.Lock()
	defer server.wsLock.Unlock()
	delete(server.wsClients, client)
}

func errorResponse(err error) gin.H {
	return gin.H{"error": err.Error()}
}
