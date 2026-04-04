/**
 * Utility to get Spreadsheet
 */
function getSpreadsheet() {
  const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID not set');
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Utility to convert sheet data to array of objects
 */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// ==================== PROMPTS ====================

function getAllPrompts() {
  const ss = getSpreadsheet();
  const userEmail = Session.getActiveUser().getEmail();

  // Read category names from Config sheet
  const configSheet = ss.getSheetByName('Config');
  if (!configSheet) return [];
  const configData = configSheet.getDataRange().getValues();
  const categories = configData
    .filter(row => String(row[0]).startsWith('category_'))
    .map(row => String(row[0]).replace('category_', ''));

  const allPrompts = [];

  // Read FULL prompt data from each category sheet (includes Prompt body, Variables, etc.)
  categories.forEach(catName => {
    const catSheet = ss.getSheetByName(catName);
    if (!catSheet) return;
    const data = catSheet.getDataRange().getValues();
    if (data.length < 2) return; // Only headers, no data
    const headers = data[0];
    data.slice(1).forEach(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      obj.Category = catName; // Inject since it's the sheet name, not a column
      // Multi-user filter: show only current user's prompts
      if (!userEmail || String(obj.CreatedBy) === String(userEmail)) {
        allPrompts.push(obj);
      }
    });
  });

  // Sort newest first
  allPrompts.sort((a, b) => {
    const da = String(a.ModifiedAt || a.CreatedAt || '');
    const db = String(b.ModifiedAt || b.CreatedAt || '');
    return db > da ? 1 : -1;
  });

  return allPrompts;
}

function getPromptsByCategory(categoryName) {
  const ss = getSpreadsheet();
  const catSheet = ss.getSheetByName(categoryName);
  if (!catSheet) return [];
  return sheetToObjects(catSheet);
}

function getPromptById(id, categoryName) {
  const prompts = getPromptsByCategory(categoryName);
  return prompts.find(p => p.PromptID === id) || null;
}

