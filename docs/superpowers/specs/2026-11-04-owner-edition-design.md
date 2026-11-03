# Prompt Vault Owner Edition: agreed direction and proposed build decisions

Date: 4 November 2026. Status: proposed implementation design, ready for review. This document and its plans supersede the 2 November implementation checklist; the earlier opportunity research remains background.

## Intent and scope

Deliver a dependable personal prompt/workflow library on the existing Google Apps Script, Google Sheets, HTML, vanilla JavaScript and CSS foundation. A user finds a job, understands the inputs, fills facts, previews the assembled prompt, copies it into their chosen AI tool and checks the result. A saved template can be reloaded, moved, archived, restored and exported without losing supported fields.

The user explicitly requested a complete plan for the recommended changes and UI improvements while preserving the current style. Engineering choices below are recommendations, not claims that deployment, schema or customer acceptance has already been approved or verified.

The first supported installation has one configured owner. Team accounts, public links, subscriptions, a marketplace and autonomous publishing are outside this release. Retain Apps Script for this scope; reassess the backend if shared workspaces and centrally managed SaaS become requirements.

## Delivery boundaries

1. Baseline and safe owner core: access, literal storage, schema, recovery, backup/import/migration and reliable UI actions.
2. Usability and workflow edition: preserve identity, polish every app screen, structured use/preview, history, settings and one four-workflow pack.
3. Optional releases: AI assistance and private image upload, each with independent acceptance gates. Disabled in the first release. Existing stored attachment URLs remain exportable; automatic image loading is off by default.
4. Distribution: honest documentation and repeat-use/paid-pilot evidence. Outreach, publishing and production cutover are separate actions requiring instructions at execution time.

The plan's UI scope is the application: library, use/detail, editor, categories, archive, history and settings. The green/cream localhost research page is a planning document; it is not the visual direction for the app.

## Source and deployment baseline

Repository: `/Volumes/Vault/20_AREAS/PROJECTS/06_SIDE PROJECTS/11_prompt-app`.

Maintain `src/` only. Preserve `Prompt_app/` until the deployed source is identified; recover its rename/color feature through the new category implementation rather than merging whole files. Preserve preview/media as historical assets until a generated demo uses canonical source. Ignore macOS `._*` artifacts in all scripts. Current Git status has pre-existing changes; never reset, bulk stage or assume HEAD contains the installed version.

Before source implementation, capture hashes, file modes, source copies and deployed version information. Before migration or cutover, obtain a source-data export and restore it into a fresh disposable clone. No setup, migration or fault injection runs against the production Sheet by default. Actual production migration is not authorized merely by this plan.

The local Node/browser fixture work can proceed without Google credentials. Deployment account tests, real RAW writes and clone restore are recorded as pending until a disposable install is available; never turn mock passes into live-evidence claims.

## File boundaries

| File | Responsibility |
|---|---|
| `src/Code.gs` | HTML entry, guarded public RPC facade and safe config |
| `src/Auth.gs` | `requireOwner_()` and typed error envelopes |
| `src/Schema.gs` | Validations, canonical serialization, shared field mapping |
| `src/Storage.gs` | RAW reads/writes, exact headers, lock wrapper and projections |
| `src/Recovery.gs` | Staged snapshots, commit visibility, retry and recovery |
| `src/Sheets.gs` | Prompt/category lifecycle using the new storage contract |
| `src/Setup.gs` | Private additive initialization and presence-only diagnostics |
| `src/ImportExport.gs` | Versioned backup, preview, staged import, clone migration |
| `src/_Core.html` | Pure variable assembly and client validation helpers |
| `src/_Api.html` | Apps Script Promise adapter, error normalization |
| `src/_UI.html` | Inert DOM builders, dialogs, announcements, navigation guards |
| `src/_Scripts.html` | Application state and screen controllers |
| `src/Index.html`, `src/_Styles.html` | Semantic shell and existing-style visual system |
| `src/AI.gs`, `src/Drive.gs` | Disabled endpoints first; optional integrations later |
| `src/appsscript.json` | Reviewed scopes for the actual installed core |
| `tests/owner-edition/` | Node tests, service fakes, canonical-source demo/browser fixtures |
| `content/` | Workflow schemas, candidates and selected reviewed pack |

Keep Apps Script global helper names private by ending them in `_`; all globals must have unique names across files. Update `include_()` calls in Index together with the helper rename. Client modules remain Apps Script HTML includes; no bundler/framework migration.

## Owner and public interfaces

