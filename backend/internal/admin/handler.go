package admin

import (
	"net/http"
	"strconv"

	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService AdminService
}

func NewAdminHandler(adminService AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.adminService.GetStats()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Admin stats retrieved", stats)
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	users, total, err := h.adminService.GetUsers(page, limit, search)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Users retrieved", gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	adminIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	targetIDStr := c.Param("id")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var dto UpdateUserStatusDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ip := c.ClientIP()
	if err := h.adminService.UpdateUserStatus(adminIDVal.(uint), uint(targetID), dto.Status, dto.Role, ip); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User status updated", nil)
}

func (h *AdminHandler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	logs, total, err := h.adminService.GetAuditLogs(page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Audit logs retrieved", gin.H{
		"logs":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AdminHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, requireAdmin gin.HandlerFunc) {
	adminGroup := r.Group("/admin")
	adminGroup.Use(authMiddleware, requireAdmin)
	{
		adminGroup.GET("/stats", h.GetStats)
		adminGroup.GET("/users", h.GetUsers)
		adminGroup.PUT("/users/:id/status", h.UpdateUserStatus)
		adminGroup.GET("/audit-logs", h.GetAuditLogs)
	}
}
