package facade

import (
	"errors"
	"fmt"
	"time"

	"unifind-dntu/internal/models"
	"unifind-dntu/internal/patterns/observer"

	"gorm.io/gorm"
)

type ClaimFacade struct {
	db       *gorm.DB
	notifier *observer.Subject
}

func NewClaimFacade(db *gorm.DB, notifier *observer.Subject) *ClaimFacade {
	return &ClaimFacade{
		db:       db,
		notifier: notifier,
	}
}

func (cf *ClaimFacade) SubmitClaim(claimantID uint, itemID uint, reason string, secretDetails string, evidences []string) (*models.Claim, error) {
	var item models.Item
	if err := cf.db.First(&item, itemID).Error; err != nil {
		return nil, errors.New("item not found")
	}

	// BR03: User cannot claim their own item
	if item.UserID == claimantID {
		return nil, errors.New("you cannot submit a claim for your own reported item")
	}

	// BR04: Item status check
	if item.IsLocked || item.Status == models.ItemStatusClosed || item.Status == models.ItemStatusReturned {
		return nil, errors.New("item is no longer available for claim")
	}

	// BR05: Duplicate claim check
	var existingCount int64
	cf.db.Model(&models.Claim{}).
		Where("item_id = ? AND claimant_id = ? AND status NOT IN (?)", itemID, claimantID, []models.ClaimStatus{models.ClaimStatusRejected}).
		Count(&existingCount)
	if existingCount > 0 {
		return nil, errors.New("you already have an active claim for this item")
	}

	claim := models.Claim{
		ItemID:        itemID,
		ClaimantID:    claimantID,
		Reason:        reason,
		SecretDetails: secretDetails,
		Status:        models.ClaimStatusPending,
	}

	for _, imgURL := range evidences {
		claim.Evidences = append(claim.Evidences, models.ClaimEvidence{
			ImageURL: imgURL,
		})
	}

	if err := cf.db.Create(&claim).Error; err != nil {
		return nil, err
	}

	if cf.notifier != nil {
		cf.notifier.Notify(observer.Event{
			Type:      observer.EventClaimCreated,
			UserID:    item.UserID,
			Title:     "Yêu cầu nhận đồ mới",
			Message:   fmt.Sprintf("Có nhận yêu cầu mới cho vật phẩm #%d: %s", item.ID, item.Title),
			RelatedID: claim.ID,
		})
	}

	return &claim, nil
}

func (cf *ClaimFacade) ReviewClaim(claimID uint, staffID uint, note string) error {
	return cf.ProcessClaimReview(claimID, staffID, models.ClaimStatusUnderReview, note)
}

func (cf *ClaimFacade) ApproveClaim(claimID uint, staffID uint, note string) error {
	return cf.ProcessClaimReview(claimID, staffID, models.ClaimStatusApproved, note)
}

func (cf *ClaimFacade) RejectClaim(claimID uint, staffID uint, note string) error {
	return cf.ProcessClaimReview(claimID, staffID, models.ClaimStatusRejected, note)
}

func (cf *ClaimFacade) ReadyClaim(claimID uint, staffID uint, note string) error {
	return cf.ProcessClaimReview(claimID, staffID, models.ClaimStatusReadyForHandover, note)
}

func (cf *ClaimFacade) ProcessClaimReview(claimID uint, staffID uint, newStatus models.ClaimStatus, note string) error {
	var claim models.Claim
	if err := cf.db.First(&claim, claimID).Error; err != nil {
		return errors.New("claim not found")
	}

	claim.Status = newStatus
	claim.ReviewedBy = &staffID
	claim.ReviewNote = note

	if err := cf.db.Save(&claim).Error; err != nil {
		return err
	}

	if newStatus == models.ClaimStatusApproved {
		cf.db.Model(&models.Item{}).Where("id = ?", claim.ItemID).Update("is_locked", true)
	}

	if cf.notifier != nil {
		cf.notifier.Notify(observer.Event{
			Type:      observer.EventClaimUpdated,
			UserID:    claim.ClaimantID,
			Title:     "Trạng thái yêu cầu nhận đồ đã thay đổi",
			Message:   fmt.Sprintf("Yêu cầu nhận đồ #%d của bạn đã được chuyển thành %s", claim.ID, newStatus),
			RelatedID: claim.ID,
		})
	}

	return nil
}

func (cf *ClaimFacade) Handover(claimID uint, staffID uint, recipientName string, recipientStudentID string, location string, notes string) (*models.HandoverRecord, error) {
	var claim models.Claim
	if err := cf.db.Preload("Item").First(&claim, claimID).Error; err != nil {
		return nil, errors.New("claim not found")
	}

	var record models.HandoverRecord
	err := cf.db.Transaction(func(tx *gorm.DB) error {
		claim.Status = models.ClaimStatusCompleted
		claim.ReviewedBy = &staffID
		if err := tx.Save(&claim).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.Item{}).Where("id = ?", claim.ItemID).Updates(map[string]interface{}{
			"status":    models.ItemStatusReturned,
			"is_locked": true,
		}).Error; err != nil {
			return err
		}

		name := recipientName
		if name == "" {
			var claimant models.User
			if err := tx.First(&claimant, claim.ClaimantID).Error; err == nil {
				name = claimant.Name
			}
		}

		studentID := recipientStudentID
		if studentID == "" {
			var claimant models.User
			if err := tx.First(&claimant, claim.ClaimantID).Error; err == nil {
				studentID = claimant.StudentID
			}
		}

		record = models.HandoverRecord{
			ClaimID:            claim.ID,
			ItemID:             claim.ItemID,
			RecipientID:        claim.ClaimantID,
			RecipientName:      name,
			RecipientStudentID: studentID,
			StaffID:            staffID,
			HandoverDate:       time.Now(),
			HandoverLocation:   location,
			Notes:              notes,
		}

		if err := tx.Create(&record).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if cf.notifier != nil {
		cf.notifier.Notify(observer.Event{
			Type:      observer.EventClaimUpdated,
			UserID:    claim.ClaimantID,
			Title:     "Bàn giao tài sản hoàn tất",
			Message:   fmt.Sprintf("Vật phẩm #%d đã được bàn giao thành công!", claim.ItemID),
			RelatedID: claim.ID,
		})
	}

	return &record, nil
}
