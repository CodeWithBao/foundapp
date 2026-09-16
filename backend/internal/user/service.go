package user

import (
	"unifind-dntu/internal/models"
)

type UserService interface {
	UpdateProfile(userID uint, dto UpdateProfileDTO) (*models.User, error)
}

type userService struct {
	userRepo UserRepository
}

func NewUserService(userRepo UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) UpdateProfile(userID uint, dto UpdateProfileDTO) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	if dto.Name != "" {
		user.Name = dto.Name
	}
	if dto.Phone != "" {
		user.Phone = dto.Phone
	}
	if dto.StudentID != "" {
		user.StudentID = dto.StudentID
	}
	if dto.Avatar != "" {
		user.Avatar = dto.Avatar
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}
