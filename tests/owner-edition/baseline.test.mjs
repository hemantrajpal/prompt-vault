import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('baseline preserves both trees and ignores macOS resource forks',async()=>{
 const out=await mkdtemp(join(tmpdir(),'vault-baseline-'));
 const run=spawnSync(process.execPath,['scripts/baseline.mjs','--out',out],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 const rows=JSON.parse(await readFile(join(out,'manifest.json'),'utf8'));
 assert(rows.some(r=>r.path==='src/Code.gs'));assert(rows.some(r=>r.path==='Prompt_app/Code.gs'));
 assert(!rows.some(r=>r.path.includes('._')));
 assert.equal(await readFile(join(out,'src/Code.gs'),'utf8'),await readFile('src/Code.gs','utf8'));
});
