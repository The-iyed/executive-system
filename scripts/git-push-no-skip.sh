#!/usr/bin/env sh
# Runs real `git push` with -n/--no-verify stripped so the pre-push hook always runs.
# This script is invoked by the repo's alias.push.

tmp="/tmp/git-push-no-skip-$$"
trap 'rm -f "$tmp"' EXIT

for a in "$@"; do
  case "$a" in
    -n|--no-verify) ;;
    *) printf '%s\n' "$a" >> "$tmp" ;;
  esac
done

set --
while IFS= read -r line; do
  set -- "$@" "$line"
done < "$tmp"

exec git -c alias.push= push "$@"
