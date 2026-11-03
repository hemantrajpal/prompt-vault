# Prompt Vault Optional Features and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Provider calls, production changes, publishing and outreach need their own execution instructions.

**Goal:** Make optional integrations safe to enable and prove a reproducible owner installation before offering client pilots.

**Architecture:** Core library works without integrations. AI proposes an accepted/undoable change; images remain private and cannot become public to fix rendering. Documentation and live acceptance use disposable installations, followed by measured service experiments.

**Tech Stack:** Existing Apps Script/HTML, provider API only for explicit live AI tests, private Drive API only for explicit image tests, local service fakes and canonical browser fixture.

**Spec:** [Owner design](../specs/2026-11-04-owner-edition-design.md), [UI contract](../specs/2026-11-04-owner-edition-ui.md). Depends on owner-core/UI plans. Tasks 1–2 are optional; Task 3 can release the safe core while both remain disabled.

## Global Constraints

- Default integrations disabled; owner authorization required even for disabled endpoints.
- No secret/prompt-body logs or provider errors containing sensitive payloads.
- Canonical ANTHROPIC_API_KEY, explicitly configured model verified during execution.
- AI maximum 20 calls/owner/day, one concurrent request, 12,000 input characters, 2,000 output tokens.
- Images PNG/JPEG/WebP only, <=5 MiB decoded; no automatic public-link permissions.
- No claimed live validation, workflow quality, customers or revenue without actual evidence.
- Current charcoal/amber styling and accessible shared components apply to all added controls.

## Review Focus

1. Provider timeout/ambiguous response and malformed JSON: original draft survives; no uncontrolled repeated spend (Task 1).
2. Model output with markup/undeclared variables: inert rendering and rejected invalid schema (Task 1).
3. Private image fails to render or upload completion is lost: remain private, retry/omit explicitly (Task 2).
4. Fresh installer and blank visitor identity: setup guidance succeeds or safely rejects; no relaxed authorization (Task 3).
5. Misleading demonstration/claims and incomplete backup: truthful release checklist and actual restore evidence (Tasks 3–4).

### Task 1: Optional AI assistance with intentional sending and diff/undo

**Files:** Modify `src/AI.gs`, `src/appsscript.json`, `_Api.html`, `_Scripts.html`, Index/_Styles; create `tests/owner-edition/ai.test.mjs`, `tests/owner-edition/ai-ui.test.mjs`, `docs/owner-edition/AI.md`.

**Interfaces:** `getAiStatusV2(): RpcResult<{enabled,configured,model,remaining}>`; `proposeAiChangeV2({requestId,mode:'enhance'|'categorize'|'generate',selectedText}): RpcResult<{requestId,proposal,warnings}>`; optional status record stores request outcome/budget metadata, not selected text or model output. Request-result deduplication is limited to in-flight attempt metadata; an ambiguous request is not silently resent.

- [ ] Write tests for disabled/missing key, legacy-key presence, invalid mode/model/output, oversized input, >20 requests/day, concurrent call, provider timeout/429/5xx, escaped markup and bad variable keys. Browser asserts editor stays unchanged until Accept and Undo restores the exact original draft.
- [ ] Run `node --test tests/owner-edition/ai.test.mjs tests/owner-edition/ai-ui.test.mjs`; verify missing controls/validation fail.
- [ ] Implement canonical property with presence-only CLAUDE_API_KEY migration instructions; choose a currently supported configured model using official provider docs at execution time. Add provider scope only to this enabled edition. Guard budget/request reservation with lock, persist UTC date-based daily count, release active lease conservatively after request timeout; ambiguous attempts remain counted and require a deliberate new attempt.
- [ ] Validate provider response shape against mode-specific schema and variable rules. Keep external call outside long-held storage locks; return redacted failures. UI shows exact selected text/data-flow/cost explanation, explicit Send, before/after proposal and Accept/Discard/Undo. AI cannot grant approval status or silently save/publish.
- [ ] Run fake-provider tests and, only when requested/configured, one bounded disposable live request with synthetic text; verify no provider failure breaks core search/copy/save. Review/commit (`feat: gate AI proposals behind review and usage limits`).

**Gate:** enable only after actual configured-model/data-flow/error evidence; otherwise safe core ships with AI disabled.

### Task 2: Optional private image proof, limits and orphan recovery

**Files:** Modify `src/Drive.gs`, `src/appsscript.json`, `_Api.html`, `_Scripts.html`, Index/_Styles; create `tests/owner-edition/images.test.mjs`, `tests/owner-edition/image-ui.test.mjs`, `docs/owner-edition/IMAGES.md`.

**Interfaces:** `uploadPrivateImageV2({requestId,base64Data,fileName}): RpcResult<{assetId,reference}>` returns the design's AttachmentRef; `getPrivateImageV2({assetId})` returns an authorized rendering representation proven in the disposable spike; `previewUnusedImagesV2()` and `applyImageCleanupV2({previewId,assetIds})` use fresh owner-reviewed references. Store ownership/install/upload state in a dedicated versioned `_Assets` table with bounded metadata; never accept an arbitrary Drive ID as ownership proof. PromptRecord.attachments is versioned/preserved through normal save/history/export; cross-install references remain unavailable until explicit verified relink/reupload. JSON export includes references only and says that media bytes need a separate backup.

