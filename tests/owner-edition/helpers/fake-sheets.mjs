import {createHash,randomUUID} from 'node:crypto';
import {loadGas} from './load-gas.mjs';
export function vaultFixture(){
 const tables=new Map();let writes=0,fail=0,after=false,locked=false;
 function mutate(fn){writes++;if(writes===fail&&!after)throw Error('injected write failure');fn();if(writes===fail&&after)throw Error('injected lost response');}
 const props={OWNER_EMAIL:'owner@example.test',SPREADSHEET_ID:'fake-sheet'};
 const services={Session:{getActiveUser:()=>({getEmail:()=>props.OWNER_EMAIL})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null})},Utilities:{getUuid:randomUUID,DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...createHash('sha256').update(s).digest()].map(n=>n>127?n-256:n)},LockService:{getScriptLock:()=>({tryLock:()=>!locked,releaseLock(){}})},SpreadsheetApp:{openById:()=>({getSheetByName:n=>tables.has(n)?{getName:()=>n}:null,insertSheet(n){mutate(()=>tables.set(n,[]));return {getName:()=>n};},getSheets:()=>[...tables].map(([n])=>({getName:()=>n}))})},Sheets:{Spreadsheets:{Values:{get:(_,range)=>({values:structuredClone(tables.get(range.split('!')[0].replaceAll("'",''))||[])}),update:(body,_,range,options)=>{
  if(options.valueInputOption!=='RAW')throw Error('Expected literal RAW write');
  const [,name,row]=range.match(/^'([^']+)'!A(\d+)/)||[];if(!name)throw Error('Bad range '+range);
  mutate(()=>{const rows=tables.get(name);if(!rows)throw Error('Missing '+name);body.values.forEach((r,i)=>{rows[Number(row)-1+i]=structuredClone(r);});});return {};
 }}}}};
 return {g:loadGas(services),tables,props,failAt(n,lost=false){writes=0;fail=n;after=lost;},clearFailure(){fail=0;writes=0;},writes:()=>writes,lock(){locked=true;}};
}
export function initialized(){const f=vaultFixture();f.g.setupPromptVault_();return f;}
export function success(r){if(!r?.ok)throw Error(JSON.stringify(r));return r.data;}
export function category(g,name='Marketing'){return success(g.saveCategoryV2({operationId:'category-'+name.replace(/\W/g,'-'),expectedRevision:0,record:{name,color:'#f5a623',subcategories:['Email']}})).record;}
