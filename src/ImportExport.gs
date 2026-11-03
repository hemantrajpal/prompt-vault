function configImport_(){return settings_();}
function validateImportRecord_(r,bundle,config){
 assertValid_(r.schemaVersion===2&&typeof r.ownerEmail==='string'&&!!r.ownerEmail&&typeof r.createdBy==='string'&&!!r.createdBy,'ownerEmail','Missing source ownership.');
 if(bundle.sourceInstallId===config.installId)assertValid_(r.ownerEmail===config.ownerEmail&&r.createdBy===config.ownerEmail,'ownerEmail','Same-install ownership does not match.');
 assertValid_(typeof r.createdAt==='string'&&Number.isFinite(Date.parse(r.createdAt))&&typeof r.modifiedAt==='string'&&Number.isFinite(Date.parse(r.modifiedAt)),'createdAt','Invalid source dates.');
 if(r.attachments)assertValid_(Array.isArray(r.attachments)&&r.attachments.every(function(a){return a&&typeof a.assetId==='string'&&typeof a.sourceInstallId==='string'&&typeof a.checksum==='string'&&Number.isInteger(a.byteSize)&&a.byteSize>=0&&['image/png','image/jpeg','image/webp'].indexOf(a.mimeType)>=0;}),'attachments','Invalid attachment provenance.');
 if(r.workflow){assertValid_(r.workflow.reviewStatus==='draft','workflow','Imported approval/testing claims require local review; downgrade to draft before import.');validateWorkflow_(r.workflow);}
}
function validateWorkflow_(w){
 ['packId','contentVersion','job','requiredContext','example','expectedOutput','contentOwner'].forEach(function(k){assertValid_(typeof w[k]==='string'&&w[k].trim().length>0,'workflow','Complete workflow guidance.');});
 assertValid_(Array.isArray(w.reviewChecklist)&&w.reviewChecklist.length>0&&w.reviewChecklist.every(function(s){return typeof s==='string';})&&Array.isArray(w.limits)&&w.limits.every(function(s){return typeof s==='string';}),'workflow','Provide a review checklist and known limits.');
 assertValid_(['draft','tested','approved'].indexOf(w.reviewStatus)>=0,'workflow','Invalid review state.');
}
function bundleChecksum_(bundle){const clean=Object.assign({},bundle);delete clean.checksum;return digest_(clean);}
function bundleSize_(bundle){return unescape(encodeURIComponent(canonicalJson_(bundle))).length;}
function exportVaultV2(){return rpc_(function(){return withVaultLock_(function(){const c=settings_(),h=readCommittedHeads_(),bundle={schemaVersion:2,exportedAt:new Date().toISOString(),sourceInstallId:c.installId,sourceVaultRevision:h.vaultRevision,categories:h.categories,prompts:h.prompts,quarantineManifest:tableRecords_('_Quarantine').filter(function(r){return r.key.endsWith(':0');}).map(function(r){return {quarantineId:r.value.quarantineId,reason:r.value.reason,checksum:r.value.checksum,chunkCount:r.value.chunkCount};})};assertValid_(bundleSize_(bundle)<=5*1024*1024,'bundle','The current export exceeds 5 MiB.');bundle.checksum=bundleChecksum_(bundle);return bundle;});});}
function previewImportV2(bundle){return rpc_(function(actor){return withVaultLock_(function(){
 settings_();assertValid_(bundle&&bundle.schemaVersion===2&&!bundle.kind,'bundle','Import a current-head version 2 bundle. History archives use the clone restore guide.');
 assertValid_(Array.isArray(bundle.prompts)&&Array.isArray(bundle.categories)&&bundle.prompts.length<=500&&bundle.categories.length<=100&&bundleSize_(bundle)<=5*1024*1024,'bundle','Bundle structure or size is invalid.');
 assertValid_(bundle.checksum===bundleChecksum_(bundle),'checksum','Bundle checksum does not match.');
 const h=readCommittedHeads_(),issues=[],items=[],ids={};
 bundle.categories.concat(bundle.prompts).forEach(function(r){assertValid_(r&&typeof r.id==='string'&&!ids[r.id],'bundle','Duplicate or missing entity ID.');ids[r.id]=true;});
 bundle.categories.forEach(function(c){try{validateImportRecord_(c,bundle,configImport_());validateCategory_(c);items.push({type:'category',id:c.id,title:c.name});}catch(e){issues.push({id:c.id,fieldErrors:e.fieldErrors||{},reason:'Invalid category'});}});
 bundle.prompts.forEach(function(p){try{validateImportRecord_(p,bundle,configImport_());validatePrompt_(p);assertValid_(bundle.categories.some(function(c){return c.id===p.categoryId&&(p.status==='archived'||c.status==='active');}),'categoryId','Category reference is missing.');items.push({type:'prompt',id:p.id,title:p.title});}catch(e){issues.push({id:p.id,fieldErrors:e.fieldErrors||{},reason:'Invalid prompt'});}});
 issues.forEach(function(issue){const raw=bundle.prompts.concat(bundle.categories).find(function(r){return r.id===issue.id;});writeQuarantine_(actor.email,bundle.checksum,issue.id,issue.reason,raw);});
 const planId=Utilities.getUuid(),bundleRef=writePayload_(planId,'bundle',bundle),plan={planId:planId,ownerEmail:actor.email,bundleRef:bundleRef,bundleDigest:bundle.checksum,baseVaultRevision:h.vaultRevision,expiresAt:new Date(Date.now()+30*60*1000).toISOString(),items:items,issues:issues};
 // Large preview lists are chunked too; the plan record contains only a reference.
 const detailRef=writePayload_(planId,'preview',{items:items,issues:issues});putRecord_('_ImportPlans',planId,{planId:planId,ownerEmail:actor.email,bundleRef:bundleRef,detailRef:detailRef,bundleDigest:plan.bundleDigest,baseVaultRevision:plan.baseVaultRevision,expiresAt:plan.expiresAt});return plan;
 });});}
