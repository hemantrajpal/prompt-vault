import {test} from 'node:test';import assert from 'node:assert/strict';import {initialized} from './helpers/fake-sheets.mjs';
test('locked reads reuse one table fetch and refresh on the next invocation',()=>{
 const f=initialized(),g=f.g,original=g.Sheets.Spreadsheets.Values.get;let reads=0;g.Sheets.Spreadsheets.Values.get=(...args)=>{reads++;return original(...args);};
 g.withVaultLock_(()=>{g.readRecord_('_Config','install');g.readRecord_('_Config','install');});assert.equal(reads,1);
 g.withVaultLock_(()=>g.readRecord_('_Config','install'));assert.equal(reads,2);
});
test('lost write responses discard cached rows before recovery reads',()=>{
 const f=initialized(),g=f.g;g.withVaultLock_(()=>{g.readRawRows_('_Config');f.failAt(1,true);assert.throws(()=>g.putRecord_('_Config','proof',{saved:true}));assert.equal(g.readRecord_('_Config','proof').saved,true);});
});
