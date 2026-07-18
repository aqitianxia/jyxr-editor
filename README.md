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
existing character, item, shop, martial arts, talent, sect, growth, resource,
story, and map workspaces together with their frontend tests.

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

## Branches

- `main` must remain runnable.
- Work is developed on short-lived `feat/*`, `fix/*`, or `codex/*` branches.
- There is no permanent development branch.

The original game worktree remains untouched. Its editor-only history is now
reachable through the migration subtree, while `codex/editor-bootstrap`
retains the smaller rewrite as a rollback point.
