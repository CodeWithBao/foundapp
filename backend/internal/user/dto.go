package user

type UpdateProfileDTO struct {
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	StudentID string `json:"student_id"`
	Avatar    string `json:"avatar"`
}