function savePrompt(promptObj) {
  const ss = getSpreadsheet();
  const userEmail = Session.getActiveUser().getEmail();

  // Ensure we have a PromptID
  if (!promptObj.PromptID) {
    promptObj.PromptID = Utilities.getUuid();
  }

  // ── Step 1: Look up the prompt in _Index to find its CURRENT (old) category ──
  // This is the single source of truth for whether a prompt exists and where it lives.
  const indexSheet = ss.getSheetByName('_Index');
  if (!indexSheet) throw new Error('_Index sheet not found. Did you run setupPromptVault()?');

  const indexData = indexSheet.getDataRange().getValues();
  const indexHeaders = indexData[0] || [];
  const idxID  = indexHeaders.indexOf('PromptID');
  const idxCat = indexHeaders.indexOf('Category');
  const idxCBy = indexHeaders.indexOf('CreatedBy');
  const idxCAt = indexHeaders.indexOf('CreatedAt');

  let indexRowIndex   = -1;
  let oldCategory     = null;
  let existingCreatedBy = '';
  let existingCreatedAt = '';

  for (let i = 1; i < indexData.length; i++) {
    if (String(indexData[i][idxID > -1 ? idxID : 0]) === String(promptObj.PromptID)) {
      indexRowIndex   = i + 1; // 1-based
      oldCategory     = idxCat > -1 ? String(indexData[i][idxCat]) : null;
      existingCreatedBy = idxCBy > -1 ? indexData[i][idxCBy] : '';
      existingCreatedAt = idxCAt > -1 ? indexData[i][idxCAt] : '';
      break;
    }
  }

  const isExisting       = indexRowIndex > -1;
  const isCategoryChange = isExisting && oldCategory && oldCategory !== String(promptObj.Category);

  // ── Step 2: Ownership & metadata ──
  if (isExisting) {
    if (existingCreatedBy && String(existingCreatedBy) !== String(userEmail)) {
      throw new Error('You do not have permission to edit this prompt.');
    }
    promptObj.CreatedAt  = existingCreatedAt;
    promptObj.CreatedBy  = existingCreatedBy || userEmail;
  } else {
    // Genuinely new prompt
    promptObj.CreatedAt = new Date().toISOString();
    promptObj.CreatedBy = userEmail;
  }
  promptObj.ModifiedAt = new Date().toISOString();

  // ── Step 3: If the category changed, delete from the OLD sheet ──
  if (isCategoryChange) {
    const oldCatSheet = ss.getSheetByName(oldCategory);
    if (oldCatSheet) {
      const oldData = oldCatSheet.getDataRange().getValues();
      for (let i = 1; i < oldData.length; i++) {
        if (String(oldData[i][0]) === String(promptObj.PromptID)) {
          oldCatSheet.deleteRow(i + 1);
          break;
        }
      }
    }
  }

  // ── Step 4: Parse variables ──
  let varCount = 0;
  if (promptObj.Variables) {
    try {
      const vars = typeof promptObj.Variables === 'string'
        ? JSON.parse(promptObj.Variables) : promptObj.Variables;
      varCount = Array.isArray(vars) ? vars.length : 0;
      promptObj.Variables = JSON.stringify(vars);
    } catch (e) { varCount = 0; }
  }
  if (promptObj.ImprovementNotes && typeof promptObj.ImprovementNotes !== 'string') {
    promptObj.ImprovementNotes = JSON.stringify(promptObj.ImprovementNotes);
  }

  // ── Step 5: Write to the NEW category sheet ──
  const catSheet = ss.getSheetByName(promptObj.Category);
  if (!catSheet) throw new Error('Category sheet "' + promptObj.Category + '" not found.');

  const catData    = catSheet.getDataRange().getValues();
  const catHeaders = catData[0] || [];
  const catRowData = catHeaders.map(h => promptObj[h] !== undefined ? promptObj[h] : '');

  // Find the row in the new sheet (only relevant if it's an in-place edit, not a move)
  let newCatRowIndex = -1;
  if (!isCategoryChange) {
    for (let i = 1; i < catData.length; i++) {
      if (String(catData[i][0]) === String(promptObj.PromptID)) {
        newCatRowIndex = i + 1;
        break;
      }
    }
  }

  if (newCatRowIndex > -1) {
    catSheet.getRange(newCatRowIndex, 1, 1, catHeaders.length).setValues([catRowData]);
  } else {
    catSheet.appendRow(catRowData);
  }

  // ── Step 6: Update _Index ──
  const indexObj     = { ...promptObj, VariableCount: varCount, Status: 'Active' };
  const indexRowData = indexHeaders.map(h => indexObj[h] !== undefined ? indexObj[h] : '');

  if (indexRowIndex > -1) {
    indexSheet.getRange(indexRowIndex, 1, 1, indexHeaders.length).setValues([indexRowData]);
  } else {
    indexSheet.appendRow(indexRowData);
  }

  return { success: true, promptId: promptObj.PromptID };
}


function deletePrompt(id, categoryName) {
  const ss = getSpreadsheet();
  
  // Remove from Category Sheet
  const catSheet = ss.getSheetByName(categoryName);
  if (catSheet) {
    const catData = catSheet.getDataRange().getValues();
    for (let i = 1; i < catData.length; i++) {
      if (String(catData[i][0]) === String(id)) {
        catSheet.deleteRow(i + 1);
        break;
      }
    }
  }

  // Remove from _Index Sheet
  const indexSheet = ss.getSheetByName('_Index');
  if (indexSheet) {
    const indexData = indexSheet.getDataRange().getValues();
    for (let i = 1; i < indexData.length; i++) {
      if (String(indexData[i][0]) === String(id)) {
        indexSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  return true;
}

function searchPrompts(query) {
  const queryLower = query.toLowerCase();
  return getAllPrompts().filter(p => 
    (p.Title && p.Title.toLowerCase().includes(queryLower)) || 
    (p.Tags && p.Tags.toLowerCase().includes(queryLower))
  );
}

// ==================== CATEGORIES ====================

function getCategories() {
  const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const configSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Config');
  const data = configSheet.getDataRange().getValues();
  const categories = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].startsWith('category_')) {
      categories.push({
        name: data[i][0].replace('category_', '').trim(),
        color: data[i][1]
      });
    }
  }
  return categories;
}

// ==================== BULK CATEGORY SAVE ====================

