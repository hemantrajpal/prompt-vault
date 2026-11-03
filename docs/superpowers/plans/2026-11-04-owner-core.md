# Prompt Vault Reliable Owner Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a plan, not authorization for production cutover.

**Goal:** Preserve existing data and deliver owner-guarded, recoverable prompt storage with a truthful save flow.

**Architecture:** Preserve Apps Script and vanilla UI. Normalize entities into immutable staged revisions; verified committed operation manifests define visibility, and current-head tables are rebuildable projections. Separate pure validation from Google services and test every partial-write boundary.

**Tech Stack:** Existing V8 `.gs`/HTML, Google Sheets API RAW writes, LockService, Node built-in test runner/VM, installed Playwright for the local canonical-source fixture. At execution select and pin a supported local Node LTS; no product framework migration.

**Spec:** [Owner Edition design](../specs/2026-11-04-owner-edition-design.md), [UI contract](../specs/2026-11-04-owner-edition-ui.md). Exact shared records and public signatures live in the spec and apply throughout.

## Global Constraints

- One configured owner; blank/missing/wrong identity denies; no effective-user fallback.
- Maintain `src/` only; preserve historical copies and pre-existing uncommitted work.
- RAW literal text, server-controlled IDs/ownership/timestamps, archive/restore, no permanent deletion UI.
- Preserve original data until backup and clone migration/restore evidence passes.
- AI/images disabled in core; no provider call or Drive sharing by default.
- Follow spec limits: 500 prompt heads, 100 categories, 40,000-character snapshot, 5 MiB bundle, 32 variables, 5-second lock timeout.
- Mocks prove logic; real disposable tests prove account behavior and Google service persistence. Do not substitute one for the other.

## Review Focus

1. Empty/mismatched caller identity and direct legacy RPC calls: denied before service access (Task 1).
2. Markup, formula-like text and regex/replacement metacharacters: exact inert round trips (Tasks 2–3; UI plan Task 2).
3. Timeout after staging/commit or lost acknowledgement: same-ID retry returns one outcome and no partial heads (Task 4).
4. Migration of notes, negative prompts, ownership, dates, subcategories and malformed variables: preserved or explicitly quarantined (Task 6).
5. Import preview expires/changes and interrupted multi-record work: no partial visibility or unreviewed overwrite (Task 6).

## Planned files

Create `Auth.gs`, `Schema.gs`, `Storage.gs`, `Recovery.gs`, `ImportExport.gs`, `appsscript.json`, `_Api.html`, `_Core.html`, `_UI.html` in `src/`. Modify existing Code/Sheets/Setup/AI/Drive and HTML includes. Tests in `tests/owner-edition/`; scripts in `scripts/`; evidence in ignored `artifacts/owner-edition/`. Plain documentation in `docs/owner-edition/`. Do not write real owner credentials or Sheet IDs into fixtures, tracked evidence or plans.

### Task 0: Preserve the baseline and make checks reproducible

**Files:** Create `scripts/baseline.mjs`, `tests/owner-edition/helpers/load-gas.mjs`, `tests/owner-edition/helpers/fake-sheets.mjs`, `tests/owner-edition/baseline.test.mjs`, `docs/owner-edition/BASELINE.md`; modify root `.gitignore`, `package.json`; retain existing unrelated ignore rules.

**Interfaces:** `loadGas(files,services)` loads named `.gs` files in an isolated VM. Fake services expose row reads/writes, call logs and `failAt(writeNumber)` including failure-before and response-loss-after application. `baseline.mjs --out <directory>` excludes dependencies/Git/`._*`, records hashes/modes and copies authored source without altering originals.

