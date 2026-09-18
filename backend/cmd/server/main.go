package main

import (
	"log"
	"os"

	"unifind-dntu/internal/admin"
	"unifind-dntu/internal/auth"
	"unifind-dntu/internal/category"
	"unifind-dntu/internal/claim"
	"unifind-dntu/internal/database"
	"unifind-dntu/internal/item"
	"unifind-dntu/internal/location"
	"unifind-dntu/internal/matching"
	"unifind-dntu/internal/middleware"
	"unifind-dntu/internal/models"
	"unifind-dntu/internal/notification"
	"unifind-dntu/internal/patterns/facade"
	"unifind-dntu/internal/patterns/observer"
	"unifind-dntu/internal/report"
	"unifind-dntu/internal/user"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file found or error loading, using system environment variables")
	}

	// Fail-fast security validation
	if os.Getenv("PROXY_SECURITY_ENABLED") == "true" || os.Getenv("PROXY_SECURITY_ENABLED") == "1" {
		if os.Getenv("ORIGIN_PROXY_SECRET") == "" {
			log.Fatalf("[FATAL] PROXY_SECURITY_ENABLED is enabled, but ORIGIN_PROXY_SECRET is empty. Startup aborted.")
		}
		log.Println("[SECURITY] Proxy security enabled with X-Origin-Secret validation")
	}

	db := database.InitDB()
	database.SeedData(db)

	// Setup Observer Subject and Notification Observer
	notifier := &observer.Subject{}
	notifObserver := observer.NewNotificationObserver(db)
	notifier.Register(notifObserver)

	// Repositories and Services
	userAuthRepo := auth.NewUserRepository(db)
	authService := auth.NewAuthService(userAuthRepo)
	authHandler := auth.NewAuthHandler(authService)

	userRepo := user.NewUserRepository(db)
	userService := user.NewUserService(userRepo)
	userHandler := user.NewUserHandler(userService)

	itemRepo := item.NewItemRepository(db)
	itemService := item.NewItemService(itemRepo, notifier)
	itemHandler := item.NewItemHandler(itemService)

	claimFacade := facade.NewClaimFacade(db, notifier)
	claimRepo := claim.NewClaimRepository(db)
	claimHandler := claim.NewClaimHandler(claimFacade, claimRepo)

	matchingRepo := matching.NewMatchingRepository(db)
	matchingService := matching.NewMatchingService(matchingRepo)
	matchingHandler := matching.NewMatchingHandler(matchingService)

	notifRepo := notification.NewNotificationRepository(db)
	notifService := notification.NewNotificationService(notifRepo)
	notifHandler := notification.NewNotificationHandler(notifService)

	catRepo := category.NewCategoryRepository(db)
	catService := category.NewCategoryService(catRepo)
	catHandler := category.NewCategoryHandler(catService)

	locRepo := location.NewLocationRepository(db)
	locService := location.NewLocationService(locRepo)
	locHandler := location.NewLocationHandler(locService)

	adminRepo := admin.NewAdminRepository(db)
	adminService := admin.NewAdminService(adminRepo)
	adminHandler := admin.NewAdminHandler(adminService)

	reportRepo := report.NewReportRepository(db)
	reportService := report.NewReportService(reportRepo)
	reportHandler := report.NewReportHandler(reportService)

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	healthHandler := func(c *gin.Context) {
		dbStatus := "ok"
		if sqlDB, err := db.DB(); err != nil || sqlDB.Ping() != nil {
			dbStatus = "unavailable"
		}
		c.JSON(200, gin.H{
			"status":  "ok",
			"db":      dbStatus,
			"service": "UniFind DNTU Backend",
		})
	}
	r.GET("/health", healthHandler)
	r.GET("/api/health", healthHandler)

	apiV1 := r.Group("/api/v1")
	apiV1.Use(middleware.ProxySecretMiddleware())
	authMiddleware := middleware.AuthRequired()
	requireStaff := middleware.RequireRole(models.RoleStaff, models.RoleAdmin)
	requireStaffOrAdmin := middleware.RequireRole(models.RoleStaff, models.RoleAdmin)
	requireAdmin := middleware.RequireRole(models.RoleAdmin)

	authHandler.RegisterRoutes(apiV1, authMiddleware)
	userHandler.RegisterRoutes(apiV1, authMiddleware)
	itemHandler.RegisterRoutes(apiV1, authMiddleware)
	claimHandler.RegisterRoutes(apiV1, authMiddleware, requireStaff)
	matchingHandler.RegisterRoutes(apiV1, authMiddleware)
	notifHandler.RegisterRoutes(apiV1, authMiddleware)
	catHandler.RegisterRoutes(apiV1, authMiddleware, requireStaffOrAdmin)
	locHandler.RegisterRoutes(apiV1, authMiddleware, requireStaffOrAdmin)
	adminHandler.RegisterRoutes(apiV1, authMiddleware, requireAdmin)
	reportHandler.RegisterRoutes(apiV1, authMiddleware, requireAdmin)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[SERVER] Starting UniFind DNTU Backend on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[SERVER Fatal] Failed to start server: %v", err)
	}
}
