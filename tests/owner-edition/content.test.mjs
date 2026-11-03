import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {initialized,success,category} from './helpers/fake-sheets.mjs';
test('four draft website workflows can be validated and saved with declared inputs',()=>{
 assert(existsSync('content/packs/website.json'),'website pack must exist');const pack=JSON.parse(readFileSync('content/packs/website.json','utf8'));assert.equal(pack.workflows.length,4);
 const {g}=initialized(),c=category(g);for(const [i,w] of pack.workflows.entries()){assert.equal(w.workflow.reviewStatus,'draft');g.validateWorkflow_(w.workflow);const ack=success(g.savePromptV2({operationId:'content-'+i,expectedRevision:0,record:{...w,categoryId:c.id}}));assert(ack.record.variables.length>0);}
});
