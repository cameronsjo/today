#!/usr/bin/env bash
# Push site/ to the gh-pages branch as a single fresh commit. Today's page is
# the site root, and every edition is also kept at archive/YYYY-MM-DD/, carried
# forward from the branch each time, so the branch holds no history but the
# archive keeps growing (about 250 KB a day).
set -euo pipefail

: "${PAGES_REPO:?set PAGES_REPO, e.g. cameronsjo/ai-newtab}"
: "${DEPLOY_KEY_B64:?set DEPLOY_KEY_B64 to a base64-encoded deploy key with write access}"

key=$(mktemp)
trap 'rm -f "$key"' EXIT
printf '%s' "$DEPLOY_KEY_B64" | base64 -d > "$key"
chmod 600 "$key"
# GitHub's published host keys, so the first connection can't be intercepted.
export GIT_SSH_COMMAND="ssh -i $key -o IdentitiesOnly=yes -o UserKnownHostsFile=$(dirname "$0")/github_known_hosts -o StrictHostKeyChecking=yes"

remote="${PAGES_REMOTE:-git@github.com:${PAGES_REPO}.git}"
site="${SITE_DIR:-/app/site}"
today=$(date +%F)

# Carry the archive forward, and archive the edition being replaced under the
# date it was built, so an edition is kept even if its own publish predates this.
prev=$(mktemp -d)
trap 'rm -f "$key"; rm -rf "$prev"' EXIT
if git clone -q --depth 1 --branch gh-pages "$remote" "$prev" 2>/dev/null; then
  [ -d "$prev/archive" ] && cp -R "$prev/archive" "$site/"
  built=$(grep -o '<meta name="built-at" content="[0-9-]*' "$prev/index.html" 2>/dev/null | grep -o '[0-9]\{4\}-[0-9-]*$' || true)
  if [ -n "$built" ] && [ "$built" != "$today" ] && [ ! -d "$site/archive/$built" ]; then
    mkdir -p "$site/archive/$built"
    cp "$prev/index.html" "$prev/homepage.js" "$site/archive/$built/" 2>/dev/null || true
  fi
fi
mkdir -p "$site/archive/$today"
cp "$site/index.html" "$site/homepage.js" "$site/archive/$today/"

# The archive index (each edition with its lead headline), and archived pages
# pointed back at the root's icons and manifest.
bun "$(dirname "$0")/../harness/archive-index.ts" "$site"

cd "$site"
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git -c user.name="newtab-builder" -c user.email="newtab-builder@users.noreply.github.com" \
  add -A
git -c user.name="newtab-builder" -c user.email="newtab-builder@users.noreply.github.com" \
  commit -q -m "Homepage for $(date +%F)"
git push -q --force "$remote" gh-pages
rm -rf .git
