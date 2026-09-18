package report

import "unifind-dntu/internal/models"

type CreateReportDTO struct {
	PostID      uint   `json:"post_id" binding:"required"`
	Reason      string `json:"reason" binding:"required"`
	Description string `json:"description"`
}

type UpdateReportStatusDTO struct {
	Status    models.ReportStatus `json:"status" binding:"required"`
	AdminNote string              `json:"admin_note"`
}

type UpdatePostHiddenDTO struct {
	IsHidden bool   `json:"is_hidden"`
	Reason   string `json:"reason"`
}
