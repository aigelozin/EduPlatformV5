#!/usr/bin/env bash
# ============================================================
#  WisdomWave — Установка на Beget Shared Hosting
#  Версия: 3.0 | 2026-07-08
#
#  Первая установка:
#    bash <(curl -fsSL https://raw.githubusercontent.com/aigelozin/EduPlatformV5/main/bootstrap.sh)
#
#  Или вручную после git clone:
#    bash install.sh
#
#  Флаги:
#    --skip-seed   Пропустить seed (повторная установка, данные уже есть)
#    --update      git pull + пересборка (без seed)
#    --reset       Полный сброс: npm ci, migrate, seed, build, restart
#    --no-wizard   Пропустить wizard (используется .env как есть)
# ============================================================

set -euo pipefail

# ─── Цвета вывода ────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

ok()      { echo -e "${GREEN}✓${NC} $1"; }
info()    { echo -e "${BLUE}▸${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
err()     { echo -e "${RED}✗ ОШИБКА:${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }
label()   { echo -e "${MAGENTA}${BOLD}$1${NC}"; }
hint()    { echo -e "  ${YELLOW}↳ $1${NC}"; }

# ─── Параметры запуска ────────────────────────────────────────
SKIP_SEED=false
UPDATE_MODE=false
RESET_MODE=false
NO_WIZARD=false
for arg in "$@"; do
  case $arg in
    --skip-seed) SKIP_SEED=true ;;
    --update)    UPDATE_MODE=true; SKIP_SEED=true ;;
    --reset)     RESET_MODE=true ;;
    --no-wizard) NO_WIZARD=true ;;
  esac
done

# ─── Константы ───────────────────────────────────────────────
NODE_REQUIRED="20"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NVM_DIR="$HOME/.nvm"
NPM_PREFIX="$HOME/.npm-global"
ENV_FILE="$APP_DIR/.env"
LOG_FILE="$APP_DIR/logs/install.log"

mkdir -p "$APP_DIR/logs"

echo ""
MODE_LABEL="Установка"
[ "$UPDATE_MODE" = true ] && MODE_LABEL="Обновление"
[ "$RESET_MODE"  = true ] && MODE_LABEL="Полный сброс"

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     WisdomWave — ${MODE_LABEL} на сервере     ║${NC}"
echo -e "${CYAN}║     $(date '+%Y-%m-%d %H:%M:%S')                   ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# WIZARD — интерактивный сбор конфигурации
# ════════════════════════════════════════════════════════════════

