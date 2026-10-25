package matching

import (
	"net/http"
	"strconv"

	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type MatchingHandler struct {
	matchingService MatchingService
}

func NewMatchingHandler(matchingService MatchingService) *MatchingHandler {
	return &MatchingHandler{matchingService: matchingService}
}

func (h *MatchingHandler) GetUserMatches(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	matches, err := h.matchingService.GetMatchesForUser(userIDVal.(uint))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Matches retrieved successfully", matches)
}

func (h *MatchingHandler) GetItemMatches(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	matches, err := h.matchingService.GetMatchesForItem(uint(id))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Item matches retrieved successfully", matches)
}

func (h *MatchingHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	matchesGroup := r.Group("/matches")
	{
		matchesGroup.GET("/user", authMiddleware, h.GetUserMatches)
		matchesGroup.GET("/item/:id", authMiddleware, h.GetItemMatches)
	}
}

