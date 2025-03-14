package api

import (
	"net/http"

	db "smart_city/user_management/db/sqlc"
	"smart_city/user_management/util/token"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type createSensorRequest struct {
	Service         db.Services `json:"service" binding:"required,oneof=traffic_flow air_quality power_consumption water_levels waste_management structural_integrity"`
	ServiceSensorID int32       `json:"service_sensor_id" binding:"required,min=1"`
}

type createSensorResponse struct {
	ContributionID  int32            `json:"contribution_id"`
	UserID          int32            `json:"user_id"`
	Service         db.Services      `json:"service"`
	ServiceSensorID int32            `json:"service_sensor_id"`
	ContributedAt   pgtype.Timestamp `json:"contributed_at"`
}

func (server *Server) createSensor(ctx *gin.Context) {
	var req createSensorRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	arg := db.AddUserContributionParams{
		UserID:          user.UserID,
		Service:         req.Service,
		ServiceSensorID: req.ServiceSensorID,
	}

	sensor, err := server.store.AddUserContribution(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	rsp := createSensorResponse{
		ContributionID:  sensor.ContributionID,
		UserID:          sensor.UserID,
		Service:         sensor.Service,
		ServiceSensorID: sensor.ServiceSensorID,
		ContributedAt:   sensor.ContributedAt,
	}

	ctx.JSON(http.StatusCreated, rsp)
}

type getUserContributionsResponse struct {
	Sensors []createSensorResponse `json:"sensors"`
}

func (server *Server) getUserContributions(ctx *gin.Context) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	sensors, err := server.store.GetUserContributions(ctx, user.UserID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	rsp := getUserContributionsResponse{
		Sensors: []createSensorResponse{},
	}

	for _, sensor := range sensors {
		rsp.Sensors = append(rsp.Sensors, createSensorResponse{
			ContributionID:  sensor.ContributionID,
			UserID:          sensor.UserID,
			Service:         sensor.Service,
			ServiceSensorID: sensor.ServiceSensorID,
			ContributedAt:   sensor.ContributedAt,
		})
	}

	ctx.JSON(http.StatusOK, rsp)
}

type deleteSensorRequest struct {
	ContributionID int32 `uri:"contribution_id" binding:"required,min=1"`
}

func (server *Server) deleteSensor(ctx *gin.Context) {
	var req deleteSensorRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	sensors, err := server.store.GetUserContributions(ctx, user.UserID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// loop and check if sensor exists
	var found bool
	for _, s := range sensors {
		if s.ContributionID == req.ContributionID {
			found = true
			break
		}
	}

	if !found {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "sensor not found or you don't have permission to delete"})
		return
	}

	err = server.store.DeleteUserContribution(ctx, req.ContributionID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusNoContent, nil)
}
