#!/usr/bin/env bash
# DingoBet dev session
# Usage: ./dev.sh [start|kill]

SESSION="dingobet"
ROOT="$HOME/Projects/dingobet"

if [ "$1" = "kill" ]; then
  tmux kill-session -t "$SESSION" 2>/dev/null && echo "Session '$SESSION' killed."
  exit 0
fi

# Don't start a new session if one already exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session '$SESSION' already exists. Attaching..."
  tmux attach-session -t "$SESSION"
  exit 0
fi

# Create session — window 1: root (git, misc)
tmux new-session -d -s "$SESSION" -n "root" -c "$ROOT"

# Window 2: API
tmux new-window -t "$SESSION" -n "api" -c "$ROOT/dingobet-api"
tmux send-keys -t "$SESSION:api" "pnpm dev" Enter

# Window 3: Web
tmux new-window -t "$SESSION" -n "web" -c "$ROOT/dingobet-web"
tmux send-keys -t "$SESSION:web" "pnpm dev" Enter

# Window 4: Docker logs
tmux new-window -t "$SESSION" -n "docker" -c "$ROOT"
tmux send-keys -t "$SESSION:docker" "docker compose up" Enter

# Focus the root window
tmux select-window -t "$SESSION:root"

tmux attach-session -t "$SESSION"
