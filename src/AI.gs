/** Optional AI is intentionally unavailable in the owner-core build. */
function enhancePrompt(rawPrompt) { requireOwner_(); throw vaultError_('FEATURE_DISABLED', 'AI assistance is disabled.'); }
function categorizePrompt(rawPrompt) { requireOwner_(); throw vaultError_('FEATURE_DISABLED', 'AI assistance is disabled.'); }
function generatePrompt(description) { requireOwner_(); throw vaultError_('FEATURE_DISABLED', 'AI assistance is disabled.'); }