/**
 * Full sync of categories to Config sheet.
 * Deletes ALL old category_/subcategory_ rows and re-inserts from provided array.
 * This correctly handles deletions, color changes, and subcategory changes.
 * Ensures Google Sheet tabs exist for any NEW categories.
 */
function saveCategories(categories) {
  const ss = getSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  if (!configSheet) throw new Error('Config sheet not found.');

  // Track which category names currently have sheets
  const existingSheetNames = new Set(ss.getSheets().map(s => s.getName()));

  // 1. Remove all existing category_ and subcategory_ rows (reverse order to preserve indices)
  const data = configSheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const key = String(data[i][0]);
    if (key.startsWith('category_') || key.startsWith('subcategory_')) {
      configSheet.deleteRow(i + 1);
    }
  }

  // 2. Re-insert all categories (this naturally removes deleted ones)
  categories.forEach(cat => {
    configSheet.appendRow(['category_' + cat.name, cat.color || '#64748b']);
    // Persist subcategories if any
    if (cat.subcategories && cat.subcategories.length > 0) {
      configSheet.appendRow(['subcategory_' + cat.name, cat.subcategories.join(',')]);
    }
    // Create a sheet for this category if it doesn't exist yet
    if (!existingSheetNames.has(cat.name)) {
      const catSheet = ss.insertSheet(cat.name);
      const catHeaders = ['PromptID', 'Title', 'Subcategory', 'Tags', 'Prompt', 'Variables',
                          'Model', 'ImageURL', 'ImprovementNotes', 'CreatedBy', 'CreatedAt', 'ModifiedAt'];
      catSheet.appendRow(catHeaders);
      catSheet.getRange(1, 1, 1, catHeaders.length).setFontWeight('bold');
    }
  });

  return { success: true };
}

function addCategory(name, color) {
  const ss = getSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  configSheet.appendRow(['category_' + name, color]);

  let catSheet = ss.getSheetByName(name);
  if (!catSheet) {
    catSheet = ss.insertSheet(name);
    const catHeaders = ['PromptID', 'Title', 'Tags', 'Prompt', 'Variables', 'Model', 'ImprovementNotes', 'CreatedBy', 'CreatedAt', 'ModifiedAt'];
    catSheet.appendRow(catHeaders);
    catSheet.getRange(1, 1, 1, catHeaders.length).setFontWeight('bold');
  }
  return getCategories();
}

function updateCategory(oldName, newName, newColor) {
  const ss = getSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  const data = configSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'category_' + oldName) {
      configSheet.getRange(i + 1, 1, 1, 2).setValues([['category_' + newName, newColor]]);
      break;
    }
  }

  if (oldName !== newName) {
    const catSheet = ss.getSheetByName(oldName);
    if (catSheet) {
      catSheet.setName(newName);
    }
    
    // Update _Index entries
    const indexSheet = ss.getSheetByName('_Index');
    const indexData = indexSheet.getDataRange().getValues();
    const headers = indexData[0];
    const catCol = headers.indexOf('Category');
    if (catCol > -1) {
      for (let i = 1; i < indexData.length; i++) {
        if (indexData[i][catCol] === oldName) {
          indexSheet.getRange(i + 1, catCol + 1).setValue(newName);
        }
      }
    }
  }
  return getCategories();
}

/**
 * Delete a category and handle its prompts.
 * action: 'archive' = move prompts to _Archive sheet
 *         'delete'  = permanently delete all prompts
 */