`OWNER_EMAIL` and `SPREADSHEET_ID` are required Script Properties. Compare normalized active-user email to normalized configured owner; blank/missing/wrong identity denies. Never use effective-user identity as visitor proof, and never accept a Sheet ID from an RPC argument. The allowlist no longer defines release access.

`requireOwner_(): {email, mode:'owner'}` is the first operation in each exposed data/config/admin/integration RPC. Rename implementation helpers and setup to private names. Legacy public functions either become private or guarded adapters during the same transition; no unguarded old endpoint remains reachable.

Facade RPCs return `RpcResult<T> = {ok:true,data:T} | {ok:false,error:{code,message,fieldErrors?,retryable}}`. Map errors to `ACCESS_DENIED`, `CONFIG_REQUIRED`, `VALIDATION`, `CONFLICT`, `BUSY`, `RECOVERY_REQUIRED`, `FEATURE_DISABLED`, `QUOTA`, `INTERNAL`. No properties, raw service stack, keys or prompt bodies in client errors/logs. Configuration checks expose presence booleans and install/schema version only after owner verification.

Public API:

- `getVaultV2(): RpcResult<{vaultRevision,prompts,categories,settings,pendingOperation}>` returns current committed heads. `pendingOperation = null | {operationId,kind,state,staged,total,startedAt,canResume,canCancel}` is verified owner-only metadata from the operation journal, so refresh/reopen can rediscover a paused import without browser persistence. `getSetupStatusV2` includes the same pending-operation summary.
- `savePromptV2({operationId,expectedRevision,record}): RpcResult<SaveAck>`; new record uses `expectedRevision:0` and no client ID; edited record carries its ID.
- `movePromptV2({operationId,id,categoryId,expectedRevision})`, `archivePromptV2(...)`, `restorePromptV2(...)`: same acknowledgement contract.
- `saveCategoryV2({operationId,expectedRevision,record})`, `archiveCategoryV2({operationId,id,expectedRevision,promptPolicy:'archive'|'move',targetCategoryId?})`.
- `getPromptHistoryV2({id})`, `restorePromptVersionV2({operationId,id,revision,expectedRevision})`; restore creates a new revision.
- `getSetupStatusV2()`, `exportVaultV2()`, import interfaces below.
- `exportHistoryV2({cursor,limit:25})`, `exportQuarantineV2({cursor,limit:25})` return bounded owner-only pages and checksums. Export cursors bind to the captured vault revision; committed changes during paging reject completion and ask for a fresh export instead of mixing revisions.

`SaveAck = {operationId,id,revision,vaultRevision,committedAt,record}`. For multi-entity operations return `{operationId,vaultRevision,committedAt,records}`. IDs/timestamps/owner are server-controlled. Stale revision rejects without changing data. User-supplied IDs are permitted only as identifiers of existing records; new IDs are generated on the server.

## Shared records and limits

`PromptRecord = {schemaVersion:2,id,ownerEmail,createdBy,provenance,revision,categoryId,subcategory,title,body,variables,notes,negativePrompt,tags,model,workflow,status,createdAt,modifiedAt,legacyImageUrl,attachments}`. `createdBy` is immutable and initially the verified owner. `provenance = null | {sourceInstallId,sourceEntityId,sourceOwnerEmail,sourceCreatedAt,sourceModifiedAt,importedAt,bundleDigest,legacyLocation}` preserves reviewed import/migration origins; it is immutable to ordinary edits. Same-install migration preserves valid original creation metadata. Adopt-as-copy gives the new record the current owner/creator/current creation date and retains original metadata in provenance. Save, history restore and export preserve provenance.

`attachments: AttachmentRef[]` defaults to `[]` in the core. `AttachmentRef={assetId,sourceInstallId,name,mimeType,byteSize,checksum}` references install-owned `_Assets` records, never supplies an arbitrary Drive file ID. Save/history/export preserve references even with images disabled; core rejects attempts to create new unregistered references. Actual availability is derived by the authorized image adapter, not trusted from imported metadata. Cross-install/adopted bundles preserve attachment provenance but mark them unavailable in the UI until the owner deliberately reuploads/relinks through verified private ownership. JSON backup contains references, not image bytes, and clearly says so; an optional private media archive is a separate explicit export/copy action. Full same-owner clone restore preserves registry references and verifies access before rendering. No unavailable attachment is silently removed or publicly fetched.

`Variable = {key,label,type:'text'|'multiline',required,example,defaultValue?}`. Key matches `^[a-z][a-z0-9_]{0,31}$`. Example is never a default. Optional default values are explicit and shown before use.

