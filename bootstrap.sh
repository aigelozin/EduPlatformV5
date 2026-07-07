#!/usr/bin/env bash
# ============================================================
#  WisdomWave — Первичная установка на Beget одной командой
#
#  Использование:
#    bash <(curl -fsSL https://raw.githubusercontent.com/aigelozin/EduPlatformV5/main/bootstrap.sh)
#
#  Или после git clone:
#    bash bootstrap.sh
# ============================================================

set -euo pipefail

REPO_URL="https://github.com/aigelozin/EduPlatformV5.git"
DEFAULT_DIR="$HOME/anandayoga.ru"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${BLUE}▸${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗ ОШИБКА:${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     WisdomWave — Установка на Beget              ║${NC}"
echo -e "${CYAN}║     github.com/aigelozin/EduPlatformV5           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Проверка git ────────────────────────────────────────────
command -v git &>/dev/null || err "git не установлен. На Beget git всегда доступен — что-то не так."

# ─── Директория установки ─────────────────────────────────────
echo -e "  Куда установить сайт?"
echo -ne "  Директория ${YELLOW}[${DEFAULT_DIR}]${NC}: "
read -r INPUT_DIR
INSTALL_DIR="${INPUT_DIR:-$DEFAULT_DIR}"

# ─── Клонирование или обновление ──────────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
  warn "Директория $INSTALL_DIR уже содержит git-репозиторий"
  echo -ne "  Обновить код из GitHub и продолжить? [Y/n]: "
  read -r CONFIRM
  CONFIRM="${CONFIRM:-Y}"
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 0
  fi
  info "Получаю обновления из GitHub..."
  git -C "$INSTALL_DIR" fetch --all --prune
  git -C "$INSTALL_DIR" reset --hard origin/main
  ok "Код обновлён до последней версии"
elif [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
  warn "Директория $INSTALL_DIR существует и не пустая, но не является git-репозиторием"
  echo -ne "  Продолжить установку в ней? [y/N]: "
  read -r CONFIRM
  [[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Отменено."; exit 0; }
  if ! git -C "$INSTALL_DIR" remote get-url origin &>/dev/null; then
    info "Клонирую в существующую директорию..."
    git clone "$REPO_URL" "$INSTALL_DIR.tmp"
    cp -r "$INSTALL_DIR.tmp/." "$INSTALL_DIR/"
    rm -rf "$INSTALL_DIR.tmp"
    ok "Код скопирован"
  fi
else
  info "Клонирую репозиторий в $INSTALL_DIR ..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  ok "Репозиторий клонирован"
fi

# ─── Запуск установщика ───────────────────────────────────────
cd "$INSTALL_DIR"

if [ ! -f "install.sh" ]; then
  err "Файл install.sh не найден в $INSTALL_DIR — клонирование не завершилось?"
fi

chmod +x install.sh

echo ""
echo -e "${GREEN}Репозиторий готов. Запускаю установщик...${NC}"
echo ""

bash install.sh "$@"
