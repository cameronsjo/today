#!/usr/bin/env bash
# Build and publish once a day at BUILD_AT (container local time), and once at
# start when RUN_ON_START=true. A failed build leaves yesterday's page up.
set -uo pipefail

BUILD_AT="${BUILD_AT:-06:00}"

publish() {
  echo "[newtab] build started $(date -Is)"
  # Keep a copy of this build's output so a failure ping can say what went wrong.
  local log
  log=$(mktemp)
  # pipefail (set above) makes the tee pipeline fail when the build does.
  if { pnpm --silent site:build && bash /app/docker/publish-pages.sh; } 2>&1 | tee "$log"; then
    echo "[newtab] published $(date -Is)"
    # Web Push to the reader's devices; skips itself unless VAPID keys and PUSH_SUBSCRIPTIONS are set.
    bun /app/harness/push.ts "${SITE_DIR:-/app/site}" || true
  else
    echo "[newtab] build failed $(date -Is); the previous page stays up" >&2
    # NOTIFY_URL (an ntfy topic or any plain-text webhook) gets the end of the log.
    bun /app/harness/notify.ts "The Context: build failed, yesterday's page is still up" "$log" || true
  fi
  rm -f "$log"
}

if [[ "${RUN_ON_START:-false}" == "true" ]]; then publish; fi

while true; do
  now=$(date +%s)
  next=$(date -d "today ${BUILD_AT}" +%s)
  (( next <= now )) && next=$(date -d "tomorrow ${BUILD_AT}" +%s)
  echo "[newtab] next build $(date -d "@${next}" -Is)"
  sleep $(( next - now ))
  publish
done
