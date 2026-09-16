# Script dừng UniFind DNTU Local Production
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  UniFind DNTU - Stopping Containers       " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

docker compose down

Write-Host "`n[OK] Đã dừng toàn bộ dịch vụ." -ForegroundColor Green
