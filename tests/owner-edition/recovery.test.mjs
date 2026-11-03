import {test} from 'node:test';import assert from 'node:assert/strict';import {initialized,success,category} from './helpers/fake-sheets.mjs';
for(const lost of [false,true])test('each interrupted write preserves old or complete committed state; lostResponse='+lost,()=>{
 for(let boundary=1;boundary<=12;boundary++){
  const f=initialized(),g=f.g,c=category(g);const args={operationId:'recover-op',expectedRevision:0,record:{title:'Recovered',body:'Exact',categoryId:c.id}};
  f.failAt(boundary,lost);g.savePromptV2(args);f.clearFailure();
  let v=success(g.getVaultV2());assert(v.prompts.length===0||v.prompts.length===1);
  const ack=success(g.savePromptV2(args));v=success(g.getVaultV2());assert.equal(v.prompts.length,1);assert.equal(v.prompts[0].id,ack.id);assert.equal(v.prompts[0].body,'Exact');assert.equal(success(g.savePromptV2(args)).id,ack.id);
 }
});
test('lock contention returns BUSY without modifying content',()=>{const f=initialized();f.lock();assert.equal(f.g.getVaultV2().error.code,'BUSY');});
test('operation IDs are bound to the endpoint intent, not just arguments',()=>{
 const {g}=initialized(),c=category(g);const created=success(g.savePromptV2({operationId:'create',expectedRevision:0,record:{title:'A',body:'Exact',categoryId:c.id}}));
 const args={operationId:'same',id:created.id,expectedRevision:1};success(g.archivePromptV2(args));
 assert.equal(g.restorePromptV2(args).error?.code,'CONFLICT');assert.equal(success(g.getVaultV2()).prompts[0].status,'archived');
});
test('multi-chunk intent can be retried after every partial payload write',()=>{
 for(const lost of [false,true])for(let at=1;at<10;at++){
  const f=initialized(),g=f.g,c=category(g),args={operationId:'large',expectedRevision:0,record:{title:'Long',body:'x'.repeat(12000),categoryId:c.id}};
  f.failAt(at,lost);g.savePromptV2(args);f.clearFailure();success(g.savePromptV2(args));assert.equal(success(g.getVaultV2()).prompts[0].body.length,12000);
 }
});
test('large valid snapshot is rejected before PREPARED when stored envelope exceeds limit',()=>{
 const {g}=initialized(),c=category(g),workflow={packId:'test',contentVersion:'0.1',job:'Test',requiredContext:'Facts',example:'x',expectedOutput:'Draft',reviewChecklist:['Review'],limits:[],reviewStatus:'draft',contentOwner:'Owner',lastTested:null};
 const record={title:'Large',body:'x'.repeat(20000),notes:'n'.repeat(4000),negativePrompt:'n'.repeat(4000),categoryId:c.id,workflow};
 const withMeta=g.validatePrompt_({...record,...g.metadata_({email:'owner@example.test'},null)});workflow.example='x'.repeat(39990-g.canonicalJson_(withMeta).length+1);
 const result=g.savePromptV2({operationId:'oversize',expectedRevision:0,record});assert.equal(result.error?.code,'VALIDATION');assert.equal(success(g.getVaultV2()).pendingOperation,null);
 success(g.savePromptV2({operationId:'small-after-large',expectedRevision:0,record:{title:'Still works',body:'Small',categoryId:c.id}}));
});