- [ ] Write `baseline.test.mjs` asserting both source trees are captured independently and `._*` is ignored; fake-service test asserts after-application failure keeps the applied row.
- [ ] Run `node --test tests/owner-edition/baseline.test.mjs`; expect failing missing helpers, then implement the helpers and script until green.
- [ ] Preserve source to a private artifact directory; document deployed-source provenance as known/unknown with exact evidence. Do not mistake current HEAD or the old mock preview for installed source.
- [ ] Add named scripts `test:owner` (`node --test tests/owner-edition/*.test.mjs`) and later `test:browser`; make the existing dependency manifest trackable by removing only exact `package.json`/`package-lock.json` ignore entries. Pin tooling during execution, preserve existing dependency requirements and do not copy media dependencies into product runtime.
- [ ] Obtain raw data export/clone restore evidence before any migration task; absent access is a recorded live gate. Review named-file diff and commit only this task's authored files, never baseline backups or secrets. Suggested commit: `chore: preserve owner edition baseline and test harness`.

**Done:** repeatable local test entrypoint and recoverable source baseline; no existing code/data reset.

### Task 1: Close every server access boundary

**Files:** Create `src/Auth.gs`, `tests/owner-edition/auth.test.mjs`, `tests/owner-edition/rpc-surface.test.mjs`, `docs/owner-edition/DEPLOYMENTS.md`; modify Code/Setup/Sheets/AI/Drive/Index and create core `src/appsscript.json`.

**Interfaces:** `requireOwner_(): Actor`; `rpc_(fn): RpcResult<T>`; `getSetupStatusV2(): RpcResult<SetupStatus>` with presence booleans only. All public names enumerated in a test-maintained allowlist; implementation functions end `_`.

- [ ] Write failing table tests: every public data/admin/integration RPC for `email:''`, wrong owner, missing OWNER_EMAIL and missing Sheet ID; assert denial and zero Google data/provider/Drive calls. Assert `include`/setup/debug/raw helpers are not public names. Existing temporary adapters must appear explicitly in the guarded allowlist. Pending-operation discovery in setup/vault responses must obey the same guard and expose metadata only.
- [ ] Run `node --test tests/owner-edition/auth.test.mjs tests/owner-edition/rpc-surface.test.mjs`; verify the current permissive code fails.
- [ ] Implement owner normalization and guards, remove all-property logging, make setup/helpers private, update `include_()` references atomically, disable AI/Drive RPCs after owner verification with FEATURE_DISABLED. Avoid ALLOWALL framing unless an explicit supported embedding requirement is documented; use the default framing protection.
- [ ] Declare only core email/Sheets scopes needed by the chosen RAW adapter and document how the Sheets advanced service is enabled. Do not retain provider/Drive scopes for disabled features. Record owner-only deployment/account matrix and denied-user tests on disposable install; never use a weaker identity fallback.
- [ ] Rerun tests and static callable inventory, verify no app data in denied config/errors, then review/commit named files (`fix: enforce owner checks across all server actions`).

**Done:** direct calls and page entry share the same deny-by-default owner boundary; live support matrix explicitly distinguishes tested/pending modes.

### Task 2: Remove executable rendering paths

**Files:** Create `src/_UI.html`, `tests/owner-edition/rendering.test.mjs`, `tests/owner-edition/fixtures/render-page.mjs`; modify Index/_Scripts and Code denial output.

**Interfaces:** `uiText(tag,text,attributes?)` creates nodes using textContent; `openDialog({title,content,actions,returnFocus})`; `validateColor_(hex)` accepts six-digit hex only; `validateReferenceUrl_(url)` allows HTTPS only and rejects credentials/data/javascript URLs. Static SVG icons are trusted local templates, not user strings.

- [ ] Add browser-backed rendering assertions for title/tag/category/model/variable labels containing `<img ...>`, quotes, backslashes and an invalid color/URL. Expected: exact visible text, no injected element/event, invalid metadata rejected. Enumerate each current innerHTML/inline-handler interpolation path, including archive/modals and model dropdown.
- [ ] Run `node --test tests/owner-edition/rendering.test.mjs`; establish a failure on unsafe metadata in the canonical source fixture.
- [ ] Replace user-derived innerHTML/inline handlers with DOM nodes/listeners across library, sidebar, pills, editor selects, model controls, categories, archive and dialogs; use safe denial-page rendering. All server-origin text and optional AI text use the same path. Preserve existing CSS classes for later styling.
- [ ] Ensure fixture renders canonical includes with fake transport and visible demo marking. Block automatic attachment fetches in the core; only validate/preserve reference URLs.
- [ ] Run rendering tests plus auth suite; verify app starts with external icons/fonts blocked, then review/commit (`fix: render vault content as inert text`).

