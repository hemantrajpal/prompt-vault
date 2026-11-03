/** Run from the Script editor on a disposable install first. Never clears a tab. */
function setupPromptVault_() {
  const actor=requireOwner_();return withVaultLock_(function(){
    const ss=SpreadsheetApp.openById(sheetId_());
    VAULT_TABLES_.forEach(function(name){
      if(!ss.getSheetByName(name))ss.insertSheet(name);
      const rows=readRawRows_(name);if(!rows.length)writeRawRows_(name,1,[['id','json']]);
      else if(rows[0][0]!=='id'||rows[0][1]!=='json')throw vaultError_('RECOVERY_REQUIRED','Existing table needs reviewed migration.');
    });
    const previous=readRecord_('_Config','install');
    if(previous && (previous.schemaVersion!==2 || previous.ownerEmail!==actor.email))throw vaultError_('RECOVERY_REQUIRED','Installation configuration does not match.');
    if(!previous)putRecord_('_Config','install',{schemaVersion:2,installId:Utilities.getUuid(),ownerEmail:actor.email,createdAt:new Date().toISOString()});
    return {schemaVersion:2,created:!previous};
  });
}
