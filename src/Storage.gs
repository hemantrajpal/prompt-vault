const VAULT_TABLES_ = ['_Config','_Prompts','_Categories','_Revisions','_Operations','_OperationPayloads','_ImportPlans','_Quarantine'];
// Invocation-local, held only while the vault lock is owned. Never shared across requests.
var vaultReadCache_=null;
function sheetId_() { return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); }
function tableRange_(table,row) { assertValid_(VAULT_TABLES_.indexOf(table)>=0,'table','Invalid storage table.');return "'"+table+"'!A"+(row||1)+':B'; }
function readRawRows_(table) {
  tableRange_(table,1);
  if(vaultReadCache_&&Object.prototype.hasOwnProperty.call(vaultReadCache_,table))return vaultReadCache_[table].map(function(r){return r.slice();});
  const rows=Sheets.Spreadsheets.Values.get(sheetId_(),tableRange_(table,1),{valueRenderOption:'UNFORMATTED_VALUE'}).values||[];
  if(vaultReadCache_)vaultReadCache_[table]=rows.map(function(r){return r.slice();});return rows;
}
function writeRawRows_(table,row,rows) {
  rows.forEach(function(r){r.forEach(function(c){assertValid_(typeof c==='string' && c.length<=40000,'storage','Invalid or oversized storage cell.');});});
  try{Sheets.Spreadsheets.Values.update({values:rows},sheetId_(),tableRange_(table,row),{valueInputOption:'RAW'});}
  catch(error){if(vaultReadCache_)delete vaultReadCache_[table];throw error;}
  if(vaultReadCache_&&vaultReadCache_[table])rows.forEach(function(r,i){vaultReadCache_[table][row-1+i]=r.slice();});
}
function tableRecords_(table) {
  const rows=readRawRows_(table);if(!rows.length || rows[0][0]!=='id'||rows[0][1]!=='json')throw vaultError_('RECOVERY_REQUIRED','Unexpected storage headers.');
  return rows.slice(1).filter(function(r){return r[0];}).map(function(r){try{return {key:r[0],value:JSON.parse(r[1])};}catch(_){throw vaultError_('RECOVERY_REQUIRED','Invalid storage record.');}});
}
function readRecord_(table,key) {
  const entries=tableRecords_(table).filter(function(r){return r.key===key;});
  if(entries.length>1)throw vaultError_('RECOVERY_REQUIRED','Duplicate storage identity.');return entries.length?entries[0].value:null;
}
function putRecord_(table,key,value) {
  const rows=readRawRows_(table),matches=[];rows.forEach(function(r,i){if(r[0]===key)matches.push(i+1);});
  if(matches.length>1)throw vaultError_('RECOVERY_REQUIRED','Duplicate storage identity.');
  writeRawRows_(table,matches[0]||rows.length+1,[[key,canonicalJson_(value)]]);
}
function withVaultLock_(fn) {
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw vaultError_('BUSY','Storage is busy.');
  vaultReadCache_=Object.create(null);try{return fn();}finally{vaultReadCache_=null;lock.releaseLock();}
}
function settings_() {
  const config=readRecord_('_Config','install');if(!config||config.schemaVersion!==2)throw vaultError_('CONFIG_REQUIRED','Run owner setup.');return config;
}
