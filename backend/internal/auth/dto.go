package auth

import "unifind-dntu/internal/models"

type LoginDTO struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type GoogleLoginDTO struct {
	IdToken    string `json:"id_token"`
	Credential string `json:"credential"`
}

type RegisterDTO struct {
	Name      string `json:"name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	Phone     string `json:"phone"`
	StudentID string `json:"student_id"`
}

type ChangePasswordDTO struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

type AuthResponseDTO struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}
