#!/usr/bin/env bash
# ============================================================
#  WisdomWave — Установка на Beget Shared Hosting
#  Версия: 1.0 | 2026-04-22
#  Использование: bash install.sh [--skip-seed] [--update]
# ============================================================

set -euo pipefail

# ─── Цвета вывода ────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${BLUE}▸${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗ ОШИБКА:${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }

# ─── Параметры запуска ────────────────────────────────────────
SKIP_SEED=false
UPDATE_MODE=false
for arg in "$@"; do
  case $arg in
    --skip-seed) SKIP_SEED=true ;;
    --update)    UPDATE_MODE=true ;;
  esac
done

# ─── Константы ───────────────────────────────────────────────
NODE_REQUIRED="20"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NVM_DIR="$HOME/.nvm"
NPM_PREFIX="$HOME/.npm-global"
LOG_FILE="$APP_DIR/logs/install.log"

mkdir -p "$APP_DIR/logs"
exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     WisdomWave — Установка на сервер      ║${NC}"
echo -e "${CYAN}║     $(date '+%Y-%m-%d %H:%M:%S')                   ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# ════════════════════════════════════════════
step "1. Проверка окружения"
# ════════════════════════════════════════════

# Проверка наличия .env
if [ ! -f "$APP_DIR/.env" ]; then
  err "Файл .env не найден в $APP_DIR\nСкопируйте .env.example в .env и заполните все переменные.\nПодробнее: docs/DEPLOY.md раздел 5"
fi
ok "Файл .env найден"