**Done:** no untrusted value becomes executable HTML, CSS URL or inline JavaScript.

### Task 3: Establish the complete schema and literal storage adapter

**Files:** Create `src/Schema.gs`, `src/Storage.gs`, `tests/owner-edition/schema.test.mjs`, `tests/owner-edition/storage.test.mjs`; modify Setup/Sheets.

**Interfaces:** `validatePrompt_(input): {errors,warnings,value?}`; `validateCategory_(input)`; `canonicalJson_(value): string`; `digest_(value): string`; `writeRawRows_(sheetName,startRow,rows)`; `readRawRows_(sheetName)`; `withVaultLock_(fn)`; `ensureSchema_(): SetupReport`. Headers explicitly versioned in Schema, never inferred from arbitrary user keys. Define serialized operation/snapshot layouts from the spec before writes.

- [ ] Test schema field preservation, type/limit boundaries and unknown input fields. Test `ensureSchema_` twice against populated tabs: same values/counts after second call. Test RAW calls carry literal '=1+1', apostrophe, emoji, multiline and the correct `valueInputOption`.
- [ ] Run `node --test tests/owner-edition/schema.test.mjs tests/owner-edition/storage.test.mjs`; verify missing adapter/schema failures.
- [ ] Implement exact field mapper, stable category IDs, server-only owner/metadata, enum checks and size checks before writes. User-editable notes/negativePrompt exist in every category. Additive setup creates missing versioned tables/headers; incompatible existing schema returns recovery/migration guidance without clearing rows.
- [ ] Implement batch RAW adapter, lock acquire/release in finally, 5-second BUSY timeout and redacted quota/service errors. Require all storage table names to come from server constants, never UI sheet names.
- [ ] Rerun local tests; execute literal-value round trip on disposable Google Sheet and record exact comparison. Review/commit (`feat: add versioned literal storage schema`).

**Done:** repeated setup preserves data; every supported field has one definition and exact round-trip evidence.

### Task 4: Implement operation commit, idempotency and recovery

**Files:** Create `src/Recovery.gs`, `tests/owner-edition/recovery.test.mjs`, `tests/owner-edition/concurrency.test.mjs`; modify Storage/Sheets.

**Interfaces:** `prepareOperation_(actor,intent,operationId): Operation`; `advanceOperation_(operationId,maxEntities): OperationProgress`; `commitOperation_(operationId): Ack`; `recoverPending_(): RecoveryReport`; `readCommittedHeads_(): {vaultRevision,prompts,categories}`. Small ordinary operations use these same functions in one RPC; imports advance in chunks. Ack/public envelope follows the spec exactly.

- [ ] Write failure matrix across each write, including chunked intent before PREPARED, PREPARED row, each revision batch, COMMITTED marker and projections. Assert visible heads are the old set before commit or complete new set after commit, never a mixture. Include duplicate same-payload retries, changed-payload reuse, lost ack, invalid duplicate revision, stale base and lock timeout. A 500-entity operation must use chunked payload/manifest/ack storage with every cell <=40,000 characters.
- [ ] Run `node --test tests/owner-edition/recovery.test.mjs tests/owner-edition/concurrency.test.mjs`; expect failure until the protocol exists.
- [ ] Implement the six-step spec protocol and `_OperationPayloads` layout. Persist generated IDs/timestamps in intent before reuse; verify revision hashes before committing; choose latest valid committed entity heads by vault revision. Projection refresh is a repairable cache operation. Corrupt committed manifests block data operations with RECOVERY_REQUIRED. Generic recovery never advances/commits PREPARED imports; it verifies and reports progress while allowing reads/status/export/explicit advance/cancel.
- [ ] Add owner recovery/status diagnostics that reveal no source bodies or secrets by default; PREPARED validation failure becomes ABORTED and preserves old heads. Do not delete history or stage rows to pretend recovery succeeded.
- [ ] Rerun failure matrix and disposable live marker/response-loss drill. If single-marker persistence cannot be verified, document the failed gate and do not release. Review/commit (`feat: recover interrupted vault operations safely`).

