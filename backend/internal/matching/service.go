package matching

import (
	"sort"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/strategy"
)

type MatchingService interface {
	GetMatchesForUser(userID uint) ([]MatchItemDTO, error)
	GetMatchesForItem(itemID uint) ([]MatchItemDTO, error)
}

type matchingService struct {
	repo MatchingRepository
}

func NewMatchingService(repo MatchingRepository) MatchingService {
	return &matchingService{repo: repo}
}

func (s *matchingService) GetMatchesForUser(userID uint) ([]MatchItemDTO, error) {
	userItems, err := s.repo.GetUserItems(userID)
	if err != nil {
		return nil, err
	}

	var allMatches []MatchItemDTO
	matcher := strategy.NewMatchingContext(&strategy.CategoryLocationMatchingStrategy{})

	for _, uItem := range userItems {
		opponents, err := s.repo.GetOppositeItems(uItem.Type)
		if err != nil {
			continue
		}

		for _, opp := range opponents {
			var lost, found *models.Item
			if uItem.Type == models.ItemTypeLost {
				lost = &uItem
				found = &opp
			} else {
				lost = &opp
				found = &uItem
			}

			score := matcher.Match(lost, found)
			if score >= 30.0 {
				allMatches = append(allMatches, MatchItemDTO{
					Target:    uItem,
					Candidate: opp,
					Score:     score,
					MatchedAt: time.Now(),
				})
			}
		}
	}

	sort.Slice(allMatches, func(i, j int) bool {
		return allMatches[i].Score > allMatches[j].Score
	})

	return allMatches, nil
}

func (s *matchingService) GetMatchesForItem(itemID uint) ([]MatchItemDTO, error) {
	item, err := s.repo.GetItemByID(itemID)
	if err != nil {
		return nil, err
	}

	opponents, err := s.repo.GetOppositeItems(item.Type)
	if err != nil {
		return nil, err
	}

	matcher := strategy.NewMatchingContext(&strategy.CategoryLocationMatchingStrategy{})
	var results []MatchItemDTO

	for _, opp := range opponents {
		var lost, found *models.Item
		if item.Type == models.ItemTypeLost {
			lost = item
			found = &opp
		} else {
			lost = &opp
			found = item
		}

		score := matcher.Match(lost, found)
		if score >= 30.0 {
			results = append(results, MatchItemDTO{
				Target:    *item,
				Candidate: opp,
				Score:     score,
				MatchedAt: time.Now(),
			})
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	return results, nil
}
