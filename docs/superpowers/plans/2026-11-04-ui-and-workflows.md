# Prompt Vault UI and Workflow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the styling and usability of every app screen, preserving the current identity, and make four workflows useful for repeated work.

**Architecture:** Reuse the canonical Apps Script HTML includes and V2 API from the owner-core plan. Keep safe DOM rendering and separate committed data, template drafts and transient use inputs. Apply one CSS token system across existing and added screens.

**Tech Stack:** Vanilla HTML/JavaScript/CSS, existing Lucide identity with pinned/local fallback icons, Google Fonts with system fallback, Node tests and installed Playwright. UI/UX Pro Max supplies usability/accessibility criteria, not a replacement visual style.

**Spec:** [UI specification](../specs/2026-11-04-owner-edition-ui.md), [Product/data contracts](../specs/2026-11-04-owner-edition-design.md).

## Global Constraints

- Keep charcoal/amber, square geometry, hard borders, restrained offset shadows, Space Grotesk/Inter and dark/light themes.
- No new frontend framework, no palette replacement, no glass/bento/gradient redesign.
- 16px mobile inputs/body, 44px interactive targets, 4.5:1 normal text contrast, visible focus and reduced motion.
- Every view has appropriate loading/empty/error states; no demo implies live storage.
- Filled facts and unsaved drafts are not automatically stored in browser/server history.
- Depends on core plan Task 7 for V2/API/state. Visual tokens/static fixtures may be prepared sooner; do not bypass unsettled data contracts.

## Review Focus

1. Empty optional vs required values and `$&`/`$1`/nested tokens: literal preview and honest copy (Task 2).
2. Network, clipboard and stale-save failures: retained input and visible recovery (Tasks 2–3).
3. Narrow viewport, keyboard-only and touch without hover: every primary action remains available (Tasks 1, 3, 7).
4. Imported long metadata and arbitrary category colors: readable, inert, wrapping layouts in both themes (Tasks 1, 7).
5. History/import/quarantine completeness: no omitted fields or misleading full-backup labels (Task 5).

## File map

Modify `src/Index.html`, `_Styles.html`, `_Scripts.html`, `_UI.html`, `_Core.html`. Reuse `_Api.html` from core. Add `content/schema.json`, `content/packs/website.json`, `content/candidates/{brand,shopify}.json`, `content/reviews/website.md`; add canonical `scripts/build-demo.mjs` and browser tests/helpers in `tests/owner-edition/`. Update `screenshots.mjs` to target the generated demo only after canonical parity is proved. Existing Preview/media remain historical until then.

### Task 1: Shared styling, responsive shell and navigation

**Files:** Modify Index/_Styles/_UI; create `tests/owner-edition/ui-shell.test.mjs`, `docs/owner-edition/UI-ACCEPTANCE.md`.

**Interfaces:** `mountShell({owner,settings,onNavigate})`; `setTheme('dark'|'light')`; `announce(message,kind)`; `openDialog` from core retains accessible focus behavior. CSS variables mirror exact UI-spec colors plus spacing/type/z-index tokens.

- [ ] Capture existing desktop/dark and light reference screens before edits. Add assertions for visible mobile search, minimum action hit areas, no horizontal overflow, correct focus order and dialog focus restoration. Include 375/768/1024/1440px and blocked font/icon assets.
- [ ] Run `node --test tests/owner-edition/ui-shell.test.mjs`; verify current mobile-hidden-search/focus/target failures.
- [ ] Implement spacing/type tokens, readable sentence-case content, consistent controls, safe viewport height and sidebar/drawer behavior. Add Settings/Archive navigation and skip link. Keep existing palette/fonts/square borders; category text uses accessible foreground. Replace `lucide@latest` with a pinned/tested asset or local licensed icon subset and ensure missing icons never hide action labels.
- [ ] Add shared inline error/status/skeleton components, 2px visible focus, 44px targets, reduced-motion override and safe layer ordering. Theme preference is scoped to install/owner and defaults dark; storage failure falls back without breaking the app.
- [ ] Run shell tests, measure actual contrast in both themes and manually inspect before/after identity. Commit named files (`style: polish vault shell while preserving its identity`).

**Done:** shared app shell improves readability and mobile/keyboard access without changing the design direction.

### Task 2: Typed variables and assembled workflow preview

**Files:** Modify `_Core.html`, `_Scripts.html`, Index/_Styles; create `tests/owner-edition/variables.test.mjs`, `tests/owner-edition/use-flow.test.mjs`.

**Interfaces:** `assemblePrompt(template,variables,values): {text,missingKeys,invalidKeys}`; `renderUseView(record,ephemeralValues)`; `copyAssembledPrompt(result): Promise<CopyResult>`; `validateVariableDefinitions(body,variables)` mirrors server rules.

- [ ] Add exact regression assertions:

```js
const vars = [{key:'name',label:'Name',type:'text',required:true,example:'Ada'}];
assert.deepEqual(assemblePrompt('Hello {{name}}', vars, {}).missingKeys, ['name']);
assert.equal(assemblePrompt('{{name}} / {{name}}', vars, {name:'$& $1 {{other}}'}).text,
  '$& $1 {{other}} / $& $1 {{other}}');
```

