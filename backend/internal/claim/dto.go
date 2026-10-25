package claim

type SubmitClaimDTO struct {
	ItemID        uint     `json:"item_id" binding:"required"`
	Reason        string   `json:"reason" binding:"required"`
	SecretDetails string   `json:"secret_details"`
	Evidences     []string `json:"evidences"`
}

type ReviewClaimDTO struct {
	Note string `json:"note"`
}

type HandoverClaimDTO struct {
	RecipientName      string `json:"recipient_name"`
	RecipientStudentID string `json:"recipient_student_id"`
	Location           string `json:"location"`
	Notes              string `json:"notes"`
}