**Done:** retries and interrupted writes have deterministic visible outcomes and independently recorded live evidence.

### Task 5: Prompt, category, archive and history lifecycle

**Files:** Modify `src/Sheets.gs`, `src/Code.gs`; create `tests/owner-edition/lifecycle.test.mjs`, `tests/owner-edition/history.test.mjs`.

**Interfaces:** All facade signatures from the spec: `getVaultV2`, save/move/archive/restore prompt, save/archive category, history and restore-version RPCs. Add `renameSubcategoryV2({operationId,categoryId,oldName,newName,expectedRevision})` and `removeSubcategoryV2({operationId,categoryId,name,replacement,expectedRevision})`; replacement is another existing subcategory or empty string, and affected prompts update within the same manifest.

- [ ] Test create→edit→move→archive→restore with notes, negativePrompt, variables, model, createdBy, provenance, original dates and ownership intact. Invalid destination rejects before any intent/write. Restore preserves creation metadata. History restore increases revision. Category/subcategory rename preserves all associations; category archive/move is all-or-nothing and rejects archived/missing destinations.
- [ ] Run `node --test tests/owner-edition/lifecycle.test.mjs tests/owner-edition/history.test.mjs`; verify current destructive/missing paths fail.
- [ ] Implement lifecycle through validated operation intents; no direct per-category body deletion/copy. Category archive requires an explicit promptPolicy; preserve original category IDs in history. Derive lists/tags/search from committed records only.
- [ ] Test stale revisions, double-submit, active/archived visibility, preserved titles containing quotes and maximum affected-record operation sizes. Every history lookup first verifies owner.
- [ ] Run complete owner suite, review facade allowlist and commit (`feat: preserve prompt lifecycle and revision history`).

**Done:** actual backend lifecycle has one recovery path and all observed rename/notes/restore loss cases are covered.

### Task 6: Export, staged import and clone migration

**Files:** Create `src/ImportExport.gs`, `tests/owner-edition/import-export.test.mjs`, `tests/owner-edition/migration.test.mjs`, `tests/owner-edition/fixtures/legacy-vault.json`, `docs/owner-edition/MIGRATION.md`, `docs/owner-edition/RESTORE.md`.

**Interfaces:** `exportVaultV2`, `previewImportV2`, `beginImportV2`, `advanceImportV2`, `getOperationV2`, `cancelImportV2`, `exportQuarantineV2({cursor,limit:25})` follow the spec. Private `exportLegacy_()` preserves raw tabs; `previewLegacyMigration_(snapshot)` returns field mapping/quarantine; clone-only `migrateLegacyClone_()` validates configured environment before writing. `exportHistoryV2({cursor,limit:25})` exports committed operations/payloads/revisions with a global manifest; private `restoreHistoryClone_(archive)` validates and restores only into an empty same-owner disposable clone, never through public import. `_Quarantine` stores durable chunked raw records/reasons and main exports expose their manifest. Export paging binds to a captured vault revision and rejects mixed-revision completion.

