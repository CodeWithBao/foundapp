# Script khởi động UniFind DNTU Local Production
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  UniFind DNTU - Starting Local Production " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

docker compose up -d --build

Write-Host "`nĐang kiểm tra trạng thái các containers..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker compose ps

Write-Host "`n[OK] Hệ thống đã sẵn sàng tại: http://localhost:8080" -ForegroundColor Green
Write-Host "Để mở ra Internet bằng Cloudflare Tunnel, hãy chạy lệnh sau ở terminal khác:" -ForegroundColor White
Write-Host "  cloudflared tunnel --url http://localhost:8080" -ForegroundColor Cyan
