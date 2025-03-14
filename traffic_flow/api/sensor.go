package api

import (
	"net/http"
	db "smart_city/traffic_flow/db/sqlc"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

// CRUD operations for sensors

type createSensorTypeRequest struct {
	TypeName    string `json:"type_name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func (server *Server) createSensorType(ctx *gin.Context) {
	var req createSensorTypeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateSensorTypeParams{
		TypeName:    req.TypeName,
		Description: pgtype.Text{String: req.Description, Valid: true},
	}
	sensor, err := server.store.CreateSensorType(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensor)
}

func (server *Server) listSensorTypes(ctx *gin.Context) {
	sensors, err := server.store.ListSensorTypes(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensors)
}

type getSensorTypeRequest struct {
	TypeID int32 `uri:"type_id" binding:"required,min=1"`
}

func (server *Server) getSensorType(ctx *gin.Context) {
	var req getSensorTypeRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	sensor, err := server.store.GetSensorType(ctx, req.TypeID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensor)
}

// Separate the URI binding from the JSON body binding for updateSensorType
type updateSensorTypeURIRequest struct {
	TypeID int32 `uri:"type_id" binding:"required,min=1"`
}

type updateSensorTypeJSONRequest struct {
	TypeName    string `json:"type_name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func (server *Server) updateSensorType(ctx *gin.Context) {
	var uriReq updateSensorTypeURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var jsonReq updateSensorTypeJSONRequest
	if err := ctx.ShouldBindJSON(&jsonReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.UpdateSensorTypeParams{
		TypeID:      uriReq.TypeID,
		TypeName:    jsonReq.TypeName,
		Description: pgtype.Text{String: jsonReq.Description, Valid: true},
	}

	sensor, err := server.store.UpdateSensorType(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, sensor)
}

type deleteSensorTypeRequest struct {
	TypeID int32 `uri:"type_id" binding:"required,min=1"`
}

func (server *Server) deleteSensorType(ctx *gin.Context) {
	var req deleteSensorTypeRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := server.store.DeleteSensorType(ctx, req.TypeID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"detail": "sensor type deleted"})
}

type createSensorRequest struct {
	Latitude         float64 `json:"latitude" binding:"required"`
	Longitude        float64 `json:"longitude" binding:"required"`
	TypeID           int32   `json:"type_id" binding:"required,min=1"`
	InstallationDate string  `json:"installation_date" binding:"required"`
	Status           string  `json:"status" binding:"omitempty"`
}

func (server *Server) createSensor(ctx *gin.Context) {
	var req createSensorRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Set default status if not provided
	status := req.Status
	if status == "" {
		status = "active"
	}

	// Convert string date to pgtype.Date
	var installationDate pgtype.Date
	if err := installationDate.Scan(req.InstallationDate); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateSensorParams{
		Latitude:         req.Latitude,
		Longitude:        req.Longitude,
		TypeID:           req.TypeID,
		InstallationDate: installationDate,
		Status:           status,
	}

	sensor, err := server.store.CreateSensor(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensor)
}

func (server *Server) listSensors(ctx *gin.Context) {
	sensors, err := server.store.ListSensors(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensors)
}

type getSensorRequest struct {
	SensorID int32 `uri:"sensor_id" binding:"required,min=1"`
}

func (server *Server) getSensor(ctx *gin.Context) {
	var req getSensorRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	sensor, err := server.store.GetSensor(ctx, req.SensorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensor)
}

// update sensor status
type updateSensorURIRequest struct {
	SensorID int32 `uri:"sensor_id" binding:"required,min=1"`
}

type updateSensorJSONRequest struct {
	Status string `json:"status" binding:"required"`
}

func (server *Server) updateSensor(ctx *gin.Context) {
	var uriReq updateSensorURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var jsonReq updateSensorJSONRequest
	if err := ctx.ShouldBindJSON(&jsonReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.UpdateSensorStatusParams{
		SensorID: uriReq.SensorID,
		Status:   jsonReq.Status,
	}

	sensor, err := server.store.UpdateSensorStatus(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, sensor)
}

type deleteSensorRequest struct {
	SensorID int32 `uri:"sensor_id" binding:"required,min=1"`
}

func (server *Server) deleteSensor(ctx *gin.Context) {
	var req deleteSensorRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := server.store.DeleteSensor(ctx, req.SensorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"detail": "sensor deleted"})
}

// get active sensors
func (server *Server) getActiveSensors(ctx *gin.Context) {
	sensors, err := server.store.GetActiveSensors(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensors)
}

// get sensors by type
type getSensorsByTypeRequest struct {
	TypeID int32 `uri:"type_id" binding:"required,min=1"`
}

func (server *Server) getSensorsByType(ctx *gin.Context) {
	var req getSensorsByTypeRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	sensors, err := server.store.GetSensorsByType(ctx, req.TypeID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, sensors)
}
