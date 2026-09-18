# Script Sao lưu Cơ sở dữ liệu PostgreSQL cho UniFind DNTU (Docker)
param (
    [string]$BackupDir = "./backups"
)

$ErrorActionPreference = "Stop"

# Tạo thư mục sao lưu nếu chưa có
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir/unifind_db_backup_$Timestamp.sql"

Write-Host "[BACKUP] Dang tao ban sao luu PostgreSQL tu container unifind_postgres..." -ForegroundColor Cyan

# Thực thi pg_dump bên trong container postgres
docker exec -t unifind_postgres pg_dump -U unifind unifind_db > $BackupFile

if (Test-Path $BackupFile) {
    $FileSize = (Get-Item $BackupFile).Length / 1KB
    Write-Host "[SUCCESS] Sao luu thanh cong: $BackupFile ($([math]::Round($FileSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Sao luu thất bai!" -ForegroundColor Red
    exit 1
}
