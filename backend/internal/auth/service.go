package auth

import (
	"errors"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/jwt"

	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(dto LoginDTO) (*AuthResponseDTO, error)
	Register(dto RegisterDTO) (*AuthResponseDTO, error)
	GetProfile(userID uint) (*models.User, error)
	ChangePassword(userID uint, dto ChangePasswordDTO) error
}

type authService struct {
	userRepo UserRepository
}

func NewAuthService(userRepo UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Login(dto LoginDTO) (*AuthResponseDTO, error) {
	user, err := s.userRepo.FindByEmail(dto.Email)
	if err != nil {
		return nil, errors.New("Invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(dto.Password)); err != nil {
		return nil, errors.New("Invalid email or password")
	}

	if user.Status == "INACTIVE" || user.Status == "BANNED" {
		return nil, errors.New("Account is deactivated or banned")
	}

	token, err := jwt.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponseDTO{
		Token: token,
		User:  *user,
	}, nil
}

func (s *authService) Register(dto RegisterDTO) (*AuthResponseDTO, error) {
	existing, _ := s.userRepo.FindByEmail(dto.Email)
	if existing != nil {
		return nil, errors.New("Email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := dto.Role
	if role == "" {
		role = models.RoleUser
	}

	user := models.User{
		Name:         dto.Name,
		Email:        dto.Email,
		PasswordHash: string(hashedPassword),
		Role:         role,
		Phone:        dto.Phone,
		StudentID:    dto.StudentID,
		Status:       "ACTIVE",
	}

	if err := s.userRepo.Create(&user); err != nil {
		return nil, err
	}

	token, err := jwt.GenerateToken(&user)
	if err != nil {
		return nil, err
	}

	return &AuthResponseDTO{
		Token: token,
		User:  user,
	}, nil
}

func (s *authService) GetProfile(userID uint) (*models.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *authService) ChangePassword(userID uint, dto ChangePasswordDTO) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(dto.OldPassword)); err != nil {
		return errors.New("Current password incorrect")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(dto.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashed)
	return s.userRepo.Update(user)
}
