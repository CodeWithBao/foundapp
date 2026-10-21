package item

import (
	"net/http"
	"strconv"
	"strings"

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

	sanitizedItems := make([]models.Item, len(items))
	for i := range items {
		sanitizedItems[i] = h.sanitizeItem(c, &items[i])
	}

	response.Success(c, http.StatusOK, "Items retrieved successfully", gin.H{
		"items": sanitizedItems,
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

	sanitizedItem := h.sanitizeItem(c, item)
	response.Success(c, http.StatusOK, "Item retrieved successfully", sanitizedItem)
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

func maskPhone(phone string) string {
	if phone == "" {
		return ""
	}
	clean := strings.ReplaceAll(phone, " ", "")
	if len(clean) < 7 {
		half := len(clean) / 2
		if half == 0 {
			return "***"
		}
		return clean[:half] + "****"
	}
	return clean[:4] + "****" + clean[len(clean)-2:]
}

func maskEmail(email string) string {
	if email == "" {
		return ""
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	name := parts[0]
	domain := parts[1]
	if len(name) <= 2 {
		return name[:1] + "***@" + domain
	}
	return name[:2] + "***@" + domain
}

func (h *ItemHandler) sanitizeItem(c *gin.Context, item *models.Item) models.Item {
	if item == nil {
		return models.Item{}
	}
	res := *item

	var viewerID uint
	if v, exists := c.Get("user_id"); exists {
		if id, ok := v.(uint); ok {
			viewerID = id
		}
	}
	var viewerRole models.Role
	if r, exists := c.Get("role"); exists {
		if role, ok := r.(models.Role); ok {
			viewerRole = role
		}
	}

	isOwner := viewerID > 0 && viewerID == item.UserID
	isStaffOrAdmin := viewerRole == models.RoleStaff || viewerRole == models.RoleAdmin

	if !isOwner && !isStaffOrAdmin {
		res.User.Phone = maskPhone(res.User.Phone)
		res.User.Email = maskEmail(res.User.Email)
		res.User.StudentID = ""
		res.User.GoogleSub = nil
	}
	return res
}

func (h *ItemHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, createRateLimit gin.HandlerFunc, optionalAuth gin.HandlerFunc) {
	itemsGroup := r.Group("/items")
	{
		if optionalAuth != nil {
			itemsGroup.GET("", optionalAuth, h.GetAllItems)
			itemsGroup.GET("/:id", optionalAuth, h.GetItemByID)
		} else {
			itemsGroup.GET("", h.GetAllItems)
			itemsGroup.GET("/:id", h.GetItemByID)
		}
		itemsGroup.GET("/user/me", authMiddleware, h.GetMyItems)
		if createRateLimit != nil {
			itemsGroup.POST("", authMiddleware, createRateLimit, h.CreateItem)
		} else {
			itemsGroup.POST("", authMiddleware, h.CreateItem)
		}
		itemsGroup.PUT("/:id", authMiddleware, h.UpdateItem)
		itemsGroup.DELETE("/:id", authMiddleware, h.DeleteItem)
	}
}
