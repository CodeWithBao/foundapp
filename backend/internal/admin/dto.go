package admin

type UpdateUserStatusDTO struct {
	Status string `json:"status" binding:"required"`
	Role   string `json:"role,omitempty"`
}

type AdminStatsDTO struct {
	TotalUsers         int64 `json:"total_users"`
	TotalLostItems     int64 `json:"total_lost_items"`
	TotalFoundItems    int64 `json:"total_found_items"`
	TotalReturnedItems int64 `json:"total_returned_items"`
	TotalClaims        int64 `json:"total_claims"`
	TotalPendingClaims int64 `json:"total_pending_claims"`
}
