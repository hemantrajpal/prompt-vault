# Workspace redesign

## Direction and references

Applied UI/UX Pro Max (`ui-ux-pro-max/SKILL.md`) to the existing HTML/Apps Script UI. Ran its design-system generator and responsive/form guidance. Used its accessibility, typography, touch target, focus and responsive guidance. The generator's horizontal-journey / oversized-marketing-style recommendation does not fit a repeat-use library, so the implemented direction is a compact workspace with a single Inter family, warm neutral surfaces and the existing amber accent.

Mobbin MCP screens were inspected visually:

- [StackAI prompt library](https://mobbin.com/screens/a249b577-f7e5-4f23-a50c-c9d0fcfeb3e3): a compact title, summary and secondary edit action.
- [WRITER prompt library](https://mobbin.com/screens/d1e4f5e5-67be-477e-88a9-aeddeb5bc9be): a quiet navigation frame and one consistent Use action.
- [Craft documents](https://mobbin.com/screens/ee2c9010-73f5-485a-b768-0f95572a47e0): compact collection density and a restrained workspace sidebar.

These informed original HTML/CSS. No reference images or product branding were embedded. Iconsax remains bundled locally.

## Before / after review

| Before | After | Why |
| --- | --- | --- |
| Two wide, tall cards at desktop width | Three compact columns, scaling to two and one | More prompts visible with a shorter scan path |
| Large titles and several disconnected metadata rows | Category, 16px title, two-line summary, one input/action footer | A consistent reading order |
| Filled Use buttons competing with New prompt | Amber New prompt, quiet text Use action, visible edit icon | Make action priority clear |
| Outlined category pills duplicating sidebar weight | Underlined category tabs with small counts | Reduce control noise while keeping filtering visible |
| Layered CSS overrides and mixed heading fonts | One stylesheet with shared tokens and one font family | Consistent hierarchy in every screen |
| Search controls remain above editor and settings | Search and layout controls appear in the library/archive | Keep controls relevant to the current task |
| One long editor form | Writing, organization, template inputs, collapsed notes/model options | Make the main authoring task easier to find |
| Save controls at the end of a long form | Sticky editor toolbar with draft status and save/download/cancel | Keep saving available while editing |
| Input fields and preview compete for space | Input panel followed by preview and copy action | Match the personalize, review, copy sequence |
| Wide settings action row | Separate export, import and local-preference sections | Make recovery actions easier to understand |
| Category rows consume several lines for controls | Compact desktop rows; readable mobile actions | Reduce empty space without losing access |
| Drawer animates during a breakpoint change | Drawer motion only for explicit navigation changes | Avoid a partially visible drawer during resize |

## Interaction and verification

- Safe DOM rendering, owner RPC boundaries, literal prompt assembly, category CRUD and import/export remain intact.
- Pointer press feedback and dialog transitions retain the Emil Kowalski motion policy. Search, filtering and keyboard actions remain immediate. Reduced-motion preferences disable movement.
- Both grid and list retain direct Use/Restore and Edit actions. No hover-only actions.
- Updated the save regression to expand the optional notes section before editing. Library search is explicitly contextual, with a Back to prompts action from Use.
- Browser regression checks cover library, categories, settings, editor and use at 375, 768, 1024 and 1440 pixels in both themes, including inner-content overflow and contextual controls.
- Scope: source, local demo and GitHub. The existing Google Apps Script deployment still requires its exact Script ID/editor URL.

Final validation: `npm test` passed **39/39**. Visual checks covered desktop/mobile grid and list, light/dark library, category rows, editor, and settings. No browser console errors were observed. `git diff --check` passed.
