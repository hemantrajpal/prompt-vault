# Mobbin layout pass and Iconsax

Implemented from the user's request to use Mobbin MCP and Iconsax while retaining the existing app style.

## References actually inspected

- [Langdock library](https://mobbin.com/screens/af941ae2-b5bd-425b-8728-0b1f778c75cd): clear sidebar grouping, library toolbar and structured card hierarchy.
- [Craft document library](https://mobbin.com/screens/60febed3-737e-4efc-b9e7-a26e95430eca): consistent document cards, visible collection navigation and view controls.
- [Midday document view](https://mobbin.com/screens/98cd59cf-ebb2-4abd-bd2f-fb1fd8129979): separate library and detail context.

References were inspected through Mobbin MCP search_screens. No screenshots or interface assets were copied into this app. Layout patterns were adapted to the existing charcoal/amber palette, square geometry, Space Grotesk/Inter and thin borders.

## Applied changes

- Two-column desktop library, single-column mobile and functional list/grid toggle.
- Compact sidebar with active indicator, aligned icon/label pairs, grouped category links and owner/theme footer.
- Search toolbar with result count, keyboard shortcut and visible layout controls.
- Cards with a document heading, category, bounded preview, review status and aligned footer actions.
- Mobile drawer now has an explicit close button and dismissible backdrop; closed navigation is inert.
- Free linear Iconsax SVG subset is bundled as trusted functional source in _Icons.html, with author/license notice. See ICONS.md.
- Light-theme action/focus colors use a darker amber tone to meet contrast requirements; dark styling keeps the original amber.

## Verification

Browser regression exercises icons with all external requests blocked, grid/list switching, 375/768/1024/1440px layout, minimum primary target height, mobile drawer open/close/inert state and actual computed light-theme action contrast. The existing full owner/backend/browser suite is also run.

The Vault external drive became unavailable during this pass. The source and locally installed test dependencies remain in the chat worktree; Git metadata on the external drive is temporarily unavailable. Do not initialize another repository over the worktree or discard its changes.
