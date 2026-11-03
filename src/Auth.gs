/** All browser-callable actions must enter through this boundary. */
function vaultError_(code, message, fieldErrors) {
  const err = new Error(message); err.code = code; err.fieldErrors = fieldErrors; return err;
}
function requireOwner_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw vaultError_('ACCESS_DENIED', 'Sign in with the configured owner account.');
  const props = PropertiesService.getScriptProperties();
  const owner = String(props.getProperty('OWNER_EMAIL') || '').trim().toLowerCase();
  if (!owner) throw vaultError_('CONFIG_REQUIRED', 'Owner configuration is required.');
  if (email !== owner) throw vaultError_('ACCESS_DENIED', 'This account cannot access this vault.');
  if (!String(props.getProperty('SPREADSHEET_ID') || '').trim()) throw vaultError_('CONFIG_REQUIRED', 'Storage configuration is required.');
  return {email: email, mode: 'owner'};
}
function rpc_(fn) {
  try { const actor = requireOwner_(); return {ok: true, data: fn(actor)}; }
  catch (err) {
    const messages = {
      ACCESS_DENIED: 'Sign in with the configured owner account.', CONFIG_REQUIRED: 'Complete the owner installation setup.',
      VALIDATION: 'Review the highlighted fields.', CONFLICT: 'This record changed. Reload the saved version before trying again.',
      BUSY: 'Another operation is in progress. Try again shortly.', RECOVERY_REQUIRED: 'Storage needs recovery. Open Settings for help.',
      FEATURE_DISABLED: 'This optional feature is unavailable.', QUOTA: 'A Google service limit was reached. Try again later.'
    };
    const code = Object.prototype.hasOwnProperty.call(messages, err.code) ? err.code : (/quota|too many times|limit exceeded/i.test(String(err.message)) ? 'QUOTA' : 'INTERNAL');
    return {ok: false, error: {code: code, message: messages[code] || 'The action could not be completed. Your draft is still available.', fieldErrors: err.code === 'VALIDATION' ? (err.fieldErrors || {}) : {}, retryable: ['BUSY','QUOTA','INTERNAL'].indexOf(code) >= 0}};
  }
}
