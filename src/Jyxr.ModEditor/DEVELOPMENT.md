# JYXR JSON Editor Development Notes

This tool is a local content workbench for the selected `mods/<modId>/data` directory and root `assets`.
It should stay small, explicit, and content-author friendly.

## Current Scope

The editor currently focuses on task-oriented static content authoring and validation:

- Discover MODs from `mods/*/mod.json` and route reads/writes through the active MOD id.
- Browse and edit JSON files under the selected MOD data directory.
- Preview assets under root `assets`.
- Validate every JSON file without referencing the game source tree; domain-level
  validation uses the checked-in versioned contract exported by the game.
- Merge `.story` and paired `.story.json` files into one story document with a single writable source.
- Provide DSL, JSON, and read-only flow projections for story authoring.
- Build story flow projections from the current unsaved draft with neighborhood, group, file, and repository scopes.
- Provide contextual Story DSL completions from the current MOD content index.
- Reject JSON-to-DSL conversion unless JSON -> DSL -> JSON is structurally lossless.
- Build a lightweight client-side index from:
  - top-level `id` records
  - story `segments[].name`
  - `resources.json`
  - `characters.json`
- Provide generated form editing for top-level array JSON files.
- Provide a dialogue speaker portrait helper for creating basic speaker records.
- Provide a portrait checker for static speaker/avatar wiring issues.
- Provide dedicated character, map/event, growth, sect, item, shop, martial-skill, and resource workspaces.
- Keep startup demand-driven: load Monaco, assets, story graphs, and full validation only when the active workflow requires them.
- Use targeted list/detail rendering for the large character, item, and map workspaces.
- Resolve image fallbacks through a prebuilt basename index instead of scanning the asset list per record.
- Preserve unknown map fields while allowing the current map JSON to be validated and applied before the explicit file save.

It is not a Godot scene editor, PCK builder, external mod manager, or general filesystem editor.

Resource and asset semantics shared by workspaces live in `wwwroot/domain/resource-catalog.js`. Keep that module free of DOM and global editor state so its path resolution, group contracts, and conflict summaries remain testable with `npm test`.

Resource picker search, selection fallback, draft confirmation/cancellation, and directional navigation live in `wwwroot/domain/resource-picker.js`. Domain-specific pickers may keep different layouts, previews, and actions; they should reuse this kernel instead of duplicating search state rules.

Story document pairing, draft graph extraction, graph filtering, overview aggregation, and JSON round-trip comparison live in `wwwroot/domain/story-workspace.js`. Keep these operations independent of DOM and Cytoscape so they remain covered by `tests/story-workspace.test.js`.

The Cytoscape adapter lives in `wwwroot/ui/story-graph.js`. It is a read-only renderer: it may manage layout, focus, zoom, and selection, but it must not serialize graph state or rewrite story content.

Direct resource writes must use `Services/ResourceWritePolicy.cs` or an equally explicit preflight decision. A write flow must distinguish create, reuse, and conflict; complete validation before backups and writes; and use an expected-state token or expected old value when a confirmation and write are separate requests.

## Architecture

### Backend

`Program.cs` is a minimal ASP.NET Core app.

Important endpoints:

- `GET /api/contract`
  - Returns the game-owned content contract bundled with this editor build.
- `GET /api/workspace`
  - Returns the current workspace state and discovered MOD summaries; it also works before a workspace is open.
- `POST /api/workspace/open`
  - Validates and activates a workspace containing at least one `mods/<modId>/mod.json` plus `data/`.
- `POST /api/workspace/pick`
  - Opens the local operating system's directory picker when supported; path entry remains the fallback.
- `GET /api/data/files?modId=...`
  - Lists the selected MOD's `data/**/*.json`.
- `GET /api/data/file?path=...&modId=...`
  - Reads a JSON data file.
- `PUT /api/data/file?modId=...`
  - Formats and saves a JSON data file.
  - Creates a timestamped backup under the active MOD's `.jyxr-editor/backups`.
  - Runs full JSON-directory validation after save.
- `GET /api/validate?modId=...`
  - Separates JSON syntax, game contract, and resource dependency diagnostics.
  - Validates required content files and runtime polymorphic type values.
  - Deep-loads text skill-animation atlas dependencies before reporting them as previewable.
