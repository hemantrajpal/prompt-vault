# Planning review and coverage

4 November 2026 · Plan/design review, not implementation acceptance.

## Skill application

- Superpowers writing-plans: file responsibilities, explicit interfaces, small reviewed tasks, failing tests before fixes, exact validation commands, named-file commits and execution handoff.
- Superpowers brainstorming builder check: fresh read-only reviewer checked the design and plans. Existing user-approved direction was retained; new engineering defaults are labeled proposals. No implementation started.
- UI/UX Pro Max: design-system query `prompt library productivity dashboard dark brutalism amber sharp borders`; UX query `keyboard focus modal touch target error feedback reduced motion`; stack query `responsive forms accessibility loading states`. Preserved user style overrides generic generated palettes/font/layout recommendations. UI spec records accepted/rejected guidance.

## Fresh reviewer findings and resolution

| Finding | Resolution |
|---|---|
| Generic recovery could unexpectedly finish a paused import | Import `kind` has explicit verify/status-only generic recovery; only advanceImportV2 advances/commits; other writes BUSY; explicit cancel |
| Original creator and provenance had no durable fields | Immutable createdBy/provenance added to prompt/category contracts, tests and import/export/history rules |
| Rejected/unknown data could be lost | Durable chunked `_Quarantine`, export manifest and paged raw download; originals retained |
| History export was unbounded and restore ambiguous | Paged revision-bound full archive; private empty same-owner clone restore preserving install/operation/entity IDs and revisions; normal web import rejects history archives |
| Refresh could not rediscover the paused import | Guarded vault/setup bootstrap includes pendingOperation summary; no localStorage dependency |
| Image feature referred to an undefined attachment field | AttachmentRef[] added to schema, save/history/export, private registry validation and unavailable cross-install behavior |

Additional self-review fixed physical storage: chunk operation payloads/manifests/acks into `_OperationPayloads`; keep COMMITTED marker bounded. State that atomic marker reliability needs live evidence. Export pages bind a vault revision to prevent a mixed-version archive. Distinguish JSON references from image-byte backup.

## Source finding coverage

| Observed problem / missing behavior | Owning task |
|---|---|
| Unknown installed version, existing dirty working tree, duplicate source | Core 0; Release 3 |
| Blank identity/all-row reads, unguarded RPCs, allowlist permissiveness | Core 1 |
| Public setup/debug helpers, all-property logs, broad framing/scopes | Core 1 |
| Unsafe metadata/HTML/inline-handler rendering | Core 2 |
| Destructive repeat setup, schema drift, formula parsing | Core 3 |
| Delete-before-move, no lock/conflict/retry or recovery | Core 4–5 |
| Missing notes/negative prompt, restore creator/date loss | Core 3, 5–6; UI 3 |
| Category rename and subcategory association loss | Core 5; UI 4 |
| Backup, previewed import, legacy mapper and restore drill missing | Core 6; UI 5; Release 3 |
| Failed-save optimistic state, load failure, dirty navigation | Core 7; UI 3 |
| Placeholder-as-value, regex/replacement bug, clipboard failure | UI 2 |
| Mobile search hidden, small targets, keyboard/dialog/focus gaps | UI 1, 3, 7 |
| Whole-app style consistency/readability, long text/themes/motion | UI 1–5, 7 |
| History/settings/backup/import screens absent | UI 5 |
| Mock preview drift, screenshot capture without assertions | UI 7 |
| Strategy pack placeholders and unreviewed claims | UI 6 |
| AI key mismatch, invalid response/default model, no diff/limits | Core 1 disabled; Release 1 optional |
| Public image sharing, ignored folder, failed upload fallback | Core 1 disabled; Release 2 optional |
| README role/cost/readiness/media/author claims | Release 3 |
| Media entrypoints/dependencies and asset licensing | Release 3 documentation; no new promotional render required |
| Useful reuse, paid install economics and service evidence | Release 4 |

## Plan self-review

- [x] Exact source/test/document locations and unique helper responsibilities defined.
- [x] Public RPC/record names agree across design/core/UI/optional plans, including provenance, attachments, subcategories and history exports.
- [x] Review Focus failure modes have owning regression tasks.
- [x] Core and optional feature gates are separate; user can ship safe library with integrations disabled.
- [x] All app screens get a style/interaction pass preserving existing identity.
- [x] Pending import is discoverable after refresh; started imports do not expire with their previews.
- [x] History and quarantine completeness is explicit; asset-byte backup is not implied by JSON reference export.
- [x] Real account/RAW/marker/restore/content/installer evidence remains unchecked until performed.
- [x] No product source, deployment, Google data, external messages or Git history changed while writing plans.

## Execution review still required

These are planning checks. Tests named in the implementation plans are proposed new tests, not files claimed to exist or runs claimed to pass. Live deployment provenance/account mode, actual legacy data and private image rendering remain concrete execution gates. Read the design plus the relevant subplan before implementing each task.
