#!/usr/bin/env bash
set -euo pipefail

editor_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
game_root="${1:-/Users/zheng/jyxr-android}"
game_root="$(cd "$game_root" && pwd)"
contract="$editor_root/src/Jyxr.ModEditor/Contracts/jyxr-content-contract.json"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

dotnet run \
  --project "$game_root/tools/Game.EditorContractExporter/Game.EditorContractExporter.csproj" \
  -- "$temporary_directory/jyxr-content-contract.json" >/dev/null

if ! diff -u "$contract" "$temporary_directory/jyxr-content-contract.json"; then
  echo "The editor contract is older than the game contract." >&2
  echo "Regenerate it with Game.EditorContractExporter, then update the editor controls and tests." >&2
  exit 1
fi

JYXR_GAME_ROOT="$game_root" dotnet test "$editor_root/Jyxr.ModEditor.slnx" --logger "console;verbosity=minimal"
npm test --prefix "$editor_root/src/Jyxr.ModEditor"
