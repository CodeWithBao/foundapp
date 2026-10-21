package matching

import (
	"fmt"
	"sort"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/strategy"
)

const candidateThreshold = 35.0

type MatchingService interface {
	GetMatchesForUser(userID uint) ([]MatchItemDTO, error)
	GetMatchesForItem(itemID uint) ([]MatchItemDTO, error)
}

type matchingService struct{ repo MatchingRepository }
func NewMatchingService(repo MatchingRepository) MatchingService { return &matchingService{repo: repo} }

func (s *matchingService) GetMatchesForUser(userID uint) ([]MatchItemDTO, error) {
	lostItems, err := s.repo.GetUserItems(userID)
	if err != nil { return nil, err }
	saved, _ := s.repo.GetSavedMatchesForUser(userID)
	savedByPair := make(map[string]models.Match, len(saved))
	for _, match := range saved { savedByPair[pairKey(match.LostItemID, match.FoundItemID)] = match }

	matcher := &strategy.CategoryLocationMatchingStrategy{}
	results := make([]MatchItemDTO, 0)
	for i := range lostItems {
		lost := &lostItems[i]
		foundItems, getErr := s.repo.GetOppositeItems(lost.Type)
		if getErr != nil { continue }
		for j := range foundItems {
			found := &foundItems[j]
			explanation := matcher.Explain(lost, found)
			if explanation.Score < candidateThreshold { continue }
			matchedAt := time.Now()
			var matchID uint
			if record, ok := savedByPair[pairKey(lost.ID, found.ID)]; ok { matchID, matchedAt = record.ID, record.MatchedAt }
			results = append(results, MatchItemDTO{ID: matchID, LostItem: *lost, FoundItem: *found, Score: explanation.Score, Reasons: explanation.Reasons, Breakdown: explanation.Breakdown, MatchedAt: matchedAt})
		}
	}
	sortMatches(results)
	return results, nil
}

func (s *matchingService) GetMatchesForItem(itemID uint) ([]MatchItemDTO, error) {
	item, err := s.repo.GetItemByID(itemID)
	if err != nil { return nil, err }
	opponents, err := s.repo.GetOppositeItems(item.Type)
	if err != nil { return nil, err }

	matcher := &strategy.CategoryLocationMatchingStrategy{}
	results := make([]MatchItemDTO, 0)
	for i := range opponents {
		candidate := &opponents[i]
		lost, found := item, candidate
		if item.Type == models.ItemTypeFound { lost, found = candidate, item }
		explanation := matcher.Explain(lost, found)
		if explanation.Score < candidateThreshold { continue }
		results = append(results, MatchItemDTO{LostItem: *lost, FoundItem: *found, Score: explanation.Score, Reasons: explanation.Reasons, Breakdown: explanation.Breakdown, MatchedAt: time.Now()})
	}
	sortMatches(results)
	return results, nil
}

func sortMatches(matches []MatchItemDTO) {
	sort.SliceStable(matches, func(i, j int) bool {
		if matches[i].Score == matches[j].Score { return matches[i].MatchedAt.After(matches[j].MatchedAt) }
		return matches[i].Score > matches[j].Score
	})
}

func pairKey(lostID, foundID uint) string { return fmt.Sprintf("%d:%d", lostID, foundID) }