- `GET /api/story/graph?modId=...`
  - Builds a read-only story graph for the selected MOD.
  - Reports segment counts, grouped branches, entrypoints, edge diagnostics, and static story references.
- `POST /api/story/source/from-json`
  - Creates a `.story` source from a JSON-only story after the frontend lossless preflight succeeds.
  - Refuses to overwrite an existing source file.
  - Keeps the compiled `.story.json` synchronized and uses the existing backup/validation flow.
- `GET /api/static/portraits/check?modId=...`
  - Checks dialogue portrait wiring without modifying files.
  - Scans `characters.json`, `resources.json`, `story/*.story.json`, and root `assets/art`.
  - Reports missing portrait resources, missing image files, non-`512x512` images, PNG/JPG alpha issues, and story speakers that cannot resolve to a character.
- `GET /api/assets/files`
  - Lists files under root `assets`.
- `GET /api/assets/file?path=...`
  - Serves an asset for preview.
- `POST /api/static/speaker`
  - Adds a minimal dialogue speaker to `characters.json`.
  - Adds a portrait resource to `resources.json`.
  - Intended for NPC speakers like `清兵`, `内侍`, `红花会弟子`.

Path resolution must stay constrained to the project data/assets roots. Do not add arbitrary absolute path writes.
Workspace switching validates the next root before replacing the active root. The frontend reloads after a successful switch so no document or MOD state crosses workspace boundaries.

### Frontend

The frontend is plain HTML/CSS/JavaScript:

- `wwwroot/index.html`
  - Layout and inspector sections.
- `wwwroot/app.js`
  - Application orchestration, MOD switching, file loading, workspace composition, content index, and Monaco integration.
- `wwwroot/domain/story-workspace.js`
  - Pure story document, draft graph, filtering, aggregation, and JSON comparison rules.
- `wwwroot/ui/story-graph.js`
  - Lazy Cytoscape initialization and read-only graph interaction.
- `wwwroot/styles/stage12.css`
  - Story workspace layout and responsive desktop rules.
- `wwwroot/styles.css`
  - Legacy/base desktop tool styling while staged styles continue to migrate.

There is no frontend build step or npm runtime dependency. Cytoscape.js 3.34.0 and cytoscape-dagre 4.0.0 are vendored as ESM files under `wwwroot/vendor` with their licenses and loaded only when the flow view opens. New browser dependencies require the same explicit version, license, local vendoring, and lazy-loading discipline.

## Story Workspace Rules

- Keep `DSL / JSON / Flow` as the only story views. Do not reintroduce the removed form/card editor.
- A paired story document has exactly one writable source. DSL source compiles JSON; JSON-only source preserves JSON fields directly.
- Flow is a projection of the current draft. Never write node coordinates, zoom, scope, filters, or selection into MOD data.
- JSON-to-DSL conversion must pass `findJsonDifferences` after a full decompile/recompile round trip. Do not add a force-convert bypass.
- File scope is capped at 500 segment nodes. Large repositories must use neighborhood, group, or overview projections.
- Overview uses a force-directed layout with hidden edge labels and weighted aggregate edges. Segment-level flows use left-to-right Dagre layout.
- Desktop width below 1024px is out of scope unless product requirements change.

## MOD Package Policy

The project-maintained expansion package is `mods/jyxr-expansion`.

- Track `mods/jyxr-expansion/**` in git except `.pck` files and local system files.
- Keep other MODs, including an author/base package such as `mods/jyxr-base`, ignored by default.
- Treat `mods/jyxr-base` as read-only upstream/reference content when present.
- Use the editor MOD selector to inspect the author/base package, then switch to `jyxr-expansion` before editing project content.
- Current runtime still starts one selected MOD at a time. It does not yet merge author/base data with expansion data at runtime.
- Resource packs remain runtime assets: PCK files are referenced by `mod.json` but are not committed to git.

## Data Rules

### Dialogue portraits

Story dialogue does not directly specify a portrait. The runtime resolves it from the `speaker` field:

1. Match `speaker` against existing party/name roster.
2. Match `speaker` against `characters.json` by id or name.
3. Read the character `portrait`.
4. Resolve that portrait id through `resources.json`.
5. Load the asset from `assets/art`.

Example:

```json
{
  "id": "清兵",
  "name": "清兵",
  "portrait": "头像.清兵"
}
```

```json
{
  "id": "头像.清兵",
  "group": "头像",
  "value": "head/qingbing"
}
```

