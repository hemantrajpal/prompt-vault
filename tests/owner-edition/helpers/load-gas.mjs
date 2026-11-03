import vm from 'node:vm';
import {readFileSync,readdirSync} from 'node:fs';
export function loadGas(services={},files){
 const ctx=vm.createContext({console,...services});
 for(const name of files||readdirSync('src').filter(n=>n.endsWith('.gs')&&!n.startsWith('._'))){
  new vm.Script(readFileSync('src/'+name,'utf8'),{filename:name}).runInContext(ctx);
 }
 return ctx;
}
export function authServices(email='',props={}){
 let accesses=0;
 return {services:{Session:{getActiveUser:()=>({getEmail:()=>email})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null})},SpreadsheetApp:{openById(){accesses++;throw Error('DATA_ACCESS');}},DriveApp:new Proxy({},{get(){accesses++;throw Error('DRIVE_ACCESS');}}),UrlFetchApp:{fetch(){accesses++;throw Error('PROVIDER_ACCESS');}}},accesses:()=>accesses};
}
export function publicNames(){return readdirSync('src').filter(n=>n.endsWith('.gs')&&!n.startsWith('._')).flatMap(n=>[...readFileSync('src/'+n,'utf8').matchAll(/^function\s+([\w]+)\s*\(/gm)].map(m=>m[1])).filter(n=>!n.endsWith('_')&&n!=='doGet');}
