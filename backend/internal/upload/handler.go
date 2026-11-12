package upload

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"unifind-dntu/internal/middleware"
	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const maxImageSize int64 = 10 << 20

var allowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

func randomID() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func safeFileName(header *multipart.FileHeader) string {
	name := filepath.Base(strings.TrimSpace(header.Filename))
	if name == "." || name == "" {
		return "item-image"
	}
	if len(name) > 255 {
		return name[len(name)-255:]
	}
	return name
}

func detectSupportedImage(data []byte) (string, bool) {
	contentType := http.DetectContentType(data)
	return contentType, allowedImageTypes[contentType]
}

func (h *Handler) Upload(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	header, err := c.FormFile("image")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Vui lòng chọn một tệp ảnh")
		return
	}
	if header.Size <= 0 || header.Size > maxImageSize {
		response.Error(c, http.StatusRequestEntityTooLarge, "Ảnh phải có dung lượng không quá 10 MB")
		return
	}

	file, err := header.Open()
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Không thể đọc tệp ảnh")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxImageSize+1))
	if err != nil || int64(len(data)) > maxImageSize {
		response.Error(c, http.StatusRequestEntityTooLarge, "Ảnh phải có dung lượng không quá 10 MB")
		return
	}
	contentType, supported := detectSupportedImage(data)
	if !supported {
		response.Error(c, http.StatusUnsupportedMediaType, "Định dạng ảnh không được hỗ trợ. Vui lòng dùng JPG, PNG hoặc WebP")
		return
	}

	id, err := randomID()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Không thể tạo mã ảnh")
		return
	}
	uploaded := models.UploadedImage{
		ID:          id,
		UserID:      userIDValue.(uint),
		ContentType: contentType,
		FileName:    safeFileName(header),
		Size:        int64(len(data)),
		Data:        data,
	}
	if err := h.db.Create(&uploaded).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Không thể lưu ảnh")
		return
	}

	response.Success(c, http.StatusCreated, "Image uploaded successfully", gin.H{
		"id":           uploaded.ID,
		"url":          "/api/v1/uploads/" + uploaded.ID,
		"content_type": uploaded.ContentType,
		"size":         uploaded.Size,
	})
}

func (h *Handler) Get(c *gin.Context) {
	var image models.UploadedImage
	if err := h.db.First(&image, "id = ?", c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.Status(http.StatusNotFound)
			return
		}
		c.Status(http.StatusInternalServerError)
		return
	}
	// Only images attached to visible posts are public; unlinked uploads may be claim proof.
	var publicCount int64
	url := "/api/v1/uploads/" + image.ID
	if err := h.db.Model(&models.ItemImage{}).Joins("JOIN items ON items.id = item_images.item_id").
		Where("item_images.image_url = ? AND items.is_hidden = ? AND items.deleted_at IS NULL", url, false).
		Count(&publicCount).Error; err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}
	id, _ := c.Get("user_id")
	role, _ := c.Get("role")
	// Handover proof remains private even if later attached to a public post.
	isHandover, isRecipient := false, false
	if h.db.Migrator().HasTable(&models.HandoverRecord{}) {
		var records []models.HandoverRecord
		if err := h.db.Select("recipient_id", "evidence_image", "evidence_images").
			Where("evidence_image = ? OR evidence_images LIKE ?", url, "%\""+url+"\"%").Find(&records).Error; err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		for _, record := range records {
			linked := record.EvidenceImage == url
			for _, evidence := range record.EvidenceImages {
				linked = linked || evidence == url
			}
			if linked {
				isHandover = true
				isRecipient = isRecipient || id == record.RecipientID
			}
		}
	}
	if publicCount == 0 || isHandover {
		if id != image.UserID && role != models.RoleStaff && role != models.RoleAdmin && !isRecipient {
			c.Status(http.StatusForbidden)
			return
		}
	}
	c.Header("Cache-Control", "private, no-store")
	c.Header("Content-Disposition", "inline")
	c.Data(http.StatusOK, image.ContentType, image.Data)
}

func (h *Handler) Delete(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	result := h.db.Where("id = ? AND user_id = ?", c.Param("id"), userIDValue.(uint)).Delete(&models.UploadedImage{})
	if result.Error != nil {
		response.Error(c, http.StatusInternalServerError, "Không thể xóa ảnh")
		return
	}
	if result.RowsAffected == 0 {
		response.Error(c, http.StatusNotFound, "Không tìm thấy ảnh")
		return
	}
	response.Success(c, http.StatusOK, "Image deleted successfully", nil)
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, uploadRateLimit gin.HandlerFunc) {
	uploads := r.Group("/uploads")
	uploads.GET("/:id", middleware.OptionalAuth(), h.Get)
	if uploadRateLimit != nil {
		uploads.POST("", authMiddleware, uploadRateLimit, h.Upload)
	} else {
		uploads.POST("", authMiddleware, h.Upload)
	}
	uploads.DELETE("/:id", authMiddleware, h.Delete)
}
