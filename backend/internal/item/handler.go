package item

import (
	"net/http"
	"strconv"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type ItemHandler struct {
	itemService ItemService
}

func NewItemHandler(itemService ItemService) *ItemHandler {
	return &ItemHandler{itemService: itemService}
}

func (h *ItemHandler) GetAllItems(c *gin.Context) {
	var filter ItemFilterDTO
	if err := c.ShouldBindQuery(&filter); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	items, total, err := h.itemService.GetAllItems(filter)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Items retrieved successfully", gin.H{
		"items": items,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}

func (h *ItemHandler) GetItemByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	item, err := h.itemService.GetItemByID(uint(id), true)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Item not found")
		return
	}

	response.Success(c, http.StatusOK, "Item retrieved successfully", item)
}

func (h *ItemHandler) CreateItem(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto CreateItemDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	item, err := h.itemService.CreateItem(userIDVal.(uint), dto)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Item created successfully", item)
}

func (h *ItemHandler) UpdateItem(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userRoleVal, _ := c.Get("role")
	userRole := models.RoleUser
	if r, ok := userRoleVal.(models.Role); ok {
		userRole = r
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	var dto UpdateItemDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	item, err := h.itemService.UpdateItem(uint(id), userIDVal.(uint), userRole, dto)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Item updated successfully", item)
}

func (h *ItemHandler) DeleteItem(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userRoleVal, _ := c.Get("role")
	userRole := models.RoleUser
	if r, ok := userRoleVal.(models.Role); ok {
		userRole = r
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	if err := h.itemService.DeleteItem(uint(id), userIDVal.(uint), userRole); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Item deleted successfully", nil)
}

func (h *ItemHandler) GetMyItems(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	items, err := h.itemService.GetUserItems(userIDVal.(uint))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User items retrieved successfully", items)
}

func (h *ItemHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	itemsGroup := r.Group("/items")
	{
		itemsGroup.GET("", h.GetAllItems)
		itemsGroup.GET("/user/me", authMiddleware, h.GetMyItems)
		itemsGroup.GET("/:id", h.GetItemByID)
		itemsGroup.POST("", authMiddleware, h.CreateItem)
		itemsGroup.PUT("/:id", authMiddleware, h.UpdateItem)
		itemsGroup.DELETE("/:id", authMiddleware, h.DeleteItem)
	}
}
