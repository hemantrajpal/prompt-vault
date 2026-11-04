function doGet() {
  try { requireOwner_(); return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Prompt Vault').addMetaTag('viewport','width=device-width, initial-scale=1'); }
  catch (error) { return entryErrorPage_(error); }
}
/** Explain installation failures without granting access or exposing account/data details. */
function entryErrorPage_(error) {
  const setup=error&&error.code==='CONFIG_REQUIRED',denied=error&&error.code==='ACCESS_DENIED';
  const state=setup?'setup-required':denied?'access-denied':'load-error';
  const title=setup?'Finish setting up Prompt Vault':denied?'Access denied':'Couldn’t open Prompt Vault';
  const message=setup?'The owner account and spreadsheet connection need to be configured before this app can open.':denied?'Open this app with the Google account configured as its owner.':'The app could not load. Refresh the page and try again. If the problem continues, check the project in the Apps Script editor.';
  let recovery='';
  if(setup){
    const editor='https://script.google.com/home/projects/'+encodeURIComponent(ScriptApp.getScriptId())+'/settings';
    recovery='<ol><li>In Project Settings, set the <code>OWNER_EMAIL</code> and <code>SPREADSHEET_ID</code> Script Properties.</li><li>Follow the installation guide to initialize storage and complete Google authorization.</li><li>Reload this app.</li></ol><a href="'+editor+'" target="_blank" rel="noopener noreferrer">Open project settings</a><a class="guide" href="https://github.com/hemantrajpal/prompt-vault/blob/main/docs/owner-edition/INSTALL.md" target="_blank" rel="noopener noreferrer">Installation guide</a>';
  }
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>:root{--bg:#161615;--fg:#eeeae3;--card:#1e1e1c;--muted:#aaa69e;--border:#35342f;--accent:#f5b544;--accent-ink:#2b210e}*{box-sizing:border-box}body{margin:0;padding:32px 20px;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,sans-serif}.notice{max-width:620px;margin:8vh auto;padding:28px;background:var(--card);border:1px solid var(--border);border-radius:12px}h1{font-size:26px;line-height:1.3;letter-spacing:-.5px;overflow-wrap:anywhere;margin:0 0 16px}p,ol{color:var(--muted);margin:0 0 24px}ol{padding-left:24px}li+li{margin-top:12px}code{font-size:.9em;overflow-wrap:anywhere}a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;background:var(--accent);color:var(--accent-ink);border-radius:7px;text-decoration:none;font-weight:600;border:1px solid transparent}a.guide{margin-top:12px;display:flex;background:transparent;color:var(--fg);border-color:var(--border)}a:focus-visible{outline:2px solid var(--accent);outline-offset:4px}@media(max-width:480px){body{padding:20px 16px}.notice{margin:24px auto;padding:20px}h1{font-size:23px}}</style></head><body><main class="notice" data-state="'+state+'"><h1>'+title+'</h1><p>'+message+'</p>'+recovery+'</main></body></html>').setTitle(title);
}
function include_(name) {if(['_Styles','_Icons','_Core','_Api','_UI','_Scripts'].indexOf(name)<0)throw vaultError_('VALIDATION','Unknown template.');return HtmlService.createHtmlOutputFromFile(name).getContent();}
