package api

import (
	"context"
	"encoding/json"
	"net/http"
	db "smart_city/traffic_flow/db/sqlc"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

type recordTrafficDataRequest struct {
	SensorID        int32   `json:"sensor_id" binding:"required"`
	TrafficVolume   int32   `json:"traffic_volume" binding:"required"`
	AverageSpeed    float64 `json:"average_speed" binding:"required"`
	CongestionLevel string  `json:"congestion_level" binding:"required,oneof=low moderate high"`
}

func (server *Server) recordTrafficData(ctx *gin.Context) {
	var req recordTrafficDataRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.RecordTrafficDataParams{
		SensorID:        req.SensorID,
		Timestamp:       pgtype.Timestamp{Time: time.Now(), Valid: true},
		TrafficVolume:   req.TrafficVolume,
		AverageSpeed:    req.AverageSpeed,
		CongestionLevel: db.CongestionLevelType(req.CongestionLevel),
	}

	trafficData, err := server.store.RecordTrafficData(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Broadcast update to WebSocket clients
	server.broadcastTrafficUpdate(trafficData)

	ctx.JSON(http.StatusCreated, trafficData)
}

type getTrafficDataRequest struct {
	SensorID  int32  `json:"sensor_id" binding:"required"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

func (server *Server) getTrafficDataBySensor(ctx *gin.Context) {
	var req getTrafficDataRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format, use RFC3339"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format, use RFC3339"})
		return
	}

	arg := db.GetTrafficDataBySensorParams{
		SensorID:    req.SensorID,
		Timestamp:   pgtype.Timestamp{Time: startTime, Valid: true},
		Timestamp_2: pgtype.Timestamp{Time: endTime, Valid: true},
	}

	trafficData, err := server.store.GetTrafficDataBySensor(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, trafficData)
}

func (server *Server) getLatestTrafficData(ctx *gin.Context) {
	limitStr := ctx.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	trafficData, err := server.store.GetLatestTrafficData(ctx, int32(limit))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, trafficData)
}

type trafficStatsRequest struct {
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

func (server *Server) getHighCongestionAreas(ctx *gin.Context) {
	var req trafficStatsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	limitStr := ctx.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format, use RFC3339"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format, use RFC3339"})
		return
	}

	arg := db.GetHighCongestionAreasParams{
		Timestamp:   pgtype.Timestamp{Time: startTime, Valid: true},
		Timestamp_2: pgtype.Timestamp{Time: endTime, Valid: true},
		Limit:       int32(limit),
	}

	congestionAreas, err := server.store.GetHighCongestionAreas(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, congestionAreas)
}

type trafficAveragesRequest struct {
	SensorID  int32  `json:"sensor_id" binding:"required"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

func (server *Server) getTrafficAverages(ctx *gin.Context) {
	var req trafficAveragesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format, use RFC3339"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format, use RFC3339"})
		return
	}

	arg := db.GetTrafficAveragesParams{
		SensorID:    req.SensorID,
		Timestamp:   pgtype.Timestamp{Time: startTime, Valid: true},
		Timestamp_2: pgtype.Timestamp{Time: endTime, Valid: true},
	}

	averages, err := server.store.GetTrafficAverages(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, averages)
}

func (server *Server) getSensorCongestionDistribution(ctx *gin.Context) {
	var req trafficStatsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format, use RFC3339"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format, use RFC3339"})
		return
	}

	arg := db.GetSensorCongestionDistributionParams{
		Timestamp:   pgtype.Timestamp{Time: startTime, Valid: true},
		Timestamp_2: pgtype.Timestamp{Time: endTime, Valid: true},
	}

	distribution, err := server.store.GetSensorCongestionDistribution(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, distribution)
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

// Client represents a WebSocket client connection
type Client struct {
	conn *websocket.Conn
}

// handleWebSocket handles WebSocket connections for real-time traffic updates
func (server *Server) handleWebSocket(ctx *gin.Context) {
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to set up websocket connection")
		return
	}

	client := &Client{conn: conn}
	server.registerClient(client)

	defer func() {
		server.unregisterClient(client)
		conn.Close()
	}()

	// Read loop to keep the connection alive and handle incoming messages
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Error().Err(err).Msg("websocket error")
			}
			break
		}
	}
}

// broadcastTrafficUpdate sends traffic updates to all connected clients
func (server *Server) broadcastTrafficUpdate(data any) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Error().Err(err).Msg("Error marshalling traffic data for WebSocket broadcast")
		return
	}

	for client := range server.wsClients {
		go func(c *Client) {
			err := c.conn.WriteMessage(websocket.TextMessage, jsonData)
			if err != nil {
				log.Error().Err(err).Msg("Error sending WebSocket message")
				server.unregisterClient(c)
			}
		}(client)
	}
}

// startBackgroundUpdates periodically sends traffic updates to WebSocket clients
func (server *Server) startBackgroundUpdates() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	go func() {
		for range ticker.C {
			data, err := server.store.GetLatestTrafficData(context.Background(), 20)
			if err != nil {
				log.Error().Err(err).Msg("Error getting latest traffic data for WebSocket update")
				continue
			}
			if len(data) > 0 {
				server.broadcastTrafficUpdate(data)
			}
		}
	}()
}
