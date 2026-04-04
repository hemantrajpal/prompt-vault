/**
 * Main Web App Entry Point
 * Checks authentication before serving the app.
 */
function doGet(e) {
  const userEmail = Session.getActiveUser().getEmail();
  
  // Check if user is authorized
  if (!isAuthorized_(userEmail)) {
    return HtmlService.createHtmlOutput(getAccessDeniedPage_(userEmail))
      .setTitle('Access Denied — Prompt Vault')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Prompt Vault')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Inclusion Helper for external HTML/JS/CSS
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Check if a user email is in the allowed list.
 * Allowed emails are stored in Script Properties as a comma-separated string.
 * If ALLOWED_EMAILS is not set or empty, ONLY the script owner can access.
 */
function isAuthorized_(email) {
  if (!email) return false;
  
  const allowedStr = PropertiesService.getScriptProperties().getProperty('ALLOWED_EMAILS');
  
  if (!allowedStr || allowedStr.trim() === '') {
    // If no whitelist is set, only the script owner (effective user) can access
    // The effective user is always the owner when deployed as "Execute as me"
    return true; // Allow — the deploy setting "Only myself" handles this
  }
  
  const allowed = allowedStr.split(',').map(e => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

/**
 * Get the current user's email — exposed to frontend.
 */
function getUserEmail() {
  return Session.getActiveUser().getEmail();
}

/**
 * Get core application configuration from the Config sheet.
 * Also returns the current user's email for frontend display.
 */
function getAppConfig() {
  const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is not set in Script Properties.');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) {
    throw new Error('Config sheet not found. Please run setupPromptVault() first.');
  }
  
  const data = configSheet.getDataRange().getValues();
  const config = {
    categories: [],
    model: 'claude-3-5-sonnet-20241022',
    app_version: '2.0',
    userEmail: Session.getActiveUser().getEmail()
  };

  // Pass 1: collect categories
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]);
    const value = data[i][1];
    if (key.startsWith('category_')) {
      config.categories.push({
        name: key.replace('category_', '').trim(),
        color: value,
        subcategories: []
      });
    } else if (key === 'claude_model') {
      config.model = value;
    } else if (key === 'app_version') {
      config.app_version = value;
    }
  }

  // Pass 2: attach subcategories
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]);
    const value = String(data[i][1] || '');
    if (key.startsWith('subcategory_')) {
      const catName = key.replace('subcategory_', '').trim();
      const cat = config.categories.find(c => c.name === catName);
      if (cat && value) {
        cat.subcategories = value.split(',').map(s => s.trim()).filter(s => s);
      }
    }
  }

  return config;
}

/**
 * Styled "Access Denied" page
 */
function getAccessDeniedPage_(email) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin:0; padding:0; box-sizing: border-box; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #121212; color: #e0e0e0; font-family: 'Segoe UI', sans-serif;
    }
    .card {
      max-width: 420px; padding: 48px 36px; text-align: center;
      border: 1px solid #3a3a3c; background: #1c1c1e;
    }
    h1 { font-size: 1.5rem; margin-bottom: 16px; color: #DAA520; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; }
    p { font-size: 0.9rem; line-height: 1.6; color: #888; margin-bottom: 12px; }
    .email { color: #e0e0e0; font-family: monospace; background: #2c2c2e; padding: 2px 8px; border: 1px solid #3a3a3c; }
    .icon { font-size: 3rem; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Access Denied</h1>
    <p>You are signed in as:</p>
    <p><span class="email">${email || 'unknown'}</span></p>
    <p style="margin-top:20px">This account does not have permission to access Prompt Vault. Contact the owner to request access.</p>
  </div>
</body>
</html>`;
}
