import {readdir,readFile,mkdir,copyFile,stat,writeFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const out=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out')||!out)throw new Error('Usage: node scripts/baseline.mjs --out <private directory>');
const root=process.cwd(),dest=resolve(out),rows=[];
if(dest===root||['src','Prompt_app'].some(n=>dest.startsWith(join(root,n))))throw new Error('Choose a separate backup directory');
for(const folder of ['src','Prompt_app']){
 for(const name of await readdir(join(root,folder))){
  if(name.startsWith('._'))continue;
  const file=join(root,folder,name),s=await stat(file);if(!s.isFile())continue;
  const target=join(dest,folder,name);await mkdir(join(dest,folder),{recursive:true});await copyFile(file,target);
  rows.push({path:relative(root,file),sha256:createHash('sha256').update(await readFile(file)).digest('hex'),mode:s.mode&0o777});
 }
}
await writeFile(join(dest,'manifest.json'),JSON.stringify(rows,null,2)+'\n');
console.log(`Preserved ${rows.length} source files. Deployment/data not accessed.`);