`CategoryRecord = {schemaVersion:2,id,ownerEmail,createdBy,provenance,revision,name,color,subcategories,status,createdAt,modifiedAt}` uses the same creator/provenance rules. Category IDs do not change when renamed. Subcategories are normalized unique display strings carried in category snapshots and prompt fields; rename/removal must preview affected prompts and update those prompts in the same operation. Category archive with prompts requires archive-all or move-all; no permanent-delete action.

`workflow = null | {packId,contentVersion,job,requiredContext,example,expectedOutput,reviewChecklist,limits,reviewStatus:'draft'|'tested'|'approved',contentOwner,lastTested:{tool,model,date}|null}`. Storage status is `active|archived`, independent of content review status.

Proposed initial product limits, not Google platform claims: title 160 characters; body 20,000; notes and negativePrompt 4,000 each; 32 variables; 20 tags of 40 characters; names 80; at most 100 categories and 500 total prompt heads including archived. Enforce a 40,000-character maximum serialized entity snapshot and a 5 MiB UTF-8 maximum current-head export/import bundle. Validate on client for feedback and on server for authority. Oversize legacy data is quarantined for review, never truncated. Ordinary library reads can omit history; history is loaded on demand. Preserve all revisions initially; no automatic history pruning.

## Storage and recovery protocol

Use `_Config`, `_Prompts`, `_Categories`, `_Revisions`, `_Operations`, `_OperationPayloads`, `_ImportPlans`, `_Quarantine`. The index and per-category tabs become legacy input. `_Prompts` and `_Categories` are rebuildable current-head projections. **The authority for visible data is the set of valid committed operation manifests and their immutable `_Revisions` snapshots**, not a projection row on its own. This deliberately resolves the earlier plan's unspecified transaction boundary.

All writes and consistent reads acquire a script lock with a 5-second acquisition timeout; return BUSY on timeout. A lock is serialization, not a database transaction. Direct Sheet editors remain trusted administrators; manually edited or corrupt storage fails validation and requires recovery rather than silently becoming accepted state.

One logical operation has `{operationId,ownerEmail,payloadDigest,status:'PREPARED'|'COMMITTED'|'ABORTED',baseVaultRevision,targetVaultRevision,manifest,ack,createdAt,committedAt}`. Manifest entries identify entity ID, revision, snapshot digest and snapshot row identity. Hashes are SHA-256 over deterministic canonical JSON. Fingerprints cover normalized intent; new IDs/timestamps are generated once and saved in PREPARED intent so retries reuse them.

Physical layout: do not put a multi-record payload, manifest or acknowledgement into one cell/operation row. `_OperationPayloads` stores immutable <=40,000-character chunks keyed by operationId/component/chunkIndex with chunkCount/checksum; the small `_Operations` row contains `intentRef`, `manifestRef`, `ackRef` and their checksums plus status/base/target/timestamps. The marker validates the entire referenced manifest, not just status. Pending import bundle/selection data in `_ImportPlans` is also chunked and checksummed. A revision snapshot remains <=40,000 characters. Orphan payload chunks from a failed pre-PREPARED write are invisible; a retry reuses identical chunks and rejects mismatches.

Write order under the lock:

1. Recover pending work; validate identity, input, limits, referenced categories and expected revisions before mutation.
2. Look up operation ID. Same owner/digest plus COMMITTED returns stored acknowledgement; changed digest rejects. ABORTED requires a new ID. Existing PREPARED can resume only against its recorded base.
3. Persist and verify chunked intent, planned snapshots/manifest and proposed acknowledgement payloads, then persist their PREPARED operation row using RAW writes; no content is visible yet. After a pre-PREPARED failure, a retry reads/reuses stored generated IDs from valid intent chunks instead of minting a different identity.
4. Append missing immutable revisions by their deterministic operation/entity/revision identities. Read back and verify all hashes/counts; deduplicate identical retry rows. Different duplicates are corruption and block writes.
5. Persist the small complete COMMITTED operation row in one range write, including its target vault revision and verified manifest/ack references/checksums. **This marker is the commit point.** Re-read it to resolve an ambiguous service response. If it cannot be read, return retryable uncertainty; never invent success. Reconstruct the public acknowledgement from verified payload chunks.
6. Refresh current-head projections. Projection failure after commit leaves the committed acknowledgement valid and a repair requirement; canonical reads derive heads from committed manifests, never expose staged revisions or rely on a stale cache.

Recovery: valid PREPARED on its original base finishes staging/validation and commits on an owner retry/recovery; invalid staging or base mismatch is marked ABORTED and leaves prior heads visible. A committed marker with absent/mismatched snapshots is corruption: return RECOVERY_REQUIRED and offer last verified export; do not guess. GetVault ignores PREPARED revisions and returns only verified committed heads. A write must resolve an older PREPARED operation first. Interrupted category moves/archives/imports therefore expose either the previous committed set or the complete new set.

