/** Canonical v2 contracts. No Google service calls in validation. */
function canonicalJson_(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson_).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function(k){return JSON.stringify(k)+':'+canonicalJson_(value[k]);}).join(',') + '}';
  return JSON.stringify(value);
}
function digest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, typeof value === 'string' ? value : canonicalJson_(value), Utilities.Charset.UTF_8).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
}
function assertValid_(condition, field, message) {
  if (!condition) { const fields = {}; fields[field] = message; throw vaultError_('VALIDATION','Review the highlighted fields.',fields); }
}
function validateColor_(value) { return /^#[0-9a-f]{6}$/i.test(String(value || '')); }
function validateReferenceUrl_(value) { return /^https:\/\/[^\s/@]+(?:\.[^\s/@]+)(?:[/?#][^\s]*)?$/i.test(String(value || '')) && !/[<>"'\\]/.test(value); }
function textField_(value, max, key, required) {
  assertValid_(value === undefined || typeof value === 'string',key,'Must be text.');
  const s = value === undefined ? '' : value;
  assertValid_(s.length <= max && (!required || s.trim().length > 0),key,'Required text is missing or exceeds '+max+' characters.');return s;
}
function validateVariables_(body, variables) {
  assertValid_(Array.isArray(variables) && variables.length <= 32,'variables','Use at most 32 variables.');
  const seen = {};
  variables.forEach(function(v){
    assertValid_(v && /^[a-z][a-z0-9_]{0,31}$/.test(v.key) && !seen[v.key],'variables','Use unique lowercase variable keys.');seen[v.key]=true;
    assertValid_(['text','multiline'].indexOf(v.type)>=0 && typeof v.required==='boolean','variables','Set variable type and required state.');
    textField_(v.label,80,'variables',true);textField_(v.example,1000,'variables',false);textField_(v.defaultValue,1000,'variables',false);
  });
  const tokens = body.match(/{{[\s\S]*?}}/g) || [];
  tokens.forEach(function(t){assertValid_(/^{{[a-z][a-z0-9_]{0,31}}}$/.test(t) && seen[t.slice(2,-2)],'body','Define each variable token using a valid key.');});
  assertValid_(!body.replace(/{{[\s\S]*?}}/g,'').match(/{{|}}/),'body','Close each variable token.');
  return variables.map(function(v){const x={key:v.key,label:v.label,type:v.type,required:v.required,example:v.example||''};if(v.defaultValue!==undefined)x.defaultValue=v.defaultValue;return x;});
}
function validatePrompt_(input) {
  const r=Object.assign({},input);
  r.title=textField_(r.title,160,'title',true);r.body=textField_(r.body,20000,'body',true);
  r.notes=textField_(r.notes,4000,'notes',false);r.negativePrompt=textField_(r.negativePrompt,4000,'negativePrompt',false);
  r.subcategory=textField_(r.subcategory,80,'subcategory',false);r.model=textField_(r.model,100,'model',false);
  r.variables=validateVariables_(r.body,r.variables||[]);
  assertValid_(Array.isArray(r.tags||[]) && (r.tags||[]).length<=20,'tags','Use at most 20 tags.');r.tags=(r.tags||[]).map(function(t){return textField_(t,40,'tags',true);});
  r.status=r.status||'active';assertValid_(['active','archived'].indexOf(r.status)>=0,'status','Invalid status.');
  r.workflow=r.workflow||null;if(r.workflow)validateWorkflow_(r.workflow);r.attachments=r.attachments||[];r.legacyImageUrl=r.legacyImageUrl||'';
  assertValid_(Array.isArray(r.attachments),'attachments','Invalid attachment references.');
  assertValid_(!r.legacyImageUrl||validateReferenceUrl_(r.legacyImageUrl),'legacyImageUrl','Use an HTTPS reference URL.');
  assertValid_(canonicalJson_(r).length<=40000,'record','This record is too large.');return r;
}
function validateCategory_(input) {
  const r=Object.assign({},input);r.name=textField_(r.name,80,'name',true).trim();
  assertValid_(validateColor_(r.color),'color','Use a six-digit hex color.');
  assertValid_(Array.isArray(r.subcategories||[]) && (r.subcategories||[]).length<=100,'subcategories','Use at most 100 subcategories.');
  r.subcategories=(r.subcategories||[]).map(function(s){return textField_(s,80,'subcategories',true).trim();});
  assertValid_(new Set(r.subcategories.map(function(s){return s.toLowerCase();})).size===r.subcategories.length,'subcategories','Subcategory names must be unique.');
  if(r.referenceImages!==undefined){assertValid_(Array.isArray(r.referenceImages)&&r.referenceImages.length<=100,'referenceImages','Use at most 100 category images.');r.referenceImages=r.referenceImages.map(function(a){assertValid_(a&&typeof a.assetId==='string'&&/^[\w-]{10,100}$/.test(a.assetId)&&a.url==='https://drive.google.com/thumbnail?id='+a.assetId+'&sz=w1200','referenceImages','Use a valid Drive image reference.');textField_(a.name,200,'referenceImages',true);assertValid_(['image/png','image/jpeg','image/webp'].indexOf(a.mimeType)>=0&&Number.isInteger(a.byteSize)&&a.byteSize>=0,'referenceImages','Invalid image metadata.');return Object.assign({},a);});}
  r.status=r.status||'active';assertValid_(['active','archived'].indexOf(r.status)>=0,'status','Invalid status.');assertValid_(canonicalJson_(r).length<=40000,'record','This category is too large.');return r;
}