# Функция: запросить значение у пользователя
# ask VAR "Подсказка" "значение по умолчанию" [secret]
ask() {
  local var="$1" prompt="$2" default="$3" secret="${4:-}"
  local current=""

  # Взять текущее значение из .env если есть
  if [ -f "$ENV_FILE" ]; then
    current=$(grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
  fi

  # Если текущее значение — заглушка, сбросить
  if echo "$current" | grep -qE "^(СЛУЧАЙНАЯ|ПАРОЛЬ|ВАШ_|ПОЛЬЗОВАТЕЛЬ|<|example|local$)"; then
    current=""
  fi

  local display_default="${current:-$default}"

  if [ -n "$secret" ]; then
    # Секретное поле — не показывать значение
    if [ -n "$current" ]; then
      echo -ne "  ${prompt} ${YELLOW}[уже задан, Enter чтобы оставить]${NC}: "
    else
      echo -ne "  ${prompt}: "
    fi
    read -rs input
    echo ""
  else
    if [ -n "$display_default" ]; then
      echo -ne "  ${prompt} ${YELLOW}[${display_default}]${NC}: "
    else
      echo -ne "  ${prompt}: "
    fi
    read -r input
  fi

  # Использовать введённое значение, или текущее, или дефолт
  local result="${input:-${current:-$default}}"
  eval "$var='$result'"
}

# Функция: записать/обновить переменную в .env
set_env() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    # Обновить существующую строку
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

# ─── Генерация секрета ────────────────────────────────────────
gen_secret() {
  python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null \
    || openssl rand -base64 32 2>/dev/null \
    || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 44 | head -n 1
}

if [ "$NO_WIZARD" = false ]; then

  # Проверить — нужен ли wizard (если .env уже полностью заполнен)
  WIZARD_NEEDED=false
  CRITICAL_VARS=("NEXTAUTH_URL" "DATABASE_URL" "REDIS_URL")
  for v in "${CRITICAL_VARS[@]}"; do
    val=$(grep -E "^${v}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
    if [ -z "$val" ] || echo "$val" | grep -qE "^(СЛУЧАЙНАЯ|ПАРОЛЬ|ВАШ_|example|localhost)"; then
      WIZARD_NEEDED=true
      break
    fi
  done

  if [ "$WIZARD_NEEDED" = true ] || [ ! -f "$ENV_FILE" ]; then

    step "Настройка конфигурации (.env)"
    echo ""
    echo -e "  Сейчас я задам вопросы для настройки сайта."
    echo -e "  Значения в ${YELLOW}[скобках]${NC} — текущие или рекомендуемые."
    echo -e "  Нажмите ${BOLD}Enter${NC} чтобы оставить текущее значение."
    echo -e "  Необязательные поля можно пропустить (Enter)."
    echo ""

    # Создать .env если нет
    [ ! -f "$ENV_FILE" ] && cp "$APP_DIR/.env.example" "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"

    # ── БЛОК 1: Основные настройки ───────────────────────────
    echo ""
    label "── Основные настройки ──────────────────────────────────"

    ask DOMAIN      "Домен сайта (без https://)" "anandayoga.ru"
    NEXTAUTH_URL="https://${DOMAIN}"
    NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
    set_env "NEXTAUTH_URL"         "$NEXTAUTH_URL"
    set_env "NEXT_PUBLIC_APP_URL"  "$NEXT_PUBLIC_APP_URL"
    set_env "AUTH_TRUST_HOST"      "true"
    ok "Домен: $NEXTAUTH_URL"

    # Генерировать секреты автоматически
    EXISTING_SECRET=$(grep -E "^NEXTAUTH_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
    if [ -z "$EXISTING_SECRET" ] || echo "$EXISTING_SECRET" | grep -qE "^(СЛУЧАЙНАЯ|local|change)"; then
      NEW_SECRET=$(gen_secret)
      set_env "NEXTAUTH_SECRET" "$NEW_SECRET"
      set_env "AUTH_SECRET"     "$NEW_SECRET"
      ok "Секретный ключ сгенерирован автоматически"
    else
      ok "Секретный ключ уже задан"
    fi

    # ── БЛОК 2: База данных ──────────────────────────────────
    echo ""
    label "── База данных MySQL (Beget) ────────────────────────────"
    hint "Данные из панели Beget → MySQL"

    ask DB_HOST "Хост MySQL" "localhost"
    ask DB_PORT "Порт MySQL" "3306"
    ask DB_NAME "Имя базы данных" "zinder_wisdomwave"
    ask DB_USER "Пользователь БД" "zinder_wisdomwave"
    ask DB_PASS "Пароль БД" "" "secret"

    if [ -z "$DB_PASS" ]; then
      warn "Пароль БД не задан — DATABASE_URL будет неполным"
    fi

    DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    set_env "DATABASE_PROVIDER" "mysql"
    set_env "DATABASE_URL"      "$DATABASE_URL"
    set_env "TEST_DATABASE_URL" "$DATABASE_URL"
    ok "DATABASE_URL настроен"

    # ── БЛОК 3: Redis ────────────────────────────────────────
    echo ""
    label "── Redis (Яндекс Managed Redis или другой) ─────────────"
    hint "Yandex Cloud → Managed Service for Redis → Подключение"
    hint "Формат: rediss://:ПАРОЛЬ@ХОСТ.mdb.yandexcloud.net:6380/0"
    hint "Для пропуска нажмите Enter (rate-limiting будет отключён)"

    ask REDIS_URL  "REDIS_URL" ""
    ask REDIS_PASS "Пароль Redis" "" "secret"

    if [ -n "$REDIS_URL" ]; then
      set_env "REDIS_URL"      "$REDIS_URL"
      set_env "REDIS_PASSWORD" "$REDIS_PASS"
      ok "Redis настроен"
    else
      warn "Redis пропущен — rate-limiting работать не будет"
      set_env "REDIS_URL"      "redis://localhost:6379/0"
      set_env "REDIS_PASSWORD" ""
    fi

    # ── БЛОК 4: Яндекс Object Storage ───────────────────────
    echo ""
    label "── Яндекс Object Storage (файлы и видео) ───────────────"
    hint "Yandex Cloud → Object Storage → Сервисный аккаунт → HMAC-ключ"

    ask YOS_KEY    "YOS Access Key ID" ""
    ask YOS_SECRET "YOS Secret Key" "" "secret"
    ask YOS_BUCKET_PRIVATE "Приватный бакет (для видео)" "wisdomwave-private"
    ask YOS_BUCKET_PUBLIC  "Публичный бакет (для обложек)" "wisdomwave-public"

    if [ -n "$YOS_KEY" ]; then
      set_env "YOS_ACCESS_KEY_ID"       "$YOS_KEY"
      set_env "YOS_SECRET_ACCESS_KEY"   "$YOS_SECRET"
      set_env "YOS_BUCKET_NAME"         "$YOS_BUCKET_PRIVATE"
      set_env "YOS_PUBLIC_BUCKET_NAME"  "$YOS_BUCKET_PUBLIC"
      set_env "YOS_ENDPOINT"            "https://storage.yandexcloud.net"
      set_env "YOS_REGION"              "ru-central1"
      set_env "NEXT_PUBLIC_YOS_PUBLIC_URL" "https://storage.yandexcloud.net/${YOS_BUCKET_PUBLIC}"
      ok "Яндекс Object Storage настроен"
    else
      warn "YOS пропущен — загрузка файлов не будет работать"
    fi

    # ── БЛОК 5: Платежи ──────────────────────────────────────
    echo ""
    label "── Платежи ──────────────────────────────────────────────"

    echo -e "  ${BOLD}YooKassa${NC} ${YELLOW}(yookassa.ru → Настройки магазина)${NC}"
    ask YOOKASSA_SHOP     "Shop ID" ""
    ask YOOKASSA_KEY      "Secret Key" "" "secret"
    ask YOOKASSA_WEBHOOK  "Webhook Secret (придумайте)" "$(gen_secret | cut -c1-20)"

    if [ -n "$YOOKASSA_SHOP" ]; then
      set_env "YOOKASSA_SHOP_ID"       "$YOOKASSA_SHOP"
      set_env "YOOKASSA_SECRET_KEY"    "$YOOKASSA_KEY"
      set_env "YOOKASSA_WEBHOOK_SECRET" "$YOOKASSA_WEBHOOK"
      ok "YooKassa настроена"
    else
      warn "YooKassa пропущена"
    fi

    echo ""
    echo -e "  ${BOLD}CryptoCloud${NC} ${YELLOW}(cryptocloud.plus → API)${NC}"
    ask CRYPTO_API   "API Key" ""
    ask CRYPTO_SHOP  "Shop ID" ""
    ask CRYPTO_KEY   "Secret Key" "" "secret"

    if [ -n "$CRYPTO_API" ]; then
      CRYPTO_WEBHOOK=$(gen_secret | cut -c1-20)
      set_env "CRYPTOCLOUD_API_KEY"        "$CRYPTO_API"
      set_env "CRYPTOCLOUD_SHOP_ID"        "$CRYPTO_SHOP"
      set_env "CRYPTOCLOUD_SECRET_KEY"     "$CRYPTO_KEY"
      set_env "CRYPTOCLOUD_WEBHOOK_SECRET" "$CRYPTO_WEBHOOK"
      ok "CryptoCloud настроен"
    else
      warn "CryptoCloud пропущен"
      # Задать заглушку чтобы webhook не падал с 500
      set_env "CRYPTOCLOUD_API_KEY"        "disabled"
      set_env "CRYPTOCLOUD_SHOP_ID"        "disabled"
      set_env "CRYPTOCLOUD_SECRET_KEY"     "disabled"
      set_env "CRYPTOCLOUD_WEBHOOK_SECRET" "$(gen_secret | cut -c1-20)"
    fi

    # ── БЛОК 6: Доставка ─────────────────────────────────────
    echo ""
    label "── Доставка (можно пропустить) ─────────────────────────"

    echo -e "  ${BOLD}CDEK${NC} ${YELLOW}(cdek.ru → Интеграция → API)${NC}"
    ask CDEK_ID     "Client ID" ""
    ask CDEK_SECRET "Client Secret" "" "secret"

    if [ -n "$CDEK_ID" ]; then
      set_env "CDEK_CLIENT_ID"     "$CDEK_ID"
      set_env "CDEK_CLIENT_SECRET" "$CDEK_SECRET"
      set_env "CDEK_API_URL"       "https://api.cdek.ru/v2"
      ok "CDEK настроен"
    else
      warn "CDEK пропущен"
      set_env "CDEK_CLIENT_ID"     "disabled"
      set_env "CDEK_CLIENT_SECRET" "disabled"
      set_env "CDEK_API_URL"       "https://api.cdek.ru/v2"
    fi

    echo ""
    echo -e "  ${BOLD}Boxberry${NC} ${YELLOW}(boxberry.ru → OpenAPI → Токен)${NC}"
    ask BOXBERRY_TOK "Токен" ""

    if [ -n "$BOXBERRY_TOK" ]; then
      set_env "BOXBERRY_TOKEN"   "$BOXBERRY_TOK"
      set_env "BOXBERRY_API_URL" "https://api.boxberry.ru/json.php"
      ok "Boxberry настроен"
    else
      warn "Boxberry пропущен"
      set_env "BOXBERRY_TOKEN"   "disabled"
      set_env "BOXBERRY_API_URL" "https://api.boxberry.ru/json.php"
    fi

    # ── БЛОК 7: Email ─────────────────────────────────────────
    echo ""
    label "── Email ────────────────────────────────────────────────"

    echo -e "  ${BOLD}SendPulse${NC} ${YELLOW}(sendpulse.com → API → Создать)${NC}"
    ask SP_USER   "API User ID" ""
    ask SP_SECRET "API Secret" "" "secret"

    if [ -n "$SP_USER" ]; then
      set_env "SENDPULSE_API_USER_ID" "$SP_USER"
      set_env "SENDPULSE_API_SECRET"  "$SP_SECRET"
      ok "SendPulse настроен"
    else
      warn "SendPulse пропущен — письма через SMTP"
      set_env "SENDPULSE_API_USER_ID" "disabled"
      set_env "SENDPULSE_API_SECRET"  "disabled"
    fi

    echo ""
    echo -e "  ${BOLD}SMTP (Beget)${NC} ${YELLOW}(Панель Beget → Почта → Создать ящик)${NC}"
    ask SMTP_FROM_ADDR "Email отправителя" "noreply@${DOMAIN}"
    ask SMTP_SUPPORT   "Email поддержки"   "support@${DOMAIN}"
    ask SMTP_USR       "Логин SMTP"        "noreply@${DOMAIN}"
    ask SMTP_PWD       "Пароль SMTP"       "" "secret"

    set_env "EMAIL_FROM"    "WisdomWave <${SMTP_FROM_ADDR}>"
    set_env "EMAIL_SUPPORT" "$SMTP_SUPPORT"
    set_env "SMTP_HOST"     "smtp.beget.com"
    set_env "SMTP_PORT"     "465"
    set_env "SMTP_USER"     "$SMTP_USR"
    set_env "SMTP_PASS"     "$SMTP_PWD"
    ok "SMTP настроен"

    # ── БЛОК 8: AI ────────────────────────────────────────────
    echo ""
    label "── AI (можно пропустить) ───────────────────────────────"

    echo -e "  ${BOLD}YandexGPT${NC} ${YELLOW}(cloud.yandex.ru → API-ключи)${NC}"
    ask YGPT_KEY    "API Key" ""
    ask YGPT_FOLDER "Folder ID" ""

    if [ -n "$YGPT_KEY" ]; then
      set_env "YANDEXGPT_API_KEY"   "$YGPT_KEY"
      set_env "YANDEXGPT_FOLDER_ID" "$YGPT_FOLDER"
      set_env "YANDEXGPT_MODEL"     "yandexgpt-lite"
      ok "YandexGPT настроен"
    else
      warn "YandexGPT пропущен"
      set_env "YANDEXGPT_API_KEY"   "disabled"
      set_env "YANDEXGPT_FOLDER_ID" "disabled"
      set_env "YANDEXGPT_MODEL"     "yandexgpt-lite"
    fi

    echo ""
    echo -e "  ${BOLD}Claude API${NC} ${YELLOW}(console.anthropic.com → API Keys)${NC}"
    ask ANTHROPIC_KEY "API Key" ""

    if [ -n "$ANTHROPIC_KEY" ]; then
      set_env "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"
      ok "Claude API настроен"
    else
      warn "Claude API пропущен (YandexGPT будет основным)"
      set_env "ANTHROPIC_API_KEY" "disabled"
    fi

    set_env "AI_CHAT_RATE_LIMIT_PER_HOUR" "100"

    # ── БЛОК 9: Бизнес-логика ─────────────────────────────────
    echo ""
    label "── Бизнес-логика ───────────────────────────────────────"

    ask FEE  "Комиссия платформы (%)" "20"
    ask DAYS "Напоминание о подписке (дней до окончания)" "3"
    set_env "PLATFORM_FEE_PERCENT"      "$FEE"
    set_env "SUBSCRIPTION_REMINDER_DAYS" "$DAYS"
    set_env "CRON_SECRET"               "$(gen_secret | cut -c1-20)"
    set_env "GLITCHTIP_ENVIRONMENT"     "production"
    ok "Бизнес-параметры сохранены"

    # ── Итог wizard ───────────────────────────────────────────
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Конфигурация сохранена в .env            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Для просмотра/редактирования: ${CYAN}nano ${ENV_FILE}${NC}"
    echo ""
    read -rp "  Продолжить установку? [Y/n]: " CONFIRM
    CONFIRM="${CONFIRM:-Y}"
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
      echo "Установка отменена. Запустите снова: bash install.sh"
      exit 0
    fi

  else
    ok ".env уже заполнен — wizard пропущен (используйте --no-wizard для принудительного пропуска)"
  fi
fi

# Перенаправить вывод в лог (после wizard — он должен быть интерактивным)
exec > >(tee -a "$LOG_FILE") 2>&1

# ════════════════════════════════════════════
step "1. Проверка .env"
# ════════════════════════════════════════════

[ ! -f "$ENV_FILE" ] && err "Файл .env не найден"
ok "Файл .env найден"

REQUIRED_VARS=("NEXTAUTH_URL" "NEXTAUTH_SECRET" "AUTH_SECRET" "AUTH_TRUST_HOST" "DATABASE_URL" "NEXT_PUBLIC_APP_URL")
missing=()
for var in "${REQUIRED_VARS[@]}"; do
  val=$(grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
  if [ -z "$val" ] || echo "$val" | grep -qE "^(СЛУЧАЙНАЯ|ПАРОЛЬ|ВАШ_|ПОЛЬЗОВАТЕЛЬ)"; then
    missing+=("$var")
  fi
done
if [ ${#missing[@]} -gt 0 ]; then
  err "Не заполнены переменные:\n$(printf '  - %s\n' "${missing[@]}")"
fi
ok "Обязательные переменные .env заполнены"

# ════════════════════════════════════════════
step "2. Node.js"
# ════════════════════════════════════════════

install_nvm() {
  info "Устанавливаю nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  ok "nvm установлен"
}

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

if ! command -v node &>/dev/null; then
  warn "Node.js не найден — устанавливаю через nvm"
  install_nvm
  nvm install "$NODE_REQUIRED"
  nvm alias default "$NODE_REQUIRED"
  nvm use default
elif [ "$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')" -lt "$NODE_REQUIRED" ]; then
  warn "Node.js $(node --version) устарел — нужна v${NODE_REQUIRED}+"
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

if [ ! -d "$NPM_PREFIX" ]; then
  mkdir -p "$NPM_PREFIX"
  npm config set prefix "$NPM_PREFIX"
  SHELL_RC="$HOME/.bashrc"
  [ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"
  if ! grep -q "npm-global" "$SHELL_RC" 2>/dev/null; then
    echo '' >> "$SHELL_RC"
    echo '# npm global без sudo' >> "$SHELL_RC"
    echo "export PATH=\"$NPM_PREFIX/bin:\$PATH\"" >> "$SHELL_RC"
  fi
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
  info "Режим обновления — git fetch + reset..."
  git fetch --all --prune
  git reset --hard origin/main
  ok "Код обновлён до origin/main"
fi

# Лимит памяти — важно для Beget Shared (ограниченная RAM)
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

info "npm ci..."
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

DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
info "Применяю миграции..."
DATABASE_URL="$DB_URL" npx prisma migrate deploy 2>&1
ok "Миграции применены"

# ════════════════════════════════════════════
step "7. Начальные данные (seed)"
# ════════════════════════════════════════════

if [ "$SKIP_SEED" = false ]; then
  info "Запускаю seed..."
  DATABASE_URL="$DB_URL" npx prisma db seed 2>&1 \
    && ok "Seed выполнен" \
    || warn "Seed пропущен (данные уже есть или ошибка)"
else
  info "Seed пропущен (флаг --skip-seed)"
fi

# ════════════════════════════════════════════
step "8. Сборка Next.js"
# ════════════════════════════════════════════

info "npm run build (1–3 минуты)..."
npm run build 2>&1 | tail -10
ok "Сборка завершена"

# ════════════════════════════════════════════
step "9. Запуск через PM2"
# ════════════════════════════════════════════

mkdir -p "$APP_DIR/logs"

if pm2 list | grep -q "eduplatform"; then
  if [ "$RESET_MODE" = true ]; then
    info "PM2: полная остановка и перезапуск (--reset)..."
    pm2 delete ecosystem.config.js 2>/dev/null || true
    pm2 start ecosystem.config.js 2>&1 | tail -5
    ok "PM2 процесс перезапущен с нуля"
  else
    info "PM2: горячая перезагрузка..."
    pm2 reload ecosystem.config.js --update-env 2>&1 | tail -5
    ok "PM2 процесс перезагружен"
  fi
else
  info "PM2: запускаю впервые..."
  pm2 start ecosystem.config.js 2>&1 | tail -5
  ok "PM2 процесс запущен"
fi

pm2 save
ok "Конфигурация PM2 сохранена"

# ════════════════════════════════════════════
step "10. Автозапуск через cron"
# ════════════════════════════════════════════

PM2_BIN=$(which pm2 || echo "$NPM_PREFIX/bin/pm2")
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
APP_PORT=$(grep -E "^PORT=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "3000")

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/" 2>/dev/null | grep -q "200"; then
  ok "Сайт отвечает на http://localhost:${APP_PORT}/"
else
  warn "Сайт не отвечает на порту $APP_PORT — проверьте: pm2 logs"
fi

pm2 status

# ════════════════════════════════════════════
step "Готово!"
# ════════════════════════════════════════════

APP_URL=$(grep -E "^NEXTAUTH_URL=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Установка завершена!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Сайт:     ${CYAN}${APP_URL}${NC}"
echo -e "  Локально: ${CYAN}http://localhost:${APP_PORT}${NC}"
echo ""
echo -e "  Тестовые аккаунты ${YELLOW}(если запускался seed)${NC}:"
echo -e "  ${YELLOW}admin${NC}    admin@eduplatform.ru   / admin123"
echo -e "  ${YELLOW}teacher${NC}  teacher@eduplatform.ru / teacher123"
echo -e "  ${YELLOW}student${NC}  student@eduplatform.ru / student123"
echo -e "  ${RED}→ Смените пароли после первого входа!${NC}"
echo ""
echo -e "  Лог установки: ${CYAN}${LOG_FILE}${NC}"
echo ""
echo -e "  Полезные команды:"
echo -e "  ${BLUE}pm2 status${NC}                           — статус"
echo -e "  ${BLUE}pm2 logs${NC}                             — логи"
echo -e "  ${BLUE}pm2 reload all${NC}                       — перезапуск"
echo -e "  ${BLUE}bash install.sh --update --skip-seed${NC}  — обновление"
echo ""