Import-specific exception: operation intent has `kind:'mutation'|'import'`. Generic recovery may finish/abort an ordinary mutation, but only verifies an import's staged integrity and reports its progress; it never advances or commits an import. Only explicit `advanceImportV2` resumes import staging/commit. Ordinary writes return BUSY with a Settings recovery destination while an import is PREPARED. Reads, operation status, backup of committed heads, advance and cancel remain available. The same owner can resume/cancel after reopening the app; expiration applies to unstarted previews, not a started import. `cancelImportV2` is idempotent for ABORTED and cannot undo a COMMITTED operation.

Atomicity of the single operation-row persistence is a live integration acceptance requirement, not an assumption proven by mocks. If the disposable failure drill cannot establish reliable marker validation, keep the release blocked and simplify the supported operation or choose a transactional backend. Do not claim automatic protection from arbitrary manual Sheet edits.

Write user text through Sheets API `valueInputOption:'RAW'`. Exact round trips must include `=1+1`, `+`, `-`, `@`, apostrophes, quotes, backslashes, emoji and multiline text. Reject active formulas in imports/legacy input; raw backup retains formulas separately as inert strings with provenance for manual review.

## Backup, migration and import

Raw legacy backup preserves tab names, headers, typed values, formulas as inert metadata, attachment references, counts and checksums. JSON Owner Edition bundle has `{schemaVersion:2,exportedAt,sourceInstallId,sourceVaultRevision,categories,prompts,checksum}` and excludes credentials, filled inputs and provider output. User backup includes all current active/archived heads; historical revisions are a separate explicit history export. The baseline raw backup plus installation archive preserves migration rollback.

`exportHistoryV2` emits a paginated full recovery archive of committed operation rows, referenced payload chunks and revision rows with a global manifest; pending/uncommitted work is excluded. Private `restoreHistoryClone_(archive)` accepts only an empty disposable clone under the same verified owner, validates every marker/reference/hash and imports the source install identity/history before enabling reads. It is an offline/admin restore drill, not a web RPC and not a merge into an existing vault. Normal Settings import restores current-head bundles only; it rejects history archives with a clear restore-guide link. History-archive loading validates all source rows before writing the empty clone and publishes a ready schema only after all hashes verify. No active deployment is pointed at the clone during this drill. This supplies complete history recovery without an ambiguous history-merge feature.

Quarantine is durable: `_Quarantine` stores `{quarantineId,ownerEmail,bundleDigest,sourceLocation,reason,chunkIndex,chunkCount,payloadChunk,checksum,createdAt}` with raw JSON split into <=40,000-character chunks written as literal text. Ordinary saves/history never modify it. Main bundle adds `quarantineManifest:[{quarantineId,reason,checksum,chunkCount}]`; it does not pretend raw quarantined rows are active prompts. `exportQuarantineV2({cursor,limit:25})` returns owner-guarded chunks plus nextCursor; Settings offers a separate complete quarantine JSON download with assembled checksum verification. Restore/import can reattach those chunks as quarantine without promoting them to content. Unknown legacy fields, invalid/oversize records and rejected formulas survive here and in the original raw backup. The 5 MiB limit applies to the main bundle; quarantine downloads use bounded pages and disclose incomplete downloads. No silent omission of quarantine/history from a claimed full backup.

`previewImportV2(bundle): RpcResult<ImportPreview>` validates schema/limits/checksum, shows additions, differences, skipped-identical records and quarantined fields; performs no content changes. This owner install never accepts foreign ownership: reassigning foreign content requires an explicit adopt-as-my-copy selection, creates new IDs and preserves provenance. Same-install matching IDs may update only with explicit selection and matching revisions. No implicit deletions. Unknown unsupported fields are quarantined/preserved in the preview report rather than silently dropped.

`ImportPreview={planId,bundleDigest,baseVaultRevision,expiresAt,items,issues}` lives in `_ImportPlans`, expires after 30 minutes and is owner-bound. `beginImportV2({planId,operationId,selections}): RpcResult<{operationId,state}>`, `advanceImportV2({operationId}): RpcResult<{state,staged,total}>`, `getOperationV2({operationId})`, `cancelImportV2({operationId})` stage at most 25 entities per advance call under the same manifest protocol. No heads are visible until the entire selected import commits. Stale previews reject at begin; once staging starts, other writes return BUSY until commit or explicit cancel/recovery. Cancel marks ABORTED and exposes no staged heads. Lost-response retries are idempotent. No CacheService-only authority for import plans.