- [ ] Test exact current-head bundle round trip; empty vault; literal/formula-like strings; corrupt digest/schema; 5 MiB/500-record boundaries; foreign-owner adopt-as-copy with original provenance; duplicate IDs; expired 30-minute or stale previews; unknown fields; cancelled/interrupted 25-record chunks; old field aliases and missing/foreign owners/timestamps durably quarantined. Assert provenance survives edit/history/export/reimport and quarantine chunks reassemble to their original checksum. Bootstrap returns the owner's pending import after a fresh VM/client reload, without localStorage. Attachment references survive round trip while foreign/unavailable assets never become trusted file access.
- [ ] Run `node --test tests/owner-edition/import-export.test.mjs tests/owner-edition/migration.test.mjs`; verify unsupported paths fail first.
- [ ] Implement persistent chunked owner-bound preview/selection plus staging; selections enter payload digest; begin locks the original preview base, duplicate same-ID begin returns the existing progress instead of failing on its own pending operation. Other writes are BUSY while import is PREPARED. Generic recovery cannot advance it; only advanceImportV2 does. Final marker publishes all selected entities, cancel publishes none and is idempotent; committed work cannot be cancelled. Unstarted previews expire after 30 minutes; started operations remain owner-resumable after reopening. Export/download never includes properties/keys or staged revisions.
- [ ] Implement explicit legacy mapper for both variable shapes and bracket-invalid content. Preserve orphaned/unmapped data in quarantine export. Resolve category mapping before prompt staging and validate all foreign references; no silent merge, deletion, guessed owner or truncation.
- [ ] Run mocked interrupted-import/recovery suite, then migrate one disposable clone. Demonstrate current-head bundle import into a fresh clone and separately private full-history restore into an empty same-owner clone. Reject history archives in normal web import. Compare all supported fields, counts, creator/provenance, historical revision lookup and checksums; record quarantines and rollback source. Review/commit (`feat: add previewed import and verified clone migration`).

**Done:** portable recovery and migration evidence exist before any proposed production cutover.

### Task 7: Connect the client with truthful save and recovery states

**Files:** Create `src/_Api.html`, `src/_Core.html`; modify Index/_Scripts/_UI; create `tests/owner-edition/client-state.test.mjs`, `tests/owner-edition/browser-core.test.mjs`.

**Interfaces:** `vaultApi.call(method,payload): Promise<data>` unwraps RpcResult; `createSaveIntent(draft,baseRevision)` generates one client operationId per unchanged intent; `retrySave(intent)` reuses it; `loadVault()` hydrates committed records; `navigateWithDraftGuard(destination)` offers Stay/Discard. `appState={committed,draft,useInputs,requestState}`; `requestState` includes loading/ready/denied/saving/failed/conflict/recovering.

- [ ] Test failed/ambiguous save retains exact draft and unchanged committed library; same-intent retry keeps operationId; changed intent/new-copy receives a new ID. Missing config/load failure does not render empty data. Conflicts preserve both draft and latest head. Dirty navigation warns; successful saved ack supplies canonical returned record.
- [ ] Run `node --test tests/owner-edition/client-state.test.mjs tests/owner-edition/browser-core.test.mjs`; confirm existing optimistic state fails.
- [ ] Wire V2 RPCs, committed-only state updates and normalized errors. Disable duplicate submit; retain drafts on BUSY/QUOTA/network failure; add explicit download-draft action and unload warning where supported. No plaintext automatic draft/client-input localStorage.
- [ ] Route archive/category/history/import through acknowledged responses and reload verified heads on recovery; no user-facing operation IDs in primary flows. Keep old layout classes pending UI plan. Rebuild local demo from canonical includes with transport injection and no Google/AI/Drive calls.
- [ ] Run all local core tests and browser lifecycle, record disposable real create→refresh→edit→move→archive→restore evidence. Review/commit (`fix: acknowledge saved records and preserve failed drafts`).

**Done:** safe core works through real UI interactions, with failed and conflict paths reviewed; proceed to UI/workflow plan.

## Core release checkpoint

- [ ] Source/data baseline and two-clone restore recorded.
- [ ] Every exposed RPC guard tested; supported live owner configuration established.
- [ ] RAW exact text, commit marker and interrupted operations verified on disposable services.
- [ ] Ten full lifecycle cycles survive refresh and preserve every supported field.
- [ ] No unsafe metadata execution, public image upload, secret logging or permanent deletion path.
- [ ] Unmet live requirements remain explicitly pending and block distribution claims.
