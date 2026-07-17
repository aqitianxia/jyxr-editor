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

## Initial scope

1. Open a MOD directory and read its manifest.
2. Index definitions and resources.
3. Validate content and report precise locations.
4. Edit JSON with structured forms and a source view.
5. Save changes atomically.
6. Add story graph and map canvas workflows after the foundation is stable.

## Branches

- `main` must remain runnable.
- Work is developed on short-lived `feat/*`, `fix/*`, or `codex/*` branches.
- There is no permanent development branch.

The legacy implementation remains archived in the game repository at
`archive/local-web-editor-20260717` and is reference material, not a migration
base.