- [ ] Before full feature implementation, write a disposable proof protocol: owner-created private folder, private upload, authorized rendering inside Apps Script HTML, non-owner denial. No production/reference images. Record actual browser/account results; a failed proof leaves controls disabled and produces a documented limitation.
- [ ] Test strict MIME plus byte-signature match, SVG/HTML rejection, malformed base64, <=5 MiB decoded boundary, configured-folder ownership/access, external IDs, lost upload response, same-request retry, no ANYONE_WITH_LINK call and failed-image UI retry/explicit omit.
- [ ] Run `node --test tests/owner-edition/images.test.mjs tests/owner-edition/image-ui.test.mjs`; then implement the proven private rendering adapter only if the proof passed. Add only necessary Drive scopes and update setup health/documentation.
- [ ] Persist upload request/asset registration before returning. Committing a prompt links its asset ID; cancelled/uncommitted uploads remain identifiable. Preview cleanup lists only install-owned, unreferenced assets older than 7 days; recheck references immediately before cleanup, move to trash only after explicit reviewed action, no silent permanent deletion. Existing public files are inventory/remediation scope, not automatically permission-changed.
- [ ] Run fake tests and disposable private-rendering/access/error walkthrough. Review/commit (`feat: add private image attachments with recovery`) only with evidence; retain references/export support when image rendering stays disabled.

**Gate:** private rendering/access proven; do not substitute public thumbnail sharing to pass.

### Task 3: Reproducible installation and verified core release

**Files:** Modify README/CONTRIBUTING/.gitignore and docs linking canonical source; create `docs/owner-edition/INSTALL.md`, `RELEASE.md`, `LIVE-ACCEPTANCE.md`, `SUPPORTED-DEPLOYMENTS.md`; preserve existing LICENSE attribution and correct README's placeholder author to match it; adjust launch copy only as accurate draft documentation.

**Interfaces:** `release evidence = {commitOrSourceHash,installSchemaVersion,accountMode,checks,results,limits,date}`. Private account IDs/credentials go only into private execution records; published evidence uses redacted labels.

- [ ] Add a checklist trace from each live release requirement to reproducible steps and actual result fields: owner/non-owner/blank identity, every public RPC, RAW round trips, ten lifecycle cycles, multi-write failures, lost ack, clone migration, fresh restore, browser/clipboard and optional-feature disabled state.
- [ ] Follow installation docs on a fresh disposable Sheet/project with no copied hidden settings. Document advanced service/scopes, OWNER_EMAIL, SPREADSHEET_ID, deployment restrictions and presence-only health. Any unverified account combination is unsupported/pending rather than guessed.
- [ ] Have two fresh installers perform install→first workflow→export→restore; record actual time and points of confusion. Fix docs and repeat only failed steps. Local tests all green are necessary but insufficient for live acceptance; Google access missing means this task stays incomplete.
- [ ] Correct README feature/access/cost claims, API-key mismatch, media paths and source-tree provenance. Confirm licenses/provenance for content, code, fonts/icons and assets before distribution. Media builds remain optional: document entrypoints/dependencies if retained rather than advertising unreproducible commands. Do not rerender or publish unrelated promotional material.
- [ ] Run complete automated checks once after fixes, complete manual UI matrix, assemble evidence and rollback instructions; review/commit documentation. Present concrete release/cutover package before requesting production action; never deploy/migrate/publish based on plan approval alone.

**Gate:** a client-owned core installation is reproducible and recovery/access are demonstrated. AI/images can remain disabled without blocking this gate.

### Task 4: Measured internal use and scoped paid pilot

**Files:** Create `docs/pilot/OFFER.md`, `SCORECARD.csv`, `WORKFLOW-REVIEW.md`, `DECISION.md`; keep private briefs/customer data outside the repository.

**Interfaces:** offer = one owner-owned install + four adapted workflows + handover + stated support period. Price floor = delivery hours × minimum effective rate + direct costs + support allowance; actual quote is chosen after scope/time evidence. Scorecard tracks consented/anonymized task, workflow version, usefulness, editing effort, repeat weeks and support hours, never raw client inputs by default.

- [ ] Use four workflows on internal repeated tasks with permitted briefs and record actual review/edit effort; do not mark untested examples proven.
- [ ] Prepare observation/offer materials and scorecard without contacting anyone. Seek explicit outreach instructions before recruiting or sending any message.
- [ ] Observe five target users over four weeks; proposed continuation signal is at least three returning in three of four weeks and naming useful repeated work. Record failed/unused workflows too.
- [ ] Test two paid scoped installations; record payment/delivery/support facts and whether ongoing maintenance is wanted. Do not invent subscription revenue or fixed public pricing from assumptions.
- [ ] Review evidence: maintain the internal/resource/service edition, revise the pack, or stop expansion. Design teams/hosted SaaS only if repeated collaboration demand and paid commitments justify it. Publish case study/resource only on instruction after technical claims are verified.

**Gate:** explicit evidence informs continued product investment; no business hypothesis is reported as an achieved result.