function deleteCategory(name, action) {
  const ss = getSpreadsheet();
  const userEmail = Session.getActiveUser().getEmail();
  let archivedCount = 0;

  const catSheet = ss.getSheetByName(name);
  if (catSheet) {
    const catData = catSheet.getDataRange().getValues();

    if (action === 'archive' && catData.length > 1) {
      // Get or create _Archive sheet
      let archiveSheet = ss.getSheetByName('_Archive');
      if (!archiveSheet) {
        archiveSheet = ss.insertSheet('_Archive');
        const archiveHeaders = ['OriginalCategory', 'ArchivedAt', 'PromptID', 'Title',
          'Subcategory', 'Tags', 'Prompt', 'Variables', 'Model', 'ImageURL',
          'ImprovementNotes', 'NegativePrompt', 'CreatedBy', 'CreatedAt', 'ModifiedAt'];
        archiveSheet.appendRow(archiveHeaders);
        archiveSheet.getRange(1, 1, 1, archiveHeaders.length).setFontWeight('bold');
      }

      const catHeaders = catData[0];
      const archiveHeaders = archiveSheet.getDataRange().getValues()[0];
      const now = new Date().toISOString();

      catData.slice(1).forEach(row => {
        const obj = {};
        catHeaders.forEach((h, i) => { obj[h] = row[i]; });
        const archiveRow = archiveHeaders.map(h => {
          if (h === 'OriginalCategory') return name;
          if (h === 'ArchivedAt') return now;
          return obj[h] !== undefined ? obj[h] : '';
        });
        archiveSheet.appendRow(archiveRow);
        archivedCount++;
      });
    }
    // Delete the category sheet (for both archive and delete actions)
    ss.deleteSheet(catSheet);
  }

  // Remove from _Index sheet
  const indexSheet = ss.getSheetByName('_Index');
  if (indexSheet) {
    const indexData = indexSheet.getDataRange().getValues();
    const catColIdx = indexData.length > 0 ? indexData[0].indexOf('Category') : -1;
    if (catColIdx > -1) {
      for (let i = indexData.length - 1; i >= 1; i--) {
        if (String(indexData[i][catColIdx]) === name) {
          indexSheet.deleteRow(i + 1);
        }
      }
    }
  }

  // Remove category_ and subcategory_ rows from Config
  const configSheet = ss.getSheetByName('Config');
  if (configSheet) {
    const configData = configSheet.getDataRange().getValues();
    const keysToRemove = ['category_' + name, 'subcategory_' + name];
    for (let i = configData.length - 1; i >= 1; i--) {
      if (keysToRemove.includes(String(configData[i][0]))) {
        configSheet.deleteRow(i + 1);
      }
    }
  }

  return { success: true, archivedCount: archivedCount };
}

// ==================== ARCHIVE ====================

/** Get all archived prompts for the current user */
function getArchivedPrompts() {
  const ss = getSpreadsheet();
  const userEmail = Session.getActiveUser().getEmail();
  const archiveSheet = ss.getSheetByName('_Archive');
  if (!archiveSheet) return [];
  return sheetToObjects(archiveSheet).filter(p =>
    !userEmail || String(p.CreatedBy) === String(userEmail)
  );
}

/** Restore an archived prompt to a new category */
function restoreArchivedPrompt(promptId, newCategory) {
  const ss = getSpreadsheet();
  const archiveSheet = ss.getSheetByName('_Archive');
  if (!archiveSheet) throw new Error('No archive found.');

  const data = archiveSheet.getDataRange().getValues();
  const headers = data[0];
  let rowIndex = -1;
  let obj = null;

  for (let i = 1; i < data.length; i++) {
    const id = headers.indexOf('PromptID');
    if (String(data[i][id]) === String(promptId)) {
      rowIndex = i + 1;
      obj = {};
      headers.forEach((h, j) => { obj[h] = data[i][j]; });
      break;
    }
  }
  if (!obj) throw new Error('Archived prompt not found.');

  // Save to new category
  obj.Category = newCategory;
  obj.ModifiedAt = new Date().toISOString();
  delete obj.OriginalCategory;
  delete obj.ArchivedAt;
  savePrompt(obj);

  // Delete from archive
  if (rowIndex > 0) archiveSheet.deleteRow(rowIndex);
  return { success: true };
}

/** Permanently delete an archived prompt */
function deleteArchivedPrompt(promptId) {
  const ss = getSpreadsheet();
  const archiveSheet = ss.getSheetByName('_Archive');
  if (!archiveSheet) return { success: true };
  const data = archiveSheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('PromptID');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(promptId)) {
      archiveSheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

// ==================== TAGS ====================

function getAllTags() {
  const prompts = getAllPrompts();
  const tagsSet = new Set();
  prompts.forEach(p => {
    if (p.Tags) {
      p.Tags.split(',').forEach(tag => tagsSet.add(tag.trim()));
    }
  });
  return Array.from(tagsSet).filter(t => t);
}
