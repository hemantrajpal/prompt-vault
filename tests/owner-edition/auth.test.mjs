import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadGas,authServices,publicNames} from './helpers/load-gas.mjs';
const valid={OWNER_EMAIL:'owner@example.test',SPREADSHEET_ID:'fake-sheet'};
for(const [label,email,props,code] of [['blank','',valid,'ACCESS_DENIED'],['wrong','other@example.test',valid,'ACCESS_DENIED'],['missing owner','owner@example.test',{SPREADSHEET_ID:'fake-sheet'},'CONFIG_REQUIRED'],['missing sheet','owner@example.test',{OWNER_EMAIL:'owner@example.test'},'CONFIG_REQUIRED']]){
 test(`every RPC rejects ${label} before Google data access`,()=>{
  const s=authServices(email,props),g=loadGas(s.services);
  for(const name of publicNames()){
   try { const r=g[name]({}); assert.equal(r?.ok,false,`${name} must reject`);assert.equal(r.error.code,code,name); }
   catch(e){assert.equal(e.code,code,`${name}: ${e.message}`);}
  }
  assert.equal(s.accesses(),0);
 });
}
test('empty allowlist grants no authority and normalized configured owner is accepted',()=>{
 const s=authServices(' OWNER@example.test ',valid),g=loadGas(s.services);
 assert.equal(typeof g.requireOwner_,'function');assert.equal(g.requireOwner_().email,'owner@example.test');
});
test('provider and upload are disabled for verified owner without provider or Drive calls',()=>{
 const s=authServices('owner@example.test',valid),g=loadGas(s.services);
 for(const name of ['enhancePrompt','categorizePrompt','generatePrompt','uploadImageToDrive'])assert.throws(()=>g[name]('synthetic'),e=>e.code==='FEATURE_DISABLED');
 assert.equal(s.accesses(),0);
});
