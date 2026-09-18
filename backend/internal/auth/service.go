package auth

import (
	"context"
	"errors"
	"os"

	"unifind-dntu/internal/models"
	"unifind-dntu/pkg/googleauth"
	"unifind-dntu/pkg/jwt"

	"golang.org/x/crypto/bcrypt"
)

var ErrAccountAlreadyExists = errors.New("ACCOUNT_ALREADY_EXISTS")

type AuthService interface {
	Login(dto LoginDTO) (*AuthResponseDTO, error)
	Register(dto RegisterDTO) (*AuthResponseDTO, error)
	GoogleLogin(ctx context.Context, idToken string) (*AuthResponseDTO, error)
	GetProfile(userID uint) (*models.User, error)
	ChangePassword(userID uint, dto ChangePasswordDTO) error
}

type authService struct {
	userRepo       UserRepository
	googleVerifier googleauth.TokenVerifier
}

func NewAuthService(userRepo UserRepository) AuthService {
	return &authService{
		userRepo:       userRepo,
		googleVerifier: googleauth.NewVerifier(),
	}
}

func NewAuthServiceWithVerifier(userRepo UserRepository, verifier googleauth.TokenVerifier) AuthService {
	return &authService{
		userRepo:       userRepo,
		googleVerifier: verifier,
	}
}

func (s *authService) Login(dto LoginDTO) (*AuthResponseDTO, error) {
	user, err := s.userRepo.FindByEmail(dto.Email)
	if err != nil {
		return nil, errors.New("Invalid email or password")
	}

	if user.PasswordHash == "" {
		return nil, errors.New("This account is registered via Google sign-in. Please log in with Google.")
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

	// Public registration must always assign ROLE_USER (prevent privilege escalation)
	user := models.User{
		Name:         dto.Name,
		Email:        dto.Email,
		PasswordHash: string(hashedPassword),
		Role:         models.RoleUser,
		Phone:        dto.Phone,
		StudentID:    dto.StudentID,
		AuthProvider: "LOCAL",
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

func (s *authService) GoogleLogin(ctx context.Context, idToken string) (*AuthResponseDTO, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	payload, err := s.googleVerifier.VerifyToken(ctx, idToken, clientID)
	if err != nil {
		return nil, err
	}

	if payload.Email == "" || payload.Sub == "" {
		return nil, errors.New("Invalid Google token payload")
	}

	// 1. Check if user with GoogleSub already exists
	user, err := s.userRepo.FindByGoogleSub(payload.Sub)
	if err == nil && user != nil {
		if user.Status == "INACTIVE" || user.Status == "BANNED" {
			return nil, errors.New("Account is deactivated or banned")
		}
		// Update avatar/name if changed
		if payload.Picture != "" && user.AvatarURL == "" {
			user.AvatarURL = payload.Picture
			_ = s.userRepo.Update(user)
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

	// 2. Check if user with Email exists
	existingEmailUser, _ := s.userRepo.FindByEmail(payload.Email)
	if existingEmailUser != nil {
		// If existing local account without GoogleSub -> Conflict
		if existingEmailUser.GoogleSub == nil || *existingEmailUser.GoogleSub == "" {
			return nil, ErrAccountAlreadyExists
		}
	}

	// 3. Create new user with RoleUser
	subStr := payload.Sub
	displayName := payload.Name
	if displayName == "" {
		displayName = payload.Email
	}

	newUser := models.User{
		Name:         displayName,
		Email:        payload.Email,
		GoogleSub:    &subStr,
		AuthProvider: "GOOGLE",
		AvatarURL:    payload.Picture,
		Avatar:       payload.Picture,
		Role:         models.RoleUser,
		Status:       "ACTIVE",
	}

	if err := s.userRepo.Create(&newUser); err != nil {
		return nil, err
	}

	token, err := jwt.GenerateToken(&newUser)
	if err != nil {
		return nil, err
	}

	return &AuthResponseDTO{
		Token: token,
		User:  newUser,
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

	if user.PasswordHash == "" {
		return errors.New("Google-linked accounts cannot change password directly")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(dto.OldPassword)); err != nil {
		return errors.New("Current password incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(dto.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return s.userRepo.Update(user)
}
