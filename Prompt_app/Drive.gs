/**
 * Upload a base64-encoded image to Google Drive and return a shareable URL.
 * Images are stored in a folder called "PromptVault_Images".
 */
function uploadImageToDrive(base64Data, fileName) {
  // Parse base64 data URL: "data:image/png;base64,iVBOR..."
  const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image data');
  
  const mimeType = matches[1];
  const data = Utilities.base64Decode(matches[2]);
  const blob = Utilities.newBlob(data, mimeType, sanitizeFileName(fileName) + getExtension(mimeType));
  
  // Get or create the images folder
  const folder = getOrCreateImageFolder_();
  const file = folder.createFile(blob);
  
  // Make it viewable by anyone with the link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Return a thumbnail URL — more reliable for embedding in browsers
  // uc?id= can redirect to download; thumbnail?id= always renders inline
  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
}

/**
 * Get or create the PromptVault_Images folder in the user's Drive.
 */
function getOrCreateImageFolder_() {
  const folderName = 'PromptVault_Images';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * Sanitize a filename for Drive storage.
 */
function sanitizeFileName(name) {
  return (name || 'image').replace(/[^a-zA-Z0-9_\- ]/g, '').substring(0, 50) + '_' + Date.now();
}

/**
 * Get file extension from MIME type.
 */
function getExtension(mimeType) {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return map[mimeType] || '.png';
}
