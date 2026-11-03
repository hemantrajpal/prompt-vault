# Prompt Vault improvement roadmap

4 November 2026 · Planning complete; implementation not started.

**Outcome:** A trustworthy personal prompt/workflow library with a polished version of the existing interface, then optional integrations and a small client-owned installation pilot.

This replaces the earlier five-task implementation checklist with smaller, testable tasks. The app keeps Apps Script + Sheets and its charcoal/amber brutalist visual identity. The new design explains the storage commit boundary, migration, UI states and test limits that the earlier checklist left open.

## Read these together

| Document | Purpose |
|---|---|
| [Product and technical design](../specs/2026-11-04-owner-edition-design.md) | Scope, exact API/data contracts, recovery, limits and release evidence |
| [UI specification](../specs/2026-11-04-owner-edition-ui.md) | Preserved style, tokens, all screens, mobile/keyboard behavior and acceptance |
| [1. Reliable owner core](2026-11-04-owner-core.md) | Baseline, access, rendering safety, schema, recovery, import, migration and true saved state |
| [2. UI and workflows](2026-11-04-ui-and-workflows.md) | Whole-app styling polish, structured use, history, backup settings, demo and four-job pack |
| [3. Optional features and release](2026-11-04-optional-features-and-release.md) | AI/private-image gates, docs, real installation proof and paid-pilot experiments |

## What changes for the owner

| Area | Result |
|---|---|
| Trust | Owner verified for every action; empty identity does not expose data |
| Saving | Acknowledged saves, retained failed drafts, conflict review and retry |
| Data | Categories rename without breaking subcategories; moves/archives/restores preserve every field |
| Recovery | Version history, portable export, previewed import and demonstrated restore |
| Use | Required inputs, literal assembly, preview and useful review checklist |
| Interface | Same identity, clearer type/spacing, complete states, working mobile search and accessible actions |
| Content | Four reviewed website-delivery workflows first; brand/Shopify candidates available later |
| Integrations | AI and images remain optional; no public uploads or silent AI overwrites |

## Delivery sequence and gates

- [ ] **Milestone 0 — preserve and identify.** Core Task 0: source hashes, deployment provenance, raw-data backup and clone restore. Local planning/tests do not need Google credentials; live migration does.
- [ ] **Milestone 1 — close access and rendering holes.** Core Tasks 1–2: guarded RPCs, disabled integrations, inert text, no broad property logging. Disposable owner/non-owner checks must pass before release.
- [ ] **Milestone 2 — make data dependable.** Core Tasks 3–6: normalized schema, RAW writes, explicit commit/recovery, category lifecycle and previewed import/migration. Injected failures preserve last committed state.
- [ ] **Milestone 3 — connect a usable owner app.** Core Task 7: canonical client adapter and truthful save/conflict/draft states; lifecycle survives refresh.
- [ ] **Milestone 4 — polish the whole interface.** UI Tasks 1–5: preserve style, restore mobile search, improve library/use/editor/categories/archive and add history/settings; keyboard/touch/theme evidence recorded.
- [ ] **Milestone 5 — make workflows useful.** UI Tasks 6–7: one four-job pack, canonical-source demo, 500-record fixture and complete browser/accessibility checks.
- [ ] **Milestone 6 — prove installation.** Release Task 3: disposable real acceptance, two fresh installers, recovery drill, corrected docs and attribution. Safe core can ship without AI/images.
- [ ] **Optional AI — separately gated.** Release Task 1; can be scheduled after Milestone 5, not on the critical path to the core.
- [ ] **Optional images — separately gated.** Release Task 2; private rendering must work before enabling controls.
- [ ] **Opportunity validation.** Release Task 4: five users/four weeks, two paid scoped installations, actual delivery/support economics. No automatic outreach/publication.

## Practical scope decisions

**Required:** all observed access, destructive setup, unsafe rendering, move-loss, failed-save, placeholder, schema/notes, rename/subcategory, mobile search and backup issues. All current app screens receive a styling/interaction pass.

**New screens/components:** workflow assembled preview, history drawer/page, Settings → Backup/Import and setup health, meaningful empty/error/conflict states. Ordinary prompts remain first-class; workflows add optional guidance.

**Later within the UI plan:** recent/favorite workflow IDs, after the primary retrieval/use flow passes. No dashboard or tracking of client inputs is needed.

**Defer:** SaaS rebuild, teams, billing, marketplace, public sharing, automatic publishing, multiple provider integrations and further promotional media. Optional AI/private-image work has a written plan but does not hold up the reliable core.

## Decisions already made vs evidence still needed

Proposed defaults: single-owner install; canonical `src/`; existing visual identity; website-delivery pack first; normalized committed snapshots with recovery; archive instead of permanent delete. These are explicit builder recommendations and can be revised during review.

Still to obtain at execution time: actual deployed source/version, owner identity/account configuration, an approved disposable Apps Script/Sheet, raw legacy export, real account/RPC results, real RAW/storage/restore evidence and content review outcomes. Missing live access does not block local code/fixture work, but it blocks claims that the release is verified. Unsupported identity behavior cannot be fixed by weakening guards.

## How to execute

Use Superpowers `executing-plans` for sequential execution or `subagent-driven-development` for task-by-task implementation/review. Given the coupled auth/storage/migration contracts, task-by-task review is recommended for the owner core; UI tasks can follow the same method after the core interfaces settle. There is no time estimate yet: deployment provenance and legacy-data cleanup determine the largest uncertainty. Report progress by completed gates rather than a guessed launch date.

Preserve the existing dirty working tree. Create a safe execution worktree/baseline following the applicable skill without losing uncommitted source; commit only named task files. A plan review does not authorize a production data migration, deployment, external AI call, publication or outreach. Obtain any required environment/access information when that concrete task is ready.

## Planning verification

Superpowers writing-plans used for file/interface mapping, independent tasks, failing-test/implementation/pass cycles and self-review. UI/UX Pro Max run for design-system, usability and responsive guidance; existing-style requirements override its generic palette/layout suggestions. A fresh builder check is recorded in `2026-11-04-plan-review.md`. Task checkboxes remain unchecked until actual implementation evidence exists.
