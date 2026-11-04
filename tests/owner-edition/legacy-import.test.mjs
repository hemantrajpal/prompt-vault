import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialized,success} from './helpers/fake-sheets.mjs';
const headers=['PromptID','Title','Subcategory','Tags','Prompt','Variables','Model','ImageURL','ImprovementNotes','CreatedBy','CreatedAt','ModifiedAt','NegativePrompt'];
const image={id:'synthetic_image_123',name:'Original image.png',mimeType:'image/png',size:'120',md5Checksum:'synthetic-checksum'};
function snapshot(){return {exportedAt:'2026-01-01',tabs:[{name:'Config',rows:[['category_Image Generation','#123456'],['category_Empty','#abcdef'],['subcategory_Image Generation','Products']]},{name:'Empty',rows:[headers]},{name:'Image Generation',rows:[headers,['old-1','Original','Products','Long original tag field '.repeat(3),'Create {{BRAND/PRODUCT}} and {{brand product}}.',JSON.stringify([{n:'BRAND/PRODUCT',l:'Brand / Product',p:'Acme'},{n:'brand product',l:'Other product',p:'Other'}]),'Image model','https://drive.google.com/thumbnail?id='+image.id+'&sz=w1200','Original notes','owner@example.test','2026-01-01T00:00:00Z','2026-02-01T00:00:00Z','No text']]}]};}
test('legacy migration preserves empty categories, original content and dates, and matches images by ID',()=>{
 const {g}=initialized(),source=snapshot(),orphan={...image,id:'unmatched_image_123',name:'Unmatched.png'};
 const p=g.prepareLegacyImport_(source,[image,orphan]);assert.deepEqual(JSON.parse(JSON.stringify(p.summary)),{prompts:1,categories:2,linkedDriveImages:1,unassignedImages:1,externalImages:0,normalizedTemplates:1});
 assert.equal(g.prepareLegacyImport_({...source,exportedAt:'2026-11-04'},[image,orphan]).operationId,p.operationId);
 const record=p.bundle.prompts[0];assert.equal(record.body,'Create {{brand_product}} and {{brand_product_2}}.');assert.equal(record.variables[0].label,'Brand / Product');assert.equal(record.provenance.originalTemplate,source.tabs[2].rows[1][4]);assert.match(record.notes,/Original notes\n\nOriginal tag field:/);assert.equal(record.attachments[0].assetId,image.id);
 const plan=success(g.previewImportV2(p.bundle)),args={operationId:p.operationId,planId:plan.planId};assert.equal(plan.issues.length,0);success(g.beginImportV2(args));success(g.advanceImportV2({operationId:p.operationId}));
 success(g.beginImportV2(args));success(g.advanceImportV2({operationId:p.operationId}));const vault=success(g.getVaultV2());assert.equal(vault.prompts.length,1);assert.equal(vault.categories.length,2);assert.equal(vault.prompts[0].createdAt,'2026-01-01T00:00:00.000Z');assert.equal(vault.prompts[0].modifiedAt,'2026-02-01T00:00:00.000Z');assert.equal(vault.categories.find(c=>c.name==='Image Generation').referenceImages[0].assetId,orphan.id);
});
test('migration fails closed on missing linked files or foreign creators',()=>{
 const {g}=initialized();assert.throws(()=>g.prepareLegacyImport_(snapshot(),[]),e=>e.code==='VALIDATION');const source=snapshot();source.tabs[2].rows[1][9]='foreign@example.test';assert.throws(()=>g.prepareLegacyImport_(source,[image]),e=>e.code==='VALIDATION');assert.equal(success(g.getVaultV2()).prompts.length,0);
});
test('invalid category image URLs and oversized references cannot enter storage',()=>{
 const {g}=initialized();assert.throws(()=>g.validateCategory_({name:'Images',color:'#123456',referenceImages:[{assetId:image.id,name:'Bad',mimeType:'image/png',byteSize:10,url:'javascript:alert(1)'}]}),e=>e.code==='VALIDATION');
});
