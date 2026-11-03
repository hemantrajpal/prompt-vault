# Prompt Vault UI improvement specification

Date: 4 November 2026. Proposed improvements to the entire application, preserving the existing visual style. Companion to `2026-11-04-owner-edition-design.md`.

## Method and priority

Applied UI/UX Pro Max's design-system search and targeted UX/stack searches to the existing source. Accepted: contrast, keyboard focus, 44px targets, inline error/recovery, responsive forms, reduced motion and visible loading. Rejected generic search suggestions for blue palettes, Fira typography, horizontal-scroll landing patterns, bento/glass cards and glow effects because the user asked to preserve the app's style. Stack guidance is translated into existing vanilla CSS/HTML; no Tailwind dependency is required.

## Visual contract

Keep dark default and existing light toggle. Keep charcoal `#121212`, card `#18181A`, foreground `#E0E0E0`, border `#3A3A3C`, amber `#F5A623`; light background `#F9F9F9`, foreground/border black. Keep Space Grotesk for display/control headings and Inter for reading/forms. Retain square corners, thin structural borders, restrained offset hover shadow and subtle grid. Fonts have system fallbacks; core actions must work when font/icon CDNs fail.

Use a spacing scale of 4/8/12/16/24/32/48px. Body and input text 16px, line-height 1.5; supporting labels at least 13px; display title 24–32px desktop and 22–26px mobile. Keep uppercase for the wordmark, short section labels and a few headings. Prompt titles, long button labels, entered content and paragraphs use sentence case for reading. Prompt body uses a normal-weight system monospace, 14px desktop minimum and 16px mobile, wrapping long tokens. Do not uppercase user-entered title fields.

Normal text contrast >=4.5:1; large text and essential UI indicators >=3:1. Derive accessible category text from theme/foreground; use category colors as a stripe/dot or border accent rather than assuming arbitrary hex colors have readable text contrast. Include explicit labels/icons with status; do not rely on color. Focus outline 2px amber with 3px offset, a contrasting alternate on amber/light backgrounds. No focus outline removal without replacement.

Targets at least 44x44px including icon actions. Use a consistent z-index scale: header 10, drawer 20, overlay 30, dialog 40, toast 50. Dialog overlays always sit above the drawer. Native dialog where supported with tested fallback, accessible name, initial focus, focus containment, Escape and return-to-trigger. A busy save cannot be duplicated; cancel/close behavior explains whether committed work can continue.

Motion 150–200ms for hover/focus; no long stagger delays on large lists. Reduced motion removes card entrances, hover translation and spinners where a static busy label suffices. Preserve subtle shadow identity without moving the entire page or causing content jumps.

## Screen-by-screen changes

| Screen | Retain | Improve/add |
|---|---|---|
| Shell | Wordmark, sidebar, topbar, themes | Proper navigation buttons, current location, labels, owner/install identification, Settings and Archive links, skip link, focus management |
| Library | Category stripes, sharp cards, tags, search | Search on every width, result count/clear filters, separate empty-vault/no-results/load-error states, readable titles, visible Use and Edit actions, archived excluded by default |
| Workflow use | Template and variables | Purpose/limits, sample disclosure, required/optional labels, multiline fields, assembled preview, validation next to fields, Copy assembled prompt and failure fallback |
| Template editor | Main form and side panel | Save prompt label, editable notes/negative prompt in every category, variable schema editor, token validation, draft/saving/saved/failed/conflict states, navigation warning |
| Categories | Color-coded groups and subcategories | Rename/color feature in canonical source, stable IDs, affected-record counts, subcategory rename/removal mapping preview, archive/move decisions and failure recovery |
| Archive | Reusable archived records | Dedicated view, search, original category/date, restore destination, restoration preserving creator/date; no permanent-delete affordance |
| History | New | Revision/date list on demand, read-only before/after, restore-as-new-version with confirmation; loading/error/empty states |
| Settings & backup | New | Safe setup health, install/schema version, export current heads/history, import preview and progress/cancel, disabled-feature explanations, clear local preferences |
| Favorites/Recent | Later usability addition | ID-only owner/install-scoped preferences, no filled facts or prompt-output analytics; clear history action |

Keep workflows and ordinary prompts in the same library. Workflow metadata adds guidance; manually created prompts do not require a content pack to be useful. New prompts start without fake review badges. Empty-vault actions: Create prompt or Import workflows. Filter-empty action: Clear filters. Denied access reveals no library/config data. Load failure retains a Retry action and never masquerades as empty data.

The existing AI side panel becomes an unobtrusive unavailable feature explanation in the core, with space reused for variable help and saved-state information. Enabling AI later adds selected-text consent and a proposed-diff panel; it never silently rewrites the editor. Image controls remain hidden/disabled until private-rendering acceptance passes. Preserve attachment references in exports and show a deliberate Open reference link only after URL validation and user action.

## Responsive behavior

- Desktop >=1024px: 248px sidebar, flexible main area; 2–3 library columns based on available width; use/editor split panels only when each column remains readable.
- 768–1023px: collapsible sidebar when needed; 2-column cards if each fits >=280px; stack use/editor panels when content width is insufficient.
- <=767px: drawer navigation, title/action row and full-width search row, one-column cards, 16px side padding, 44px controls; inputs stay 16px to avoid mobile zoom. Search must never be hidden as the only search control.
- Use `100dvh` with `100vh` fallback and safe-area padding; reserve room beneath sticky actions so the last field is not obscured by the keyboard/footer.
- 320px robustness and 200% zoom: no page-level horizontal scrolling; long titles/tags/emails wrap or truncate with accessible full text. Tables use a labeled contained scroll region where necessary.

## Interaction and copy

Library card title is a keyboard-accessible action; avoid a button nested inside another button. Visible Use/Edit controls work without hover. `/` focuses search unless already typing; Escape closes non-destructive overlays. Save keyboard shortcut is optional and must not intercept ordinary typing or bypass validation. Restore focus to the originating card after returning.

Use exact primary state copy: “Unsaved changes”, “Saving…”, “Saved”, “Couldn’t save. Your draft is still here.”, “This prompt changed elsewhere. Review the saved version before saving again.” Copy success only after clipboard resolves. Clipboard denial offers selectable text and manual-copy instructions. Error summary links to invalid fields; `aria-invalid` and `aria-describedby` connect messages. Non-blocking state uses a polite live region; blocking errors are announced once.

Do not display database journals, operation IDs or schema internals in ordinary use/edit flows. Put diagnostic details behind Settings → Diagnostics. Explain recovery in human terms and offer retry/export/help.

## UI acceptance checklist

- [ ] Library, use, editor, categories, archive, history and settings look consistent in dark/light at 375/768/1024/1440px.
- [ ] Search remains visible and works on mobile; no action requires hover.
- [ ] All actions have accessible names, visible focus and a 44px hit area.
- [ ] Keyboard completes create → use → copy → edit → archive → restore; dialogs contain/restore focus and Escape behaves predictably.
- [ ] Long content, emoji, quotes, missing thumbnails/CDNs and 500 records do not break layout.
- [ ] Error, empty, denied, loading, conflict, import-progress and failed-copy states are verified, not represented only by success screenshots.
- [ ] Contrast measured in both themes; category colors cannot hide labels.
- [ ] Reduced-motion and 200% zoom remain usable.
- [ ] Demo uses canonical source and is visibly labeled “Demo · sample data · changes are not saved to Google”.
- [ ] Before/after screenshots confirm the same palette, typography families, square geometry and border/shadow identity.
