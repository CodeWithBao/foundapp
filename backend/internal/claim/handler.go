package claim

import (
	"net/http"
	"strconv"

	"unifind-dntu/internal/patterns/facade"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type ClaimHandler struct {
	facade *facade.ClaimFacade
	repo   ClaimRepository
}

func NewClaimHandler(facade *facade.ClaimFacade, repo ClaimRepository) *ClaimHandler {
	return &ClaimHandler{facade: facade, repo: repo}
}

func (h *ClaimHandler) SubmitClaim(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	var dto SubmitClaimDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	claim, err := h.facade.SubmitClaim(userIDVal.(uint), dto.ItemID, dto.Reason, dto.SecretDetails, dto.Evidences)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Claim submitted successfully", claim)
}

func (h *ClaimHandler) GetAll(c *gin.Context) {
	status := c.Query("status")
	claimantID, _ := strconv.ParseUint(c.Query("claimant_id"), 10, 32)
	itemID, _ := strconv.ParseUint(c.Query("item_id"), 10, 32)

	claims, err := h.repo.FindAll(status, uint(claimantID), uint(itemID))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Claims retrieved", claims)
}

func (h *ClaimHandler) GetByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	claim, err := h.repo.FindByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Claim not found")
		return
	}
	response.Success(c, http.StatusOK, "Claim retrieved", claim)
}

func (h *ClaimHandler) Review(c *gin.Context) {
	staffIDVal, _ := c.Get("user_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var dto ReviewClaimDTO
	_ = c.ShouldBindJSON(&dto)
	if err := h.facade.ReviewClaim(uint(id), staffIDVal.(uint), dto.Note); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Claim under review", nil)
}

func (h *ClaimHandler) Approve(c *gin.Context) {
	staffIDVal, _ := c.Get("user_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var dto ReviewClaimDTO
	_ = c.ShouldBindJSON(&dto)
	if err := h.facade.ApproveClaim(uint(id), staffIDVal.(uint), dto.Note); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Claim approved", nil)
}

func (h *ClaimHandler) Reject(c *gin.Context) {
	staffIDVal, _ := c.Get("user_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var dto ReviewClaimDTO
	_ = c.ShouldBindJSON(&dto)
	if err := h.facade.RejectClaim(uint(id), staffIDVal.(uint), dto.Note); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Claim rejected", nil)
}

func (h *ClaimHandler) Ready(c *gin.Context) {
	staffIDVal, _ := c.Get("user_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var dto ReviewClaimDTO
	_ = c.ShouldBindJSON(&dto)
	if err := h.facade.ReadyClaim(uint(id), staffIDVal.(uint), dto.Note); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Claim ready for handover", nil)
}

func (h *ClaimHandler) Handover(c *gin.Context) {
	staffIDVal, _ := c.Get("user_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var dto HandoverClaimDTO
	_ = c.ShouldBindJSON(&dto)
	record, err := h.facade.Handover(uint(id), staffIDVal.(uint), dto.RecipientName, dto.RecipientStudentID, dto.Location, dto.Notes)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Handover completed", record)
}

func (h *ClaimHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, requireStaff gin.HandlerFunc) {
	claimsGroup := r.Group("/claims")
	claimsGroup.Use(authMiddleware)
	{
		claimsGroup.POST("", h.SubmitClaim)
		claimsGroup.GET("", h.GetAll)
		claimsGroup.GET("/:id", h.GetByID)

		staffGroup := claimsGroup.Group("")
		staffGroup.Use(requireStaff)
		{
			staffGroup.PUT("/:id/review", h.Review)
			staffGroup.PUT("/:id/approve", h.Approve)
			staffGroup.PUT("/:id/reject", h.Reject)
			staffGroup.PUT("/:id/ready", h.Ready)
			staffGroup.POST("/:id/handover", h.Handover)
		}
	}
}
