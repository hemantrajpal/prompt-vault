function doGet() {
  try { requireOwner_(); return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Prompt Vault').addMetaTag('viewport','width=device-width, initial-scale=1'); }
  catch (_) { return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><meta charset="utf-8"><title>Prompt Vault · Access denied</title><body><h1>Access denied</h1><p>Sign in with the configured owner account. If you own this install, check its configuration in the Script editor.</p></body></html>').setTitle('Access denied'); }
}
function include_(name) {if(['_Styles','_Icons','_Core','_Api','_UI','_Scripts'].indexOf(name)<0)throw vaultError_('VALIDATION','Unknown template.');return HtmlService.createHtmlOutputFromFile(name).getContent();}
