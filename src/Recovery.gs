var operationBuild_ = null;
function buildSeed_(actor,args,fingerprint,heads) {
 const key=args.operationId+':seed',saved=readRecord_('_OperationPayloads',key);
 if(saved&&(saved.ownerEmail!==actor.email||saved.fingerprint!==fingerprint||saved.baseVaultRevision!==heads.vaultRevision))throw vaultError_('CONFLICT','Operation intent or base changed.');
 return saved||{ownerEmail:actor.email,fingerprint:fingerprint,baseVaultRevision:heads.vaultRevision,time:new Date().toISOString(),salt:Utilities.getUuid()};
}
function preflightEntries_(entries) {
 entries.forEach(function(e){assertValid_(canonicalJson_(e).length<=40000,'record','The stored record envelope is too large.');});
}
/** Immutable payloads and revisions; only a verified COMMITTED row publishes heads. */
function writePayload_(op,key,value) {
  const text=canonicalJson_(value),parts=[];for(let i=0;i<text.length;i+=5000)parts.push(text.slice(i,i+5000));
  const ref={op:op,key:key,count:parts.length,digest:digest_(text)};
  const missing=[];
  parts.forEach(function(part,i){const id=op+':'+key+':'+i,old=readRecord_('_OperationPayloads',id);const row={part:part,index:i,count:parts.length};if(old&&canonicalJson_(old)!==canonicalJson_(row))throw vaultError_('RECOVERY_REQUIRED','Operation payload differs.');if(!old)missing.push([id,canonicalJson_(row)]);});
  if(missing.length)writeRawRows_('_OperationPayloads',readRawRows_('_OperationPayloads').length+1,missing);return ref;
}
function readPayload_(ref) {
  if(!ref||!Number.isInteger(ref.count)||ref.count<1)throw vaultError_('RECOVERY_REQUIRED','Missing operation payload.');
  let text='';for(let i=0;i<ref.count;i++){const r=readRecord_('_OperationPayloads',ref.op+':'+ref.key+':'+i);if(!r||r.count!==ref.count||r.index!==i)throw vaultError_('RECOVERY_REQUIRED','Incomplete operation payload.');text+=r.part;}
  if(digest_(text)!==ref.digest)throw vaultError_('RECOVERY_REQUIRED','Payload checksum mismatch.');return JSON.parse(text);
}
function operations_(){return tableRecords_('_Operations').map(function(r){return r.value;});}
function readCommittedHeads_() {
  const actor=requireOwner_(),prompts={},categories={},revisions=[];let vaultRevision=0;
  const ops=operations_().filter(function(o){return o.status==='COMMITTED';}).sort(function(a,b){return a.targetVaultRevision-b.targetVaultRevision;});
  ops.forEach(function(op){
    if(op.ownerEmail!==actor.email || op.baseVaultRevision!==vaultRevision||op.targetVaultRevision!==vaultRevision+1)throw vaultError_('RECOVERY_REQUIRED','Invalid commit sequence.');
    const manifest=readPayload_(op.manifestRef);manifest.forEach(function(m){
      const entry=readRecord_('_Revisions',m.key);if(!entry||digest_(entry.record)!==m.digest||entry.operationId!==op.operationId||entry.record.ownerEmail!==actor.email)throw vaultError_('RECOVERY_REQUIRED','Committed revision is incomplete.');
      const dest=entry.type==='prompt'?prompts:entry.type==='category'?categories:null;if(!dest)throw vaultError_('RECOVERY_REQUIRED','Invalid entity type.');
      if(entry.record.revision!==(dest[entry.record.id]?dest[entry.record.id].revision+1:1))throw vaultError_('RECOVERY_REQUIRED','Invalid entity revision.');
      dest[entry.record.id]=entry.record;revisions.push(entry);
    });vaultRevision=op.targetVaultRevision;
  });return {vaultRevision:vaultRevision,prompts:Object.values(prompts),categories:Object.values(categories),revisions:revisions};
}
function pendingOperation_(){const a=operations_().filter(function(o){return o.status==='PREPARED';});if(a.length>1)throw vaultError_('RECOVERY_REQUIRED','Multiple pending operations.');return a[0]||null;}
function operationSummary_(op){if(!op)return null;const intent=readPayload_(op.intentRef);return {operationId:op.operationId,kind:op.kind,state:op.status,staged:op.staged||0,total:intent.entries.length,startedAt:op.createdAt,canResume:true,canCancel:op.kind==='import'};}
function commitOperation_(op) {
  const intent=readPayload_(op.intentRef),manifest=[];
  intent.entries.forEach(function(entry){const key=op.operationId+':'+entry.type+':'+entry.record.id;const stored=readRecord_('_Revisions',key);if(!stored||digest_(stored)!==digest_(entry))throw vaultError_('RECOVERY_REQUIRED','Staged revision differs.');manifest.push({key:key,digest:digest_(entry.record)});});
  const heads=readCommittedHeads_();if(heads.vaultRevision!==op.baseVaultRevision)throw vaultError_('CONFLICT','Operation base changed.');
  op.manifestRef=writePayload_(op.operationId,'manifest',manifest);op.ackRef=writePayload_(op.operationId,'ack',intent.ack);op.status='COMMITTED';
  try{putRecord_('_Operations',op.operationId,op);}catch(error){const saved=readRecord_('_Operations',op.operationId);if(!saved||saved.status!=='COMMITTED'||canonicalJson_(saved)!==canonicalJson_(op))throw error;}
  // Verify the entire committed chain before acknowledging. Projections are deliberately optional caches.
  readCommittedHeads_();return readPayload_(op.ackRef);
}
function advanceOperation_(op,maxEntities) {
  if(op.status==='COMMITTED')return readPayload_(op.ackRef);
  const entries=readPayload_(op.intentRef).entries;let done=0;
  for(let i=0;i<entries.length;i++){
    const e=entries[i],key=op.operationId+':'+e.type+':'+e.record.id,old=readRecord_('_Revisions',key);
    if(old){if(digest_(old)!==digest_(e))throw vaultError_('RECOVERY_REQUIRED','Staged payload changed.');continue;}
    if(done>=maxEntities)break;putRecord_('_Revisions',key,e);done++;
  }
  op.staged=entries.filter(function(e){return !!readRecord_('_Revisions',op.operationId+':'+e.type+':'+e.record.id);}).length;
  putRecord_('_Operations',op.operationId,op);
  if(op.staged===entries.length)return commitOperation_(op);return operationSummary_(op);
}
function recoverPending_(){const p=pendingOperation_();if(!p)return null;if(p.kind==='import')return operationSummary_(p);try{return advanceOperation_(p,600);}catch(e){if(['VALIDATION','CONFLICT'].indexOf(e.code)>=0){p.status='ABORTED';putRecord_('_Operations',p.operationId,p);return null;}throw e;}}
function runMutation_(actor,args,build) {
  assertValid_(args&&typeof args.operationId==='string'&&/^[\w-]{1,100}$/.test(args.operationId),'operationId','A valid operation ID is required.');
  const fingerprint=digest_(args),old=readRecord_('_Operations',args.operationId);
  if(old){if(old.kind!=='mutation')throw vaultError_('CONFLICT','Use the matching import controls.');if(old.payloadDigest!==fingerprint||old.ownerEmail!==actor.email)throw vaultError_('CONFLICT','Operation ID was reused.');if(old.status==='COMMITTED')return readPayload_(old.ackRef);if(old.status==='ABORTED')throw vaultError_('CONFLICT','Use a new operation ID.');return advanceOperation_(old,600);}
  const pending=pendingOperation_();if(pending){if(pending.kind==='import')throw vaultError_('BUSY','Resume or cancel the pending import.');recoverPending_();}
  const heads=readCommittedHeads_(),seed=buildSeed_(actor,args,fingerprint,heads);
  let draft;operationBuild_={seed:seed,index:0};
  try{draft=build(heads);}finally{operationBuild_=null;}
  const now=seed.time;
  const entries=draft.map(function(e){return {type:e.type,operationId:args.operationId,record:e.record};});
  preflightEntries_(entries);
  if(!readRecord_('_OperationPayloads',args.operationId+':seed'))putRecord_('_OperationPayloads',args.operationId+':seed',seed);
  const records=entries.map(function(e){return e.record;}),first=records[0];
  const ack=records.length===1?{operationId:args.operationId,id:first.id,revision:first.revision,vaultRevision:heads.vaultRevision+1,committedAt:now,record:first}:{operationId:args.operationId,vaultRevision:heads.vaultRevision+1,committedAt:now,records:records};
  // Preserve generated identities even when the PREPARED-row response is lost.
  const ref=writePayload_(args.operationId,'intent',{entries:entries,ack:ack,payloadDigest:fingerprint});
  const op={operationId:args.operationId,ownerEmail:actor.email,payloadDigest:fingerprint,kind:'mutation',status:'PREPARED',baseVaultRevision:heads.vaultRevision,targetVaultRevision:heads.vaultRevision+1,intentRef:ref,createdAt:now,committedAt:now,staged:0};
  putRecord_('_Operations',op.operationId,op);return advanceOperation_(op,600);
}
