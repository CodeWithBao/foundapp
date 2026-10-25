package category

import (
	"net/http"
	"strconv"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	service CategoryService
}

func NewCategoryHandler(service CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) GetAll(c *gin.Context) {
	categories, err := h.service.GetAllCategories()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Categories retrieved", categories)
}

func (h *CategoryHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	category, err := h.service.GetCategoryByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Category not found")
		return
	}
	response.Success(c, http.StatusOK, "Category retrieved", category)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.CreateCategory(&cat); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusCreated, "Category created", cat)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := h.service.UpdateCategory(uint(id), &cat)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Category updated", updated)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	if err := h.service.DeleteCategory(uint(id)); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Category deleted", nil)
}

func (h *CategoryHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, requireStaffOrAdmin gin.HandlerFunc) {
	group := r.Group("/categories")
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
