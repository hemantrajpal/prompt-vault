# Supported deployment evidence

Owner-only installation is the target. Set OWNER_EMAIL and SPREADSHEET_ID in Script Properties. Only a verified active-user email matching the configured owner may access data. Blank identity is rejected; effective-user identity is never a visitor fallback.

Enable the Sheets v4 advanced service for RAW storage. Core scopes are email and spreadsheets; AI/Drive are disabled and have no scopes. Retain default frame restrictions.

| Account/mode | Status |
|---|---|
| Local isolated VM owner/nonowner/blank RPC checks | Automated tests |
| Consumer account / execute as owner / owner-only web access | Pending disposable live test |
| Workspace account / owner-only access | Pending disposable live test |
| Shared/team/cross-domain access | Unsupported |

Do not deploy until owner identity, denied-user checks, RAW writes and restore drills pass on a disposable install. The historical multi-user claims are not supported by the owner edition.
