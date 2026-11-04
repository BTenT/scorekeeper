#!/bin/sh
# Xcode Cloud runs this right after cloning. node_modules and the web app are
# not in git, but the Swift packages and the app bundle need them.
set -e

if ! command -v node >/dev/null 2>&1; then
  brew install node
fi

cd "${CI_PRIMARY_REPOSITORY_PATH:-$(dirname "$0")/../../..}"
npm ci
npm run build:native
