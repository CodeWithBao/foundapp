#!/bin/sh

# Shared protection for pre-commit and pre-push hooks.
# Input: one repository-relative path per line on stdin.

set -eu

blocked=0

is_protected_path() {
  path=$(printf '%s' "$1" | tr '\\' '/' | tr '[:upper:]' '[:lower:]')
  base=${path##*/}

  case "$path" in
    *.md|*.markdown|*.sql|*.dump|*.backup|*.db|*.sqlite|*.sqlite3|*.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|*.crt|*.cer|*.csv|*.xls|*.xlsx|*.doc|*.docx|*.apk)
      return 0
      ;;
    backups/*|*/backups/*|private/*|*/private/*|exports/*|*/exports/*|pgdata/*|*/pgdata/*|postgres-data/*|*/postgres-data/*)
      return 0
      ;;
  esac

  case "$base" in
    .env|.env.*|.cf-secrets.json|credentials.json|service-account*.json|*secret*.json|*secrets*.json)
      # Public templates are allowed; real environment and secret files are not.
      [ "$base" = ".env.example" ] && return 1
      return 0
      ;;
  esac

  return 1
}

while IFS= read -r file; do
  [ -z "$file" ] && continue
  if is_protected_path "$file"; then
    if [ "$blocked" -eq 0 ]; then
      echo "" >&2
      echo "[GIT BLOCKED] Phat hien file khong duoc commit/push:" >&2
    fi
    echo "  - $file" >&2
    blocked=1
  fi
done

if [ "$blocked" -ne 0 ]; then
  echo "" >&2
  echo "Quy tac: khong dua Markdown, secret, database dump, backup hoac du lieu quan trong len Git." >&2
  echo "Hay bo file khoi stage bang: git restore --staged <file>" >&2
  exit 1
fi

exit 0
