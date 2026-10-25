# Script xem logs UniFind DNTU Local Production
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  UniFind DNTU - Realtime Logs            " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

docker compose logs -f
