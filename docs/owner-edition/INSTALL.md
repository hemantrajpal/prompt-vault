# Owner Edition installation (candidate, not a verified live release)

Use a **new disposable Spreadsheet and Apps Script project** for validation. Preserve existing deployments/data. Do not copy this branch over production yet.

1. Copy every authored `.gs`/`.html` file in `src/` and `src/appsscript.json`; ignore macOS `._*` files. Apps Script HTML file names omit the `.html` suffix in the editor.
2. Enable the Sheets API v4 advanced service. Check the manifest's required scopes (email + spreadsheets). No Drive/provider scopes are required by the disabled integrations.
3. Set `OWNER_EMAIL` and `SPREADSHEET_ID` in Script Properties. Never put credentials or real IDs in source files, fixtures or Git.
4. Initialize storage while signed in as the configured owner. The editor hides functions ending in `_`, so `setupPromptVault_` is not directly listed in its Run menu. Temporarily add this editor-only wrapper, select `installOnce` and run it, completing Google authorization:

   ```js
   function installOnce() {
     return setupPromptVault_();
   }
   ```

   The underlying setup still verifies the configured active-user identity. It creates v2 tables additively; it does not migrate legacy tables or clear data. Stop if schema/configuration validation fails. Remove the temporary wrapper before deploying; it is not part of the browser RPC surface.
5. Deploy with access restricted to the owner. Test active-user identity in the chosen execution mode. Blank identity must fail; do not substitute effective-user identity or broaden sharing to bypass this.
6. Complete LIVE-ACCEPTANCE.md on this disposable install before discussing production cutover.

`Prompt_app/` is historical source. `src/` is canonical. The old `ALLOWED_EMAILS` team behavior is unsupported. `ANTHROPIC_API_KEY` is the future canonical AI property; no provider key is used by the disabled core, and no model/API availability is claimed.