Migration runs on a clone. Map `PromptID`, category sheet name, `Subcategory`, `Tags`, `Prompt`, `Variables`, `Model`, `ImageURL`, `ImprovementNotes`, `NegativePrompt`, creator and timestamps explicitly. Map `{n,l,p}` or AI `{name,label,placeholder}` variables only when body tokens and keys match the new schema. Invalid tokens, bracket syntax, missing owners, foreign owners, duplicate IDs, orphaned tabs/index rows and invalid timestamps enter a quarantine report. Preserve source rows; no guessed ownership, overwritten dates or string truncation. Compare field-by-field, counts and checksum; restore to a second fresh clone before proposing cutover.

## UI behavior

Read the companion [UI specification](2026-11-04-owner-edition-ui.md). It locks existing identity while improving typography, spacing, screen completeness, touch/keyboard use and status feedback.

Pure `assemblePrompt(template,variables,values): {text,missingKeys,invalidKeys}` replaces literal tokens once using a callback; values such as `$&`, `$1`, backslashes and embedded `{{...}}` remain literal and are not reprocessed. Missing required values block copy. Optional blank values use only an explicit shown default or the empty string. Unknown/malformed tokens are validation errors. Existing hint text is never substituted.

Client state separates committed records, an unsaved editor draft and ephemeral use inputs. Commit records only after a verified acknowledgement; on ambiguous timeout retain the exact operation ID/payload for retry. No silent attachment omission. Navigation during a dirty draft offers Stay/Discard; in-app draft memory survives network failures. Refresh-loss behavior is explicit: unload warning where supported and Download draft JSON; no automatic client-input persistence. Preferences may store theme and IDs of recent/favorite workflows, scoped by install/owner; filled inputs and drafts do not enter browser storage. Clear preferences is available.

Conflicts show the latest saved version alongside the retained draft; offer review/merge or save as a new copy, never silent overwrite. History restore creates a fresh revision and preserves history. Search covers title/body/tags/category/subcategory and workflow job, and remains available on mobile.

## Content and optional features

First candidate pack: Website content & delivery, recommended because it fits current studio services; the user may change the selection without backend redesign. Four jobs: content outline, factual service-page draft, supplied-content UX review and UAT/launch checklist. Each needs three realistic permitted/synthetic briefs and human review. Start as draft; approval requires recorded evidence. Brand and Shopify four-job lists stay candidates. Normalize the seven strategy prompts only through explicit review; do not auto-install them.

Optional AI: canonical `ANTHROPIC_API_KEY`; presence-only legacy-key migration notice. Configure/verify a supported model during implementation rather than freezing a model name here. Explicit Send selected text, displayed data flow and limits, structured response validation, proposed diff, accept/undo, timeout/rate/error tests. Budget defaults: disabled; when enabled 20 calls/owner/day, one concurrent request, max 12,000 input characters, max 2,000 output tokens. Counter updates are locked and conservative on ambiguous provider outcomes. Tests use provider fakes unless explicitly running a live integration check.

Optional images: disabled; PNG/JPEG/WebP only, max 5 MiB decoded, private configured folder, verified install/owner file provenance and no public-link sharing. A disposable proof must demonstrate authorized rendering inside the Apps Script app before image UI is released. If it fails, remain disabled; do not switch to public thumbnails. Explicit retry/omit, uncommitted-upload registry and previewed cleanup after 7 days. Existing public files are inventoried; changing their permissions requires a reviewed remediation action.

## Acceptance and evidence

Local: meaningful Node tests for RPC enumeration/guards, schema, RAW adapter, revisions, failure injection, idempotency, migration/import, literal assembly and content. Browser fixture renders the exact canonical includes with a fake transport; tests cover save failure, conflict, unsafe metadata, keyboard/dialog behavior, mobile search, no-hover actions and all main screens.

Screens: 375, 768, 1024 and 1440 CSS px; dark/light; keyboard; 200% zoom; reduced motion; long text and 500-prompt fixture. Automated accessibility checks plus manual keyboard/contrast review. Report measured fixture and live timing separately; no invented capacity claim.

Live disposable install: verified owner; denied non-owner and blank identity at all RPC boundaries; RAW round trip; ten create/reload/edit/move/archive/restore cycles with all fields; fault injection before/after commit; response-loss retry; migration and restore to a second clone. Record account/deployment mode and actual results. Missing live evidence blocks release, not local implementation progress.

Distribution evidence: two fresh installers; five target users for four weeks; two paid installations/customizations with tracked support time. These are future experiments, not claims or technical launch prerequisites for internal use. Publication and customer contact require separate instructions.
