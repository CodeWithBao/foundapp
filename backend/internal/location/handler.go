package location

import (
	"net/http"
	"strconv"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type LocationHandler struct {
	service LocationService
}

func NewLocationHandler(service LocationService) *LocationHandler {
	return &LocationHandler{service: service}
}

func (h *LocationHandler) GetAll(c *gin.Context) {
	locations, err := h.service.GetAllLocations()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Locations retrieved", locations)
}

func (h *LocationHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	loc, err := h.service.GetLocationByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Location not found")
		return
	}
	response.Success(c, http.StatusOK, "Location retrieved", loc)
}

func (h *LocationHandler) Create(c *gin.Context) {
	var loc models.Location
	if err := c.ShouldBindJSON(&loc); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.CreateLocation(&loc); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusCreated, "Location created", loc)
}

func (h *LocationHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var loc models.Location
	if err := c.ShouldBindJSON(&loc); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := h.service.UpdateLocation(uint(id), &loc)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Location updated", updated)
}

func (h *LocationHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	if err := h.service.DeleteLocation(uint(id)); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Location deleted", nil)
}

func (h *LocationHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, requireStaffOrAdmin gin.HandlerFunc) {
	group := r.Group("/locations")
	{
		group.GET("", h.GetAll)
		group.GET("/:id", h.GetByID)

		adminGroup := group.Group("")
		adminGroup.Use(authMiddleware, requireStaffOrAdmin)
		{
			adminGroup.POST("", h.Create)
			adminGroup.PUT("/:id", h.Update)
			adminGroup.DELETE("/:id", h.Delete)
		}
	}
}
