#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

# Trap any error, report the line and the failing command
error_exit() {
  echo "❌ Error on line $1: $2" >&2
  exit 1
}
trap 'error_exit ${LINENO} "${BASH_COMMAND}"' ERR

# Print usage and exit
usage() {
  echo "Usage: $0 [beta]" >&2
  exit 1
}

# Ensure required commands are available
for cmd in npm jq; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "❌ Required command '$cmd' not found." >&2; exit 1; }
done

# Determine release type
if [[ "${1:-}" == "beta" ]]; then
  RELEASE_TYPE="beta"
elif [[ -z "${1:-}" ]]; then
  RELEASE_TYPE="stable"
else
  echo "❌ Unknown release type: '$1'" >&2
  usage
fi

# Ensure package.json exists
if [[ ! -f package.json ]]; then
  echo "❌ package.json not found in $(pwd)" >&2
  exit 1
fi

# Function: fetch current version from registry
get_current_version() {
  if [[ "$RELEASE_TYPE" == "beta" ]]; then
    npm view . version --tag beta
  else
    npm view . version
  fi
}

# Function: bump patch and optionally add -beta
increment_version() {
  local ver=$1
  if ! [[ $ver =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-beta)?$ ]]; then
    echo "❌ Invalid version format: '$ver'" >&2
    exit 1
  fi
  local major=${BASH_REMATCH[1]}
  local minor=${BASH_REMATCH[2]}
  local patch=${BASH_REMATCH[3]}
  patch=$((patch + 1))

  if [[ "$RELEASE_TYPE" == "beta" ]]; then
    echo "${major}.${minor}.${patch}-beta"
  else
    echo "${major}.${minor}.${patch}"
  fi
}

# Main
echo "🔍 Release type: $RELEASE_TYPE"

current_version=$(get_current_version)
echo "🔍 Fetched current version: $current_version"

new_version=$(increment_version "$current_version")
echo "✨ New version: $new_version"

# Update package.json without creating a git tag
npm version "$new_version" --no-git-tag-version

# Build step (assumes you have a 'build' script)
if npm run build; then
  echo "✅ Build succeeded"
else
  echo "❌ Build failed" >&2
  exit 1
fi

# Publish
if [[ "$RELEASE_TYPE" == "beta" ]]; then
  npm publish --tag beta
else
  npm publish
fi

echo "🎉 Package published as $new_version"
