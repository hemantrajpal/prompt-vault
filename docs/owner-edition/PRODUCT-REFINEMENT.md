# Product refinement: categories, prompt cards and motion

Applied the emilkowalski-emil-design-eng skill plus the existing UI/UX Pro Max accessibility contract. This replaces the earlier rigid card treatment while retaining Iconsax, the amber identity and dark/light themes.

| Before | After | Why |
| --- | --- | --- |
| Yellow code-like previews on every card | Short human-readable summaries, visible input count and a clear Use action | Choose a prompt without reading its implementation |
| Category selection hidden in the sidebar | Category chips with counts, selected state and subcategory filtering | Make browsing visible and reversible |
| Exact-name subcategory typing | Select from the chosen category's subcategories | Avoid invalid combinations |
| Category creation requires leaving an unsaved editor | Focused creation dialog returning to the same draft with new category selected | Preserve work |
| Large persistent category forms | Compact rows and focused edit dialogs | Reduce visual noise |
| Offset card shadows and generic hover motion | Subtle pointer hover, 120 ms press feedback and purposeful dialog motion | Immediate feedback without distracting movement |
| Same animation for every input method | 180 ms pointer dialog entry / 120 ms exit; instant keyboard and reduced motion | Repeated actions stay fast and accessible |

Search, filters and category switches are not animated. Dialog movement uses only transform/opacity, starts at scale .98 and uses a custom ease-out curve; no animation library or runtime dependency was introduced. Icons remain bundled locally. Demo now contains six synthetic prompts across three categories, so navigation can actually be exercised. Existing in-memory demo records were exported before adding examples.

Regression checks cover filter/reset, subcategory selection, category creation without draft loss, and actual native animation invocation for pointer versus keyboard/reduced motion. Contrast verification now checks the painted button background, since the primary action changed from text-only to a filled button. Full Google deployment remains separate from the local preview.

Validation: `npm test` passed 38/38. Desktop (1440 px) and mobile (390 px) grid/list previews were checked; no document overflow or browser console errors were observed. `git diff --check` passed.