function beginImportV2(args){return rpc_(function(actor){return withVaultLock_(function(){
 const config=settings_();assertValid_(args&&typeof args.operationId==='string'&&/^[\w-]{1,100}$/.test(args.operationId),'operationId','Invalid operation ID.');
 const fingerprint=digest_(args),old=readRecord_('_Operations',args.operationId);if(old){if(old.ownerEmail!==actor.email||old.payloadDigest!==fingerprint||old.kind!=='import')throw vaultError_('CONFLICT','Operation ID reused.');return operationSummary_(old)||{operationId:old.operationId,state:old.status};}
 if(pendingOperation_())throw vaultError_('BUSY','Finish the pending operation first.');
 const plan=readRecord_('_ImportPlans',args.planId),h=readCommittedHeads_();assertValid_(plan&&plan.ownerEmail===actor.email&&Date.parse(plan.expiresAt)>Date.now(),'planId','Import preview expired or unavailable.');if(plan.baseVaultRevision!==h.vaultRevision)throw vaultError_('CONFLICT','Preview is stale.');
 const bundle=readPayload_(plan.bundleRef),detail=readPayload_(plan.detailRef);assertValid_(!detail.issues.length,'bundle','Resolve invalid records before import.');
 const foreign=bundle.sourceInstallId!==config.installId;
 assertValid_(!foreign||args.selections&&args.selections.adoptAsCopy===true,'selections','Explicitly adopt foreign content as new owned copies.');
 const seed=buildSeed_(actor,args,fingerprint,h);operationBuild_={seed:seed,index:0};
 const idMap={},entries=[],now=seed.time;
 function imported(type,r){
   const old=!foreign?(type==='category'?h.categories:h.prompts).find(function(x){return x.id===r.id;}):null;
   if(old){if(canonicalJson_(old)===canonicalJson_(r))return old;assertValid_(args.selections&&args.selections.updateMatching===true,'selections','Explicitly select matching-record updates.');if(old.revision!==r.revision)throw vaultError_('CONFLICT','Imported version differs from saved revision.');}
   const metadata=metadata_(actor,old),value=Object.assign({},r,metadata);
   if(!foreign&&!old){value.id=r.id;value.createdAt=r.createdAt;value.createdBy=actor.email;value.provenance=r.provenance||null;}
   else if(foreign){value.provenance={sourceInstallId:bundle.sourceInstallId,sourceEntityId:r.id,sourceOwnerEmail:r.ownerEmail||'',sourceCreatedAt:r.createdAt||'',sourceModifiedAt:r.modifiedAt||'',importedAt:now,bundleDigest:bundle.checksum,legacyLocation:null};}
   if(type==='prompt')value.categoryId=idMap[r.categoryId];
   const valid=type==='prompt'?validatePrompt_(value):validateCategory_(value);entries.push({type:type,operationId:args.operationId,record:valid});return valid;
 }
 try{bundle.categories.forEach(function(c){idMap[c.id]=imported('category',c).id;});bundle.prompts.forEach(function(p){imported('prompt',p);});}finally{operationBuild_=null;}
 assertValid_(h.prompts.length+entries.filter(function(e){return e.type==='prompt'&&!h.prompts.some(function(p){return p.id===e.record.id;});}).length<=500,'bundle','Import exceeds 500 prompt heads.');
 assertValid_(h.categories.length+entries.filter(function(e){return e.type==='category'&&!h.categories.some(function(c){return c.id===e.record.id;});}).length<=100,'bundle','Import exceeds 100 categories.');
 assertValid_(entries.length>0,'bundle','No changed records selected.');
 preflightEntries_(entries);if(!readRecord_('_OperationPayloads',args.operationId+':seed'))putRecord_('_OperationPayloads',args.operationId+':seed',seed);
 const ack={operationId:args.operationId,vaultRevision:h.vaultRevision+1,committedAt:now,records:entries.map(function(e){return e.record;})};
 const ref=writePayload_(args.operationId,'intent',{entries:entries,ack:ack,payloadDigest:fingerprint});
 const op={operationId:args.operationId,ownerEmail:actor.email,payloadDigest:fingerprint,kind:'import',status:'PREPARED',baseVaultRevision:h.vaultRevision,targetVaultRevision:h.vaultRevision+1,intentRef:ref,createdAt:now,committedAt:now,staged:0};putRecord_('_Operations',op.operationId,op);return operationSummary_(op);
 });});}
