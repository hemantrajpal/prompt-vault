import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadGas,authServices} from './helpers/load-gas.mjs';
function pageFixture(email,props,{templateError=false}={}){
 const s=authServices(email,props);
 const output=html=>({html,title:'',setTitle(title){this.title=title;return this;},addMetaTag(){return this;}});
 const g=loadGas({...s.services,ScriptApp:{getScriptId:()=> 'test-project'},HtmlService:{createHtmlOutput:output,createTemplateFromFile:()=>({evaluate(){if(templateError)throw Error('PRIVATE_INTERNAL_DETAIL');return output('APP_CONTENT');}})}});
 return {g,accesses:s.accesses};
}
for(const [name,email,props,state]of [
 ['blank identity','',{OWNER_EMAIL:'owner@example.test',SPREADSHEET_ID:'fake-sheet'},'access-denied'],
 ['wrong identity','other@example.test',{OWNER_EMAIL:'owner@example.test',SPREADSHEET_ID:'fake-sheet'},'access-denied'],
 ['missing owner','owner@example.test',{SPREADSHEET_ID:'fake-sheet'},'setup-required'],
 ['missing storage','owner@example.test',{OWNER_EMAIL:'owner@example.test'},'setup-required']
])test('entry page distinguishes '+name,()=>{const f=pageFixture(email,props),p=f.g.doGet();assert.match(p.html,new RegExp('data-state="'+state+'"'));assert.equal(f.accesses(),0);if(state==='setup-required'){assert.match(p.html,/OWNER_EMAIL/);assert.match(p.html,/SPREADSHEET_ID/);assert.doesNotMatch(p.html,/<h1>Access denied/);}else{assert.doesNotMatch(p.html,/owner@example.test|fake-sheet|test-project/);}});
test('configured owner receives app content',()=>{const f=pageFixture('owner@example.test',{OWNER_EMAIL:'owner@example.test',SPREADSHEET_ID:'fake-sheet'});assert.equal(f.g.doGet().html,'APP_CONTENT');});
test('unexpected page errors are not presented as an account denial or leaked',()=>{const f=pageFixture('owner@example.test',{OWNER_EMAIL:'owner@example.test',SPREADSHEET_ID:'fake-sheet'},{templateError:true}),p=f.g.doGet();assert.match(p.html,/data-state="load-error"/);assert.doesNotMatch(p.html,/PRIVATE_INTERNAL_DETAIL|<h1>Access denied/);});
