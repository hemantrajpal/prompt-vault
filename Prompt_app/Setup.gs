/**
 * DEBUG: Run this first to see what Script Properties are returning.
 * Check the Execution Log for output.
 */
function debugScriptProps() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log('All Script Properties: ' + JSON.stringify(props));
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  Logger.log('SPREADSHEET_ID value: "' + id + '"');
  Logger.log('Is null/empty: ' + (!id));
}

/**
 * Run this function ONCE to set up the Spreadsheet schema.
 * If Script Properties aren't working, pass the ID directly:
 *   setupPromptVault('1eIl2sODczMc5--o7ziA0ZwnBfZjK07PbTux8Z4yZtN8')
 */
function setupPromptVault(directId) {
  const SPREADSHEET_ID = directId || PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!SPREADSHEET_ID) {
    throw new Error('Please set SPREADSHEET_ID in Script Properties before running setup.');
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. Create Config Sheet
  let configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
  } else {
    configSheet.clear();
  }
  configSheet.appendRow(['Key', 'Value']);
  const defaultCategories = [
    { name: 'Marketing', color: '#7c3aed' },
    { name: 'Design', color: '#f59e0b' },
    { name: 'Copywriting', color: '#f43f5e' },
    { name: 'SEO', color: '#0d9488' },
    { name: 'Social Media', color: '#3b82f6' },
    { name: 'Image Generation', color: '#ea580c' },
    { name: 'Custom', color: '#64748b' }
  ];
  defaultCategories.forEach(cat => {
    configSheet.appendRow(['category_' + cat.name, cat.color]);
  });
  configSheet.appendRow(['claude_model', 'claude-3-5-sonnet-20241022']);
  configSheet.appendRow(['app_version', '1.0']);
  configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  configSheet.autoResizeColumns(1, 2);

  // 2. Create _Index Sheet
  let indexSheet = ss.getSheetByName('_Index');
  if (!indexSheet) {
    indexSheet = ss.insertSheet('_Index');
  } else {
    indexSheet.clear();
  }
  const indexHeaders = ['PromptID', 'Title', 'Category', 'Subcategory', 'Tags', 'Model', 'ImageURL', 'VariableCount', 'CreatedBy', 'CreatedAt', 'ModifiedAt', 'Status'];
  indexSheet.appendRow(indexHeaders);
  indexSheet.getRange(1, 1, 1, indexHeaders.length).setFontWeight('bold');

  // 3. Create Category Sheets
  defaultCategories.forEach(cat => {
    let catSheet = ss.getSheetByName(cat.name);
    if (!catSheet) {
      catSheet = ss.insertSheet(cat.name);
    } else {
      catSheet.clear();
    }
    const catHeaders = ['PromptID', 'Title', 'Subcategory', 'Tags', 'Prompt', 'Variables', 'Model', 'ImageURL', 'ImprovementNotes', 'CreatedBy', 'CreatedAt', 'ModifiedAt'];
    if (cat.name === 'Image Generation') {
      catHeaders.push('NegativePrompt');
    }
    catSheet.appendRow(catHeaders);
    catSheet.getRange(1, 1, 1, catHeaders.length).setFontWeight('bold');
  });

  // Remove default "Sheet1" if it exists and is not the only sheet
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }

  Logger.log('Setup complete! The Google Sheet is now configured for Prompt Vault.');
}
