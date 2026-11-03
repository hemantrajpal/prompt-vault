/** No Drive scope or public-link upload in the owner-core build. */
function uploadImageToDrive(base64Data, fileName) {
  requireOwner_(); throw vaultError_('FEATURE_DISABLED', 'Image upload is disabled.');
}
