# JYXR MOD Editor

`jyxr-editor` is the standalone authoring tool for JYXR MOD content.

## Repository boundary

- The editor owns authoring workflows, diagnostics, previews, and atomic file writes.
- The game repository owns runtime behavior and the canonical MOD format.
- Integration is based on versioned contracts: `mod.json`, JSON schemas, Story IR,
  validation rules, and resource reference conventions.
- The editor does not reference source directories from the game repository.
- The first release supports the current MOD format only. Legacy compatibility is
  outside the initial scope.

## Migrated baseline

The mature editor history has been imported from
`archive/local-web-editor-20260717`. The current migration branch includes the
existing character, item, shop, battle, martial arts, talent, sect, growth,
resource, story, and map workspaces together with their frontend tests.

The editor opens an external authoring workspace with this shape:

```text
workspace/
├── assets/
└── mods/
    └── <modId>/
        ├── mod.json
        └── data/
```

Run it with:

```bash
dotnet run --project src/Jyxr.ModEditor/Jyxr.ModEditor.csproj
```

Then open `http://localhost:5127` and choose the authoring workspace. Pass
`--workspace /absolute/path/to/workspace` only when a script should open one
workspace directly.

For a step-by-step Chinese user guide, see [docs/使用教程.md](docs/使用教程.md).

## Game compatibility contract

The game owns the canonical content types and exports them with
`tools/Game.EditorContractExporter`. The editor keeps the generated snapshot at
`src/Jyxr.ModEditor/Contracts/jyxr-content-contract.json`; it does not reference
game assemblies at runtime.

Run the full compatibility check against a local game workspace with:

```bash
./scripts/check-game-compatibility.sh /absolute/path/to/jyxr-android
```

The check fails when the game contract changed without a matching editor update,
when the editor form type lists drifted, when current base data violates the
contract, or when a text skill animation cannot resolve its atlas dependencies.

## Branches

- `main` must remain runnable.
- Work is developed on short-lived `feat/*`, `fix/*`, or `codex/*` branches.
- There is no permanent development branch.

The original game worktree remains untouched. Its editor-only history is now
reachable through the migration subtree, while `codex/editor-bootstrap`
retains the smaller rewrite as a rollback point.