- [ ] Test repeated keys, multiline/Unicode, empty whitespace-required, optional default vs example, invalid/unknown tokens, and clipboard rejection; run `node --test tests/owner-edition/variables.test.mjs tests/owner-edition/use-flow.test.mjs` and establish failures.
- [ ] Implement single-pass literal replacement with callback and key validation; no user-derived regex fragment or replacement-string interpolation. Render purpose/inputs/sample/limits and editable values beside assembled preview, stacked on mobile. Fields show required/optional explicitly.
- [ ] Disable Copy assembled prompt while invalid/missing; announce actionable field errors. On denied clipboard provide selectable assembled text/manual instructions. Copy never sends text to an AI tool, records filled inputs or marks content approved.
- [ ] Run tests and manual keyboard fill/preview/copy on mobile/desktop, including a plain prompt without variables; commit (`feat: add literal workflow assembly and preview`).

**Done:** users see exactly what they copy; hints never substitute for facts.

### Task 3: Library and editor workflow, drafts and conflicts

**Files:** Modify Index/_Scripts/_Styles/_UI; create `tests/owner-edition/library-editor.test.mjs`.

**Interfaces:** `renderLibraryView({records,query,filters,status})`; `renderEditorView({draft,baseRecord,saveState})`; `renderConflict({draft,latest})`; `saveAsCopy(draft)` uses new-record expectedRevision 0. `filterPrompts(records,{query,categoryId,subcategory,packId})` searches title/body/tags/category/subcategory/job.

- [ ] Test empty vault vs zero results vs denied/load-failed, long cards, no-hover Use/Edit, return focus, failed-save draft, ambiguous retry and conflict review/copy. Assert notes/negativePrompt/variable definitions persist after fixture reload; no fields disappear when categories change.
- [ ] Run `node --test tests/owner-edition/library-editor.test.mjs`; confirm current missing/unsafe states fail.
- [ ] Polish card type/spacing/metadata; make title a semantic action with separate visible Use/Edit controls, result count and clear filters. Make search visible at every width. Avoid rebuilding the grid once per record: create one fragment and replace children once; no per-card stagger that grows with record count.
- [ ] Improve editor field grouping, labels/counters and validation summary; make notes/negativePrompt editable in all categories; add variable definition controls and read-only token consistency feedback. Reuse core acknowledged saving/navigation safeguards. Conflict shows draft/latest and deliberate merge or Save as new prompt; no silent overwrite.
- [ ] Keep use inputs/drafts in memory only; offer Download draft JSON and explicit refresh-loss copy. Run library/editor tests and core state regression suite; commit (`feat: improve prompt retrieval editing and conflict recovery`).

**Done:** main daily flow is readable, keyboard/touch usable and preserves failed work.

### Task 4: Category management and archive screen completion

**Files:** Modify Index/_Scripts/_Styles; create `tests/owner-edition/category-archive-ui.test.mjs`.

**Interfaces:** `renderCategoriesView(categories,counts)`; `renderCategoryImpact(plan)`; `renderArchiveView(records,filters)`; API consumes core category/subcategory lifecycle signatures. No locally edited category name is a storage address.

- [ ] Test rename/color from canonical UI; affected counts and mapping on subcategory rename/removal; archived prompt restore destination; original creator/date intact; failed archive keeps library state; no permanent delete control or raw destructive RPC.
- [ ] Run `node --test tests/owner-edition/category-archive-ui.test.mjs` and establish missing current behavior.
- [ ] Implement consistent category panels, hex-color validation, accessible color labels and meaningful counts. Nonempty category archive asks archive-all vs move-all with destination validation; show effect before action. Show renames/subcategory updates only after acknowledgement.
- [ ] Add dedicated Archive screen, search, original category/date, restore modal, empty/error/loading states and link back to restored prompt. Carry drafts and focus correctly through navigation.
- [ ] Run tests plus backend lifecycle suite and mobile keyboard walkthrough; commit (`feat: complete category and archive management`).

**Done:** alternate-tree rename feature is safely represented in canonical UI and all archive actions are reversible.

### Task 5: History, settings, export and import recovery UI

**Files:** Modify Index/_Scripts/_Styles/_UI; create `tests/owner-edition/history-backup-ui.test.mjs`.

**Interfaces:** `renderHistoryView({record,revisions})`; `renderBackupSettings({health,activeOperation})`; `renderImportPreview(preview)`; `downloadVerifiedBundle(bundle)` and `downloadQuarantinePages()` validate assembled checksums before reporting completion. Consume core history/export/import/status/cancel RPCs.