# Проверка обязательных переменных в .env
REQUIRED_VARS=(
  "NEXTAUTH_URL" "NEXTAUTH_SECRET" "AUTH_SECRET" "AUTH_TRUST_HOST"
  "DATABASE_URL" "REDIS_URL"
  "NEXT_PUBLIC_APP_URL"
)
missing=()
for var in "${REQUIRED_VARS[@]}"; do
  val=$(grep -E "^${var}=" "$APP_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -z "$val" ] || echo "$val" | grep -qE "^(СЛУЧАЙНАЯ|ПАРОЛЬ|ВАШ_|ПОЛЬЗОВАТЕЛЬ)"; then
    missing+=("$var")
  fi
done
if [ ${#missing[@]} -gt 0 ]; then
  err "Не заполнены обязательные переменные в .env:\n$(printf '  - %s\n' "${missing[@]}")"
fi
ok "Обязательные переменные .env заполнены"

# ════════════════════════════════════════════
step "2. Node.js"
# ════════════════════════════════════════════

install_nvm() {
  info "Устанавливаю nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  ok "nvm установлен"
}

# Загрузить nvm если есть
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

if ! command -v node &>/dev/null; then
  warn "Node.js не найден — устанавливаю через nvm"
  install_nvm
  nvm install "$NODE_REQUIRED"
  nvm alias default "$NODE_REQUIRED"
  nvm use default
elif [ "$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')" -lt "$NODE_REQUIRED" ]; then
  warn "Node.js $(node --version) — нужна версия $NODE_REQUIRED+. Обновляю через nvm..."
  [ ! -s "$NVM_DIR/nvm.sh" ] && install_nvm
  nvm install "$NODE_REQUIRED"
  nvm alias default "$NODE_REQUIRED"
  nvm use default
fi

ok "Node.js $(node --version)"
ok "npm $(npm --version)"

# ════════════════════════════════════════════
step "3. PM2"
# ════════════════════════════════════════════

# Настроить npm prefix без sudo
if [ ! -d "$NPM_PREFIX" ]; then
  mkdir -p "$NPM_PREFIX"
  npm config set prefix "$NPM_PREFIX"

  # Добавить в PATH если нет
  SHELL_RC="$HOME/.bashrc"
  [ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"
  if ! grep -q "NPM_PREFIX" "$SHELL_RC" 2>/dev/null; then
    echo '' >> "$SHELL_RC"
    echo '# npm global без sudo' >> "$SHELL_RC"
    echo "export PATH=\"$NPM_PREFIX/bin:\$PATH\"" >> "$SHELL_RC"
  fi
  export PATH="$NPM_PREFIX/bin:$PATH"
fi
export PATH="$NPM_PREFIX/bin:$PATH"

if ! command -v pm2 &>/dev/null; then
  info "Устанавливаю PM2..."
  npm install -g pm2 2>&1 | tail -3
fi
ok "PM2 $(pm2 --version)"

# ════════════════════════════════════════════
step "4. Зависимости проекта"
# ════════════════════════════════════════════

cd "$APP_DIR"

if [ "$UPDATE_MODE" = true ]; then
  info "Режим обновления — git pull..."
  git pull origin main
fi

info "npm ci (установка пакетов)..."
npm ci 2>&1 | tail -5
ok "Зависимости установлены"

# ════════════════════════════════════════════
step "5. Prisma — генерация клиента"
# ════════════════════════════════════════════

info "npx prisma generate..."
npx prisma generate 2>&1 | tail -5
ok "Prisma client сгенерирован"

# ════════════════════════════════════════════
step "6. База данных — миграции"
# ════════════════════════════════════════════

info "Применяю миграции..."
DB_URL=$(grep -E "^DATABASE_URL=" "$APP_DIR/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")
DATABASE_URL="$DB_URL" npx prisma migrate deploy 2>&1
ok "Миграции применены"

# ════════════════════════════════════════════
step "7. Начальные данные (seed)"
# ════════════════════════════════════════════

if [ "$SKIP_SEED" = false ]; then
  info "Запускаю seed..."
  DATABASE_URL="$DB_URL" npx prisma db seed 2>&1 && ok "Seed выполнен" || warn "Seed пропущен (данные уже есть или ошибка)"
else
  info "Seed пропущен (флаг --skip-seed)"
fi

# ════════════════════════════════════════════
step "8. Сборка Next.js"
# ════════════════════════════════════════════

info "npm run build (займёт 1–3 минуты)..."
npm run build 2>&1 | tail -10
ok "Сборка завершена"

# ════════════════════════════════════════════
step "9. Запуск через PM2"
# ════════════════════════════════════════════

mkdir -p "$APP_DIR/logs"

if pm2 list | grep -q "eduplatform"; then
  info "PM2: перезапускаю существующий процесс..."
  pm2 reload ecosystem.config.js --update-env 2>&1 | tail -5
  ok "PM2 процесс перезапущен"
else
  info "PM2: запускаю впервые..."
  pm2 start ecosystem.config.js 2>&1 | tail -5
  ok "PM2 процесс запущен"
fi

pm2 save
ok "Конфигурация PM2 сохранена"

# ════════════════════════════════════════════
step "10. Автозапуск через cron (Beget Shared)"
# ════════════════════════════════════════════

# На Beget Shared нет systemd — используем @reboot в crontab
PM2_BIN=$(which pm2)
CRON_CMD="@reboot export NVM_DIR=\"$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"; export PATH=\"$NPM_PREFIX/bin:\$PATH\"; sleep 10 && $PM2_BIN resurrect"

if crontab -l 2>/dev/null | grep -q "pm2 resurrect"; then
  ok "Автозапуск PM2 уже настроен в crontab"
else
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  ok "Автозапуск PM2 добавлен в crontab (@reboot)"
fi

# ════════════════════════════════════════════
step "11. Проверка"
# ════════════════════════════════════════════

sleep 5

# Определить порт из .env или использовать 3000
APP_PORT=$(grep -E "^PORT=" "$APP_DIR/.env" 2>/dev/null | cut -d= -f2 || echo "3000")

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/" 2>/dev/null | grep -q "200"; then
  ok "Сайт отвечает на http://localhost:${APP_PORT}/"
else
  warn "Сайт не отвечает на порту $APP_PORT — проверьте: pm2 logs"
fi

pm2 status

# ════════════════════════════════════════════
step "Готово!"
# ════════════════════════════════════════════

APP_URL=$(grep -E "^NEXTAUTH_URL=" "$APP_DIR/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Установка завершена!             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Сайт:     ${CYAN}${APP_URL}${NC}"
echo -e "  Локально: ${CYAN}http://localhost:${APP_PORT}${NC}"
echo ""
echo -e "  Тестовые аккаунты (только если запускался seed):"
echo -e "  ${YELLOW}admin${NC}    admin@eduplatform.ru  / admin123"
echo -e "  ${YELLOW}teacher${NC}  teacher@eduplatform.ru / teacher123"
echo -e "  ${YELLOW}student${NC}  student@eduplatform.ru / student123"
echo ""
echo -e "  Лог установки: ${CYAN}$LOG_FILE${NC}"
echo ""
echo -e "  Полезные команды:"
echo -e "  ${BLUE}pm2 status${NC}          — статус процессов"
echo -e "  ${BLUE}pm2 logs${NC}            — логи приложения"
echo -e "  ${BLUE}pm2 reload all${NC}      — горячий перезапуск"
echo -e "  ${BLUE}bash install.sh --update --skip-seed${NC} — обновление"
echo ""
