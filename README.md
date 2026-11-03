# Prompt Vault · Owner Edition candidate

A personal prompt/workflow library on Google Apps Script and Google Sheets. Keep reusable templates, fill structured inputs, review assembled text, and copy into your chosen AI tool.

This branch implements the owner core and UI locally. **Live Google integration, clone migration/restore and release acceptance are pending.** It is not a verified production release. The original source copy remains in `Prompt_app/` for provenance; maintain `src/` only.

## Try the local demo

```sh
npm ci
npm run demo
```

Open [the local demo](http://127.0.0.1:4322/). It renders the canonical application and executes the actual backend against in-memory Google service doubles. Synthetic data and changes stay in the local process; restarting clears them. It makes no Google/AI/Drive calls. Fonts may load from Google Fonts, with system fallbacks.

## Verify locally

```sh
npm test
```

Node 22 was used during implementation. Browser tests use Playwright and installed Google Chrome (`channel: chrome`). Install Chrome to run those tests; no Google account is needed for local verification. Backend tests include interrupted writes, lost responses, stale revisions, access denial and staged-import visibility.

## Candidate capabilities

- Owner verification on server actions; safe text rendering.
- Prompt/category editing, notes/negative prompt, literal variables and preview.
- Committed save state, retained failed drafts and conflict review.
- Archive/restore/history with preserved metadata.
- Versioned current-head JSON export/import and paged history/quarantine exports.
- Dark/light styling preserving the original charcoal/amber direction; mobile search and keyboard controls.
- Four website workflow candidates, explicitly draft and awaiting quality review.

AI assistance and image uploads are disabled. JSON exports contain attachment references, not media bytes. Team sharing, roles, public prompts, paid SaaS and autonomous publishing are outside this edition.

## Installation and remaining gates

Read [INSTALL.md](docs/owner-edition/INSTALL.md), [LIVE-ACCEPTANCE.md](docs/owner-edition/LIVE-ACCEPTANCE.md) and [execution status](docs/owner-edition/EXECUTION.md). Work on a disposable installation first; setup creates v2 tables without clearing legacy data. No production migration/cutover is implied.

The [implementation roadmap](docs/superpowers/plans/2026-11-04-prompt-vault-roadmap.md) remains the full scope. Historical preview/screenshots/media illustrate the earlier interface and do not prove authorization/persistence. Media build dependencies and asset provenance require separate release review.

MIT © 2026 Hemant. See [LICENSE](LICENSE). External fonts/icons/assets retain their own licenses; review distribution provenance before publishing.