- [ ] Test version compare/restore as a new revision, no destructive history replacement, owner health without secrets, complete bundle download, separate history/quarantine inclusion labels, stale preview, foreign adopt-as-copy selection, import resume/cancel after app reopening and failed chunk retry.
- [ ] Run `node --test tests/owner-edition/history-backup-ui.test.mjs`; verify missing screen/contract failures.
- [ ] Implement on-demand history panel with readable before/after and restore confirmation; ignore creation metadata in editable forms. Add Settings health, backup/export/import areas and clear-local-preferences action. Explain optional AI/images as unavailable rather than showing broken calls.
- [ ] Import preview shows additions/updates/skips/quarantine and owner decisions; progress reflects staged records while explaining content is not visible yet. Resume existing pending import through status, with Retry and Cancel before commit; other write controls explain temporarily busy. Export labels distinguish current heads, history and quarantine and flag an incomplete download.
- [ ] Run UI + core import/recovery tests; verify export/import round trip in disposable UI and commit (`feat: add history and recoverable backup settings`).

**Done:** backup and recovery are understandable owner actions, not developer-only tools.

### Task 6: One reviewed workflow pack and lightweight retrieval preferences

**Files:** Create `content/schema.json`, `content/packs/website.json`, `content/candidates/brand.json`, `content/candidates/shopify.json`, `content/reviews/website.md`, `tests/owner-edition/content.test.mjs`, `tests/owner-edition/preferences.test.mjs`; modify library/use UI and docs.

**Interfaces:** `validateWorkflowPack(pack): ValidationResult`; pack `{schemaVersion:2,id,version,workflows}` maps to the spec's PromptRecord workflow metadata through explicit import. `preferencesKey(installId,ownerEmail)` isolates theme/favorite/recent IDs. Recent list max 10 distinct IDs; favorites max 100 IDs, no values/body/output persisted.

- [ ] Test pack schema, four required jobs, declared token consistency, required inputs/examples/output/checklist/limits/version/content owner/review status. Assert untested workflows cannot be labeled approved. Test preference isolation, unavailable localStorage, stale/deleted IDs and Clear recent/favorites.
- [ ] Run `node --test tests/owner-edition/content.test.mjs tests/owner-edition/preferences.test.mjs` before implementing content/preference adapters.
- [ ] Author four draft website workflows named in the design; keep brand/Shopify candidates explicit backlog. Add owner-selected pack import, never seed over existing records. Add favorite/recent filters only after primary flow is working; do not introduce analytics or store filled facts.
- [ ] Review each workflow with three synthetic/permitted briefs, record actual tool/model/date, useful edits and checklist findings; owner approves content before its reviewStatus becomes approved. Normalize existing strategy prompts only as separately reviewed candidates; no fabricated evidence.
- [ ] Run content/import round trip, review evidence and commit drafts/tests/docs (`feat: add reviewed workflow pack structure`). Content approval remains pending if actual review has not occurred.

**Done:** structurally valid pack and honest review evidence; useful content is distinguished from draft candidates.

### Task 7: Canonical demo and whole-app verification

**Files:** Create `scripts/build-demo.mjs`, `tests/owner-edition/fixtures/demo-transport.mjs`, `tests/owner-edition/accessibility.test.mjs`, `tests/owner-edition/responsive.test.mjs`, `tests/owner-edition/fixtures/vault-500.json`; modify screenshots.mjs and root scripts; update UI-ACCEPTANCE.md.

**Interfaces:** `build-demo.mjs --out <directory>` resolves canonical Index includes into a local document with explicit demo banner and fake `vaultApi`; no separate duplicated UI implementation. Fixture supports configurable RPC latency/failure/denial/conflict and no real Google/provider traffic.

- [ ] Add assertions that generated demo contains canonical source hashes and mock transport, all main screens render, every interaction is named and keyboard-reachable, mobile search is visible, no horizontal overflow and no unhandled error on blocked CDNs. Use a pinned development-only axe-core accessibility runner if available; otherwise add it explicitly to the test tooling and document its version.
- [ ] Run `node --test tests/owner-edition/accessibility.test.mjs tests/owner-edition/responsive.test.mjs`; establish current coverage/failure gaps before visual fixes.
- [ ] Generate demo from current source; update screenshot automation to use it and assert each target screen/state before capture. Label historical Preview.html in docs rather than deleting it. Add no per-record network search calls; debounce input 150ms and render via one fragment; measure 500-record fixture without claiming Google performance.
- [ ] Verify dark/light, 375/768/1024/1440px, 320px robustness, 200% zoom, reduced motion, keyboard and touch. Capture library/use/editor/categories/archive/history/settings plus loading/empty/error/conflict states. Automated accessibility plus manual labels/contrast/dialog checks must pass; report remaining live mobile clipboard issues accurately.
- [ ] Run `npm run test:owner` and browser test script once after final fixes, inspect screenshots against original identity, record measured timings/environment and commit (`test: verify owner workflow accessibility and responsive UI`).

**Done:** UI pass covers the entire app and failure states, with canonical-source evidence and preserved style.

## UI completion gate

- [ ] Same visual identity confirmed by before/after comparison.
- [ ] All screen and interaction checks in the UI spec pass or are explicitly blocked on live evidence.
- [ ] Four workflows are schema-valid; real review status is honest.
- [ ] Demo and screenshots reflect canonical source and are visibly illustrative.
- [ ] Safe owner core remains fully functional without optional AI/images.