function advanceImportV2(args){return rpc_(function(actor){return withVaultLock_(function(){settings_();const op=readRecord_('_Operations',args.operationId);assertValid_(op&&op.ownerEmail===actor.email&&op.kind==='import','operationId','Import unavailable.');if(op.status==='ABORTED')throw vaultError_('CONFLICT','Import was cancelled.');return advanceOperation_(op,25);});});}
function getOperationV2(args){return rpc_(function(actor){return withVaultLock_(function(){settings_();const op=readRecord_('_Operations',args.operationId);assertValid_(op&&op.ownerEmail===actor.email,'operationId','Operation unavailable.');return operationSummary_(op);});});}
function cancelImportV2(args){return rpc_(function(actor){return withVaultLock_(function(){settings_();const op=readRecord_('_Operations',args.operationId);assertValid_(op&&op.ownerEmail===actor.email&&op.kind==='import','operationId','Import unavailable.');if(op.status==='COMMITTED')throw vaultError_('CONFLICT','Committed import cannot be cancelled.');if(op.status!=='ABORTED'){op.status='ABORTED';putRecord_('_Operations',op.operationId,op);}return {operationId:op.operationId,state:'ABORTED'};});});}
function exportPage_(args,kind){
 const h=readCommittedHeads_();let offset=0;
 if(args&&args.cursor){let cursor;try{cursor=JSON.parse(args.cursor);}catch(_){throw vaultError_('VALIDATION','Invalid export cursor.');}assertValid_(Number.isInteger(cursor.offset)&&cursor.offset>=0,'cursor','Invalid cursor.');if(cursor.revision!==h.vaultRevision)throw vaultError_('CONFLICT','Vault changed during export.');offset=cursor.offset;}
 const rows=[];
 if(kind==='history'){
  const committed=operations_().filter(function(o){return o.status==='COMMITTED';}),opIds=new Set(committed.map(function(o){return o.operationId;}));
  committed.forEach(function(o){rows.push({table:'_Operations',key:o.operationId,value:o});});
  tableRecords_('_OperationPayloads').filter(function(r){return opIds.has(r.key.split(':')[0]);}).forEach(function(r){rows.push({table:'_OperationPayloads',key:r.key,value:r.value});});
  tableRecords_('_Revisions').filter(function(r){return opIds.has(r.value.operationId);}).forEach(function(r){rows.push({table:'_Revisions',key:r.key,value:r.value});});
 }else tableRecords_('_Quarantine').forEach(function(r){rows.push({table:'_Quarantine',key:r.key,value:r.value});});
 const page=rows.slice(offset,offset+25);return {kind:kind,sourceInstall:settings_(),vaultRevision:h.vaultRevision,rows:page,total:rows.length,archiveChecksum:digest_(rows),pageChecksum:digest_(page),nextCursor:offset+25<rows.length?JSON.stringify({offset:offset+25,revision:h.vaultRevision}):null};
}
function exportHistoryV2(args){return rpc_(function(){return withVaultLock_(function(){settings_();return exportPage_(args,'history');});});}
function exportQuarantineV2(args){return rpc_(function(){return withVaultLock_(function(){settings_();return exportPage_(args,'quarantine');});});}
function writeQuarantine_(ownerEmail,source,location,reason,raw){
 const id=digest_({source:source,location:location,reason:reason,raw:raw}).slice(0,32),text=canonicalJson_(raw),count=Math.ceil(text.length/5000)||1;
 for(let i=0;i<count;i++)putRecord_('_Quarantine',id+':'+i,{quarantineId:id,ownerEmail:ownerEmail,bundleDigest:source,sourceLocation:location,reason:reason,chunkIndex:i,chunkCount:count,payloadChunk:text.slice(i*5000,(i+1)*5000),checksum:digest_(text),createdAt:new Date().toISOString()});return id;
}
function exportLegacy_(){
 requireOwner_();const ss=SpreadsheetApp.openById(sheetId_());const snapshot={exportedAt:new Date().toISOString(),tabs:ss.getSheets().filter(function(s){return VAULT_TABLES_.indexOf(s.getName())<0;}).map(function(s){const range=s.getDataRange();return {name:s.getName(),rows:range.getValues().map(function(row){return row.map(function(v){return v instanceof Date?v.toISOString():v;});}),formulas:range.getFormulas()};})};snapshot.checksum=digest_(snapshot);return snapshot;
}
function previewLegacyMigration_(snapshot){
 const actor=requireOwner_();assertValid_(snapshot&&Array.isArray(snapshot.tabs),'snapshot','A raw legacy snapshot is required.');
 const source='legacy-'+digest_(snapshot),config=snapshot.tabs.find(function(t){return t.name==='Config';}),categories=[],prompts=[],quarantine=[],categoryMap={},candidates=[];
 function reject(location,reason,raw){quarantine.push({sourceLocation:location,reason:reason,raw:raw});}
 ((config&&config.rows)||[]).forEach(function(row){if(String(row[0]).indexOf('category_')===0){const name=String(row[0]).slice(9),sub=((config.rows.find(function(r){return r[0]==='subcategory_'+name;})||[])[1]||'');try{const c=validateCategory_(Object.assign(metadata_(actor,null),{name:name,color:String(row[1]),subcategories:String(sub).split(',').map(function(s){return s.trim();}).filter(Boolean),status:'active'}));categoryMap[name]=c;categories.push(c);}catch(_){reject('Config:'+name,'Invalid category',row);}}});
 snapshot.tabs.forEach(function(tab){
  if(tab.name==='Config'||tab.name==='_Index')return;
  if(!categoryMap[tab.name]&&tab.name!=='_Archive'){reject(tab.name,'Orphan or unrecognized legacy tab',tab);return;}
  const headers=tab.rows[0]||[];
  tab.rows.slice(1).forEach(function(row,index){const raw={};headers.forEach(function(k,i){raw[k]=row[i];});candidates.push({raw:raw,row:row,tab:tab,index:index+2,location:tab.name+':'+(index+2)});});
 });
 const counts={};candidates.forEach(function(c){counts[c.raw.PromptID]=(counts[c.raw.PromptID]||0)+1;});
 candidates.forEach(function(c){const r=c.raw;try{
  assertValid_(r.PromptID&&counts[r.PromptID]===1,'id','Duplicate or missing prompt ID.');assertValid_(String(r.CreatedBy||'').trim().toLowerCase()===actor.email,'ownerEmail','Missing or foreign creator.');
  assertValid_(!c.tab.formulas||!(c.tab.formulas[c.index-1]||[]).some(Boolean),'formula','Active formula requires review.');
  assertValid_(Number.isFinite(Date.parse(r.CreatedAt))&&Number.isFinite(Date.parse(r.ModifiedAt)),'dates','Creation/modification dates require review.');
  let category=categoryMap[c.tab.name];if(c.tab.name==='_Archive'){const name=String(r.OriginalCategory||'Legacy archive');category=categoryMap[name];if(!category){category=validateCategory_(Object.assign(metadata_(actor,null),{name:name,color:'#64748b',subcategories:[],status:'archived'}));categoryMap[name]=category;categories.push(category);}}
  const variables=(typeof r.Variables==='string'?JSON.parse(r.Variables||'[]'):r.Variables||[]).map(function(v){return {key:v.key||v.n||v.name,label:v.label||v.l||v.key||v.n||v.name,type:v.type||'text',required:v.required===undefined?true:v.required,example:v.example||v.p||v.placeholder||''};});
  const p=validatePrompt_(Object.assign(metadata_(actor,null),{id:String(r.PromptID),categoryId:category.id,subcategory:String(r.Subcategory||''),title:String(r.Title||''),body:String(r.Prompt||''),tags:String(r.Tags||'').split(',').map(function(t){return t.trim();}).filter(Boolean),variables:variables,model:String(r.Model||''),legacyImageUrl:String(r.ImageURL||''),notes:typeof r.ImprovementNotes==='string'?r.ImprovementNotes:JSON.stringify(r.ImprovementNotes||''),negativePrompt:String(r.NegativePrompt||''),status:c.tab.name==='_Archive'?'archived':'active',createdBy:actor.email,createdAt:new Date(r.CreatedAt).toISOString(),modifiedAt:new Date(r.ModifiedAt).toISOString(),provenance:{sourceInstallId:source,sourceEntityId:String(r.PromptID),sourceOwnerEmail:r.CreatedBy,sourceCreatedAt:r.CreatedAt,sourceModifiedAt:r.ModifiedAt,importedAt:null,bundleDigest:digest_(snapshot),legacyLocation:c.location}}));
  if(p.subcategory&&category.subcategories.indexOf(p.subcategory)<0)throw vaultError_('VALIDATION','Unmapped subcategory.');prompts.push(p);
 }catch(e){reject(c.location,e.message,c.raw);}});
 const bundle={schemaVersion:2,sourceInstallId:source,sourceVaultRevision:0,exportedAt:new Date().toISOString(),categories:categories,prompts:prompts,quarantineManifest:[]};bundle.checksum=bundleChecksum_(bundle);return {bundle:bundle,quarantine:quarantine,sourceChecksum:digest_(snapshot)};
}
