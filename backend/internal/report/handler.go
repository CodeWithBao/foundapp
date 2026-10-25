package report

import (
	"net/http"
	"strconv"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	service ReportService
}

func NewReportHandler(service ReportService) *ReportHandler {
	return &ReportHandler{service: service}
}

func (h *ReportHandler) CreateReport(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Vui lòng đăng nhập để báo cáo bài viết")
		return
	}

	var dto CreateReportDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, "Dữ liệu báo cáo không hợp lệ: "+err.Error())
		return
	}

	rep, err := h.service.CreateReport(userIDVal.(uint), dto)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Báo cáo đã được gửi đến quản trị viên.", rep)
}

func (h *ReportHandler) GetAllReports(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	reason := c.Query("reason")

	reports, total, err := h.service.GetAllReports(status, reason, page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Enrich with total report count per post
	type ReportItemDTO struct {
		models.Report
		PostTotalReports int64 `json:"post_total_reports"`
	}

	var enriched []ReportItemDTO
	for _, r := range reports {
		cnt, _ := h.service.GetPostReportCount(r.PostID)
		enriched = append(enriched, ReportItemDTO{
			Report:           r,
			PostTotalReports: cnt,
		})
	}

	response.Success(c, http.StatusOK, "Reports retrieved", gin.H{
		"reports": enriched,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

func (h *ReportHandler) UpdateStatus(c *gin.Context) {
	adminIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid report ID")
		return
	}

	var dto UpdateReportStatusDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.UpdateReportStatus(adminIDVal.(uint), uint(id), dto.Status, dto.AdminNote); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Đã cập nhật trạng thái báo cáo", nil)
}

func (h *ReportHandler) ToggleHidePost(c *gin.Context) {
	adminIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid report ID")
		return
	}

	var dto UpdatePostHiddenDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.TogglePostHidden(uint(id), dto.IsHidden, adminIDVal.(uint), dto.Reason); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	msg := "Đã khôi phục bài đăng"
	if dto.IsHidden {
		msg = "Đã ẩn bài đăng vi phạm"
	}
	response.Success(c, http.StatusOK, msg, nil)
}

func (h *ReportHandler) DeletePost(c *gin.Context) {
	adminIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid report ID")
		return
	}

	if err := h.service.DeletePost(uint(id), adminIDVal.(uint)); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Đã xóa bài đăng thành công", nil)
}

func (h *ReportHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, requireAdmin gin.HandlerFunc) {
	// User submit report
	r.POST("/reports", authMiddleware, h.CreateReport)

	// Admin report management
	adminReports := r.Group("/admin/reports")
	adminReports.Use(authMiddleware, requireAdmin)
	{
		adminReports.GET("", h.GetAllReports)
		adminReports.PUT("/:id/status", h.UpdateStatus)
		adminReports.PUT("/:id/hide", h.ToggleHidePost)
		adminReports.DELETE("/:id/post", h.DeletePost)
	}
}
