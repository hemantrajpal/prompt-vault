# Legacy library import

The editor-only `prepareLegacyImport_(snapshot, imageFiles)` prepares a version 2 bundle without writing prompt records. It requires the configured owner, rejects foreign or missing creators, formulas, duplicate prompt identities, unresolved records, and missing linked Drive images. It preserves empty categories and configured subcategories.

Before importing, make a full spreadsheet copy and export the original data. Keep snapshots and image inventories outside Git. Filter the legacy Config snapshot to category/subcategory entries; never export API keys to browser logs or repository files.

Preparation normalizes free-form legacy variable names into valid keys, updates corresponding template tokens, and retains the original template and mapping in provenance. Oversized legacy tag content moves into Notes with its original field label. Original dates are retained. The category and prompt IDs and operation ID are deterministic for the same source spreadsheet and snapshot.

Drive images match only by their existing file IDs. Existing HTTPS image links remain available on prompt cards and the prompt detail page. Unmatched Drive files appear in the Image Generation category's "Images without a matching prompt" gallery. Image previews have original-file links and a fallback when the source cannot load. Source files remain in their original folder; import does not change sharing permissions, upload files, or request a Drive OAuth scope. Image availability continues to depend on the source file and the viewer's access.

Pass the prepared bundle through `previewImportV2`, inspect every issue, then use `beginImportV2` and `advanceImportV2`. Check `getOperationV2` for COMMITTED; the final advance returns the commit acknowledgement rather than a state summary. Retry the existing operation instead of creating another import. Partial staging stays invisible until commit.

Any temporary public editor helper must verify the owner and be removed from remote HEAD before making a deployment version. Verify both remote source and the published version against canonical `src/`. Confirm counts, categories, original content, image links, and reload behavior in the deployed owner session.