The asset should be:

```text
assets/art/head/qingbing.png
```

Current UI assumes head portraits are generally `512x512` PNGs. Transparent backgrounds are strongly preferred.

### Static speaker template

The speaker helper creates a minimal valid character:

- `level: 1`
- low stats
- empty skills
- empty equipment
- `arenaEnabled: false`

This is meant for dialogue display only. If an NPC later becomes recruitable or combat-capable, edit the generated record manually.

### Resources

`resources.json` values are resource ids, not necessarily full paths.

Examples:

- `头像.清兵 -> head/qingbing`
- `音乐.城市3 -> audio/...`
- `地图.塞外 -> ...`

The frontend tries to resolve these through `assets/art` or `assets/audio` for preview.

## Portrait Checker

The "头像检查" panel is intentionally read-only. It helps content authors find broken portrait chains before launching the game.

It checks:

- `characters.json` records that already have a `portrait` field.
- `resources.json` records where `group == "头像"`.
- Story dialogue and choice prompt speakers in `story/*.story.json`.
- PNG/JPG metadata for portrait image dimensions and alpha channel presence.

Known narrator speakers such as `旁白`, `系统`, `提示`, and `江湖传闻` are ignored because they normally do not need a portrait.

The checker should stay diagnostic. Do not make it auto-resize images or auto-edit JSON unless the user explicitly asks for a separate repair workflow.

## Current Pain Points

These are known rough edges in the tool:

- Advanced data intentionally exposes raw JSON only; schema-aware editing belongs in dedicated workspaces.
- Complex fields are still edited as raw JSON text.
- Story grouping and backend diagnostics are still heuristic and can over-report entryless segments as informational issues.
- Flow layout is intentionally read-only; direct visual graph editing is not supported.
- No static check for missing `log` clues in story segments.
- No batch image normalization for portraits.
- Save always formats the entire JSON file.
- The tool selects a MOD from `mods/*/mod.json`; each operation uses the current MOD id.
- Initial entry to a large workspace still creates every list row; list virtualization is not implemented yet.
- Data file summaries and the content index are rebuilt in the browser instead of being served from a cached backend digest.
- A save still refreshes broader indexes than the affected file requires.
- Story graph construction and diagnostics are demand-driven but not yet incremental by file or story group.
- `app.js` still imports every specialized workspace up front and retains orchestration and legacy workspace code that should move behind workspace-specific modules.
- The staged CSS files still reflect implementation history instead of final UI ownership boundaries.
- Browser-level smoke tests and explicit performance budgets are not part of automated verification yet.

## Recommended Next Steps

The current order is:

1. Add cached backend file digests/content summaries and refresh only indexes affected by a save.
2. Virtualize large record lists and establish browser-level smoke tests and performance budgets for workspace switching.
3. Split remaining workspace implementation out of `app.js` and lazy-load specialized workspaces from the router.
4. Make story graph loading and diagnostics incremental by file or story group.
5. Build the equipment random-affix workspace and review remaining static data only where a dedicated workflow is clearer than advanced JSON editing.
6. Clean up completed migration artifacts and reorganize staged CSS by stable UI ownership such as shell, maps, story, forms, and shared components.
7. Keep story follow-ups text-first: richer diagnostics, command documentation/hover, `log` clue checks, and author/base diffing. Do not add a second writable story model.

## Design Principles

- Keep game runtime code untouched for content-tool convenience.
- Prefer data/tool fixes over engine behavior changes.
- Preserve existing content files and make timestamped backups before automated writes.
- Avoid compatibility hacks; make the data clearer instead.
- Keep workflow local and inspectable.
- Favor explicit helper operations over hidden automatic edits.

## Verification

Light checks for tool work:

```bash
node --check src/Jyxr.ModEditor/wwwroot/app.js
cd src/Jyxr.ModEditor && npm test
dotnet build Jyxr.ModEditor.slnx --no-restore
```

Story UI changes must also be checked at 1024px and 1440px desktop widths. Confirm that the flow canvas is non-empty, the toolbar does not overflow, and the browser console has no errors.

Light checks for data work:

```bash
jq empty mods/jyxr-expansion/data/resources.json
jq empty mods/jyxr-expansion/data/characters.json
jq empty mods/jyxr-expansion/data/story/book-shujian.story.json
```

Full content validation can be run from the web tool with the "检查" button.
